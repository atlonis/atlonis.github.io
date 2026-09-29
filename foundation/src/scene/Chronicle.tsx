import { type CSSProperties, useCallback, useEffect, useMemo, useRef } from 'react'
import { ScrollControls, useScroll } from '@react-three/drei'
import { invalidate, useFrame, useStore as useR3FStore, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import type { DataIndex } from '../data/indexDataset'
import { useStore } from '../state/store'
import { tweenTo } from './anim'
import { activeEraFor, chronicleCamera, eraSpacing, eraStops, nearestStop, smoothstep } from './layout'
import { tweenPalette } from './palette'
import { getLastOffset, markAlive, NAV_DURATION, setLastOffset, useSceneStore } from './sceneStore'

const SETTLE_IDLE_MS = 150
const SETTLE_RANGE = 0.3
const SETTLE_DURATION = 0.4
const TILT_RANGE = 0.35
const STOP_EPS = 0.02

/** Начальные стили scroll-div drei на телефоне с открытой карточкой: эффекты drei при монтировании выполняются позже эффектов CameraRig и перезаписали бы overflow. */
const BLOCKED_STYLE: CSSProperties = { overflowY: 'hidden', touchAction: 'pinch-zoom' }

/** Цель, к которой drei демпфирует offset (state.scroll). В публичный тип не входит; версия drei зафиксирована точной. */
type ScrollTarget = { scroll: { current: number } }

function CameraRig({ index, blocked }: { index: DataIndex; blocked: boolean }) {
  const scroll = useScroll()
  const camera = useThree((s) => s.camera)
  const r3f = useR3FStore()
  const stops = useMemo(() => eraStops(index.eras), [index])
  const spacing = eraSpacing(stops.length)
  const eraId = useStore((s) => s.eraId)
  const setEra = useStore((s) => s.setEra)
  const active = useRef(useSceneStore.getState().activeEraId || eraId)
  const lastScrollAt = useRef(0)
  const lastTop = useRef(-1)
  // Палец или ползунок скроллбара прижаты: дотягивание не начинаем, даже если scrollTop стоит на месте.
  const held = useRef(false)
  // blocked (телефон + открытая карточка) читаем через ref, чтобы слушатели ввода не пересоздавались.
  const blockedRef = useRef(blocked)
  const settleTimer = useRef<number | null>(null)
  const settling = useRef<gsap.core.Tween | null>(null)
  // Пока камера не доехала до эры из URL (первый полёт после монтирования), кадры на t=0 не должны менять эру, палитру и URL.
  // Сбрасывается в useFrame, когда демпфированный offset дошёл до цели полёта (при reduced-motion твин завершается мгновенно, а offset ещё нет).
  const arriving = useRef(true)
  const arrivalT = useRef<number | null>(null)

  const scrollToEra = useCallback(
    (id: string, duration: number) => {
      const stop = stops.find((s) => s.id === id)
      if (!stop) { arriving.current = false; return }
      if (arriving.current) arrivalT.current = stop.t
      const el = scroll.el
      const max = el.scrollHeight - el.clientHeight
      settling.current?.kill()
      let finished = false
      const tw = tweenTo(el, {
        scrollTop: stop.t * max,
        duration,
        ease: 'power2.inOut',
        // drei игнорирует первое scroll-событие после (пере)подключения событий; при reduced-motion оно единственное. Кормим цель демпфирования напрямую.
        onUpdate: () => { if (max > 0) (scroll as unknown as ScrollTarget).scroll.current = el.scrollTop / max },
        onComplete: () => { finished = true; settling.current = null },
      })
      // При reduced-motion (duration 0) GSAP завершает твин прямо в gsap.to(): onComplete уже отработал (progress() у такого твина 0), готовый твин хранить нельзя.
      settling.current = finished ? null : tw
    },
    [scroll, stops],
  )

  // R3F 9.8 при каждом рендере Canvas возвращает события своему div, а drei слушает скролл, только пока events.connected === scroll.el.
  // Возвращаем события на scroll.el; через микрозадачу — иначе вложенный connect() посреди чужого connect() задвоит слушатели.
  useEffect(() => {
    const el = scroll.el
    let pending = false
    return r3f.subscribe((state) => {
      const { connected } = state.events
      if (!connected || connected === el || pending || !el.isConnected) return
      pending = true
      queueMicrotask(() => {
        pending = false
        const { events } = r3f.getState()
        if (el.isConnected && events.connected !== el) events.connect?.(el)
      })
    })
  }, [r3f, scroll])

  // Регистрация для EraNav и deep-link; стартовая позиция — эра из URL (через rAF: первое scroll-событие drei игнорирует).
  // Если Canvas перемонтирован (смена тира) или пользователь вернулся из «Списка» и эра в URL не менялась, берём сохранённую позицию нити
  // мгновенно: полёт из t=0 к последней зафиксированной эре откатил бы пользователя назад.
  useEffect(() => {
    useSceneStore.setState({ scrollToEra })
    scroll.el.dataset.testid = 'thread-scroll' // стабильный крючок для Playwright: scroll-div создаёт drei
    const raf = requestAnimationFrame(() => {
      const eraNow = useStore.getState().eraId
      const saved = useSceneStore.getState().tierLocked ? getLastOffset(eraNow) : null
      const el = scroll.el
      const max = el.scrollHeight - el.clientHeight
      if (saved !== null && max > 0) {
        el.scrollTop = saved * max
        // Как в scrollToEra: первое scroll-событие drei игнорирует, а offset демпфируется от нуля, поэтому выставляем и цель, и сам offset.
        ;(scroll as unknown as ScrollTarget).scroll.current = saved
        scroll.offset = saved
        arriving.current = false
        invalidate()
        return
      }
      scrollToEra(eraNow, NAV_DURATION)
    })
    return () => {
      cancelAnimationFrame(raf)
      useSceneStore.setState({ scrollToEra: undefined })
    }
  }, [scrollToEra])

  // Внешняя смена эры (hashchange, карточка планеты другой эры) → едем к остановке. Сравниваем с реальной позицией скролла:
  // active.current в мёртвой зоне между дотягиванием и гистерезисом уже указывает на ближайшую эру, а eraId ещё старый.
  useEffect(() => {
    if (arriving.current) {
      // Первый полёт уже запущен (rAF отработал, arrivalT задан): перенацеливаем его на новую эру, иначе по прибытии кадр на старой остановке вернул бы старую эру в URL.
      // До rAF ничего не делаем: колбэк читает свежий eraId сам.
      if (arrivalT.current !== null) scrollToEra(eraId, NAV_DURATION)
      return
    }
    const stop = stops.find((s) => s.id === eraId)
    if (!stop) return
    if (Math.abs(scroll.offset - stop.t) > STOP_EPS * spacing) scrollToEra(eraId, NAV_DURATION)
  }, [eraId, scrollToEra, scroll, stops, spacing])

  useEffect(() => { blockedRef.current = blocked }, [blocked])

  // Живой ввод пользователя отменяет полёт GSAP, чтобы колесо и палец не боролись с твином. При открытой карточке на телефоне
  // (blocked) скролл заблокирован, и тап по сцене не должен прерывать полёт, начатый открытием карточки другой эры.
  // held не зависит от blocked. Касания ведём по touch-событиям: когда браузер берёт жест на прокрутку, он шлёт pointercancel,
  // хотя палец ещё прижат. Указатели мыши и пера ведём по pointer-событиям. Отпускание слушаем на window: pointerup после
  // перетаскивания скроллбара до el может не дойти.
  useEffect(() => {
    const el = scroll.el
    const stopTween = () => {
      if (blockedRef.current) return
      settling.current?.kill()
      settling.current = null
      arriving.current = false
    }
    const press = (e: Event) => {
      // Правая и средняя кнопки не начинают жест прокрутки, а pointerup после контекстного меню (macOS) может не прийти: held залип бы.
      if (e.type === 'pointerdown' && (e as PointerEvent).button !== 0) return
      if (e.type !== 'pointerdown' || (e as PointerEvent).pointerType !== 'touch') held.current = true
      stopTween()
    }
    const release = (e: Event) => {
      if (e.type.startsWith('pointer') ? (e as PointerEvent).pointerType === 'touch' : (e as TouchEvent).touches.length > 0) return
      held.current = false
      invalidate()
    }
    const opts = { passive: true }
    el.addEventListener('wheel', stopTween, opts)
    el.addEventListener('touchstart', press, opts)
    el.addEventListener('pointerdown', press, opts)
    const ups = ['pointerup', 'pointercancel', 'touchend', 'touchcancel'] as const
    ups.forEach((type) => window.addEventListener(type, release, opts))
    return () => {
      el.removeEventListener('wheel', stopTween)
      el.removeEventListener('touchstart', press)
      el.removeEventListener('pointerdown', press)
      ups.forEach((type) => window.removeEventListener(type, release))
      held.current = false
    }
  }, [scroll])

  // Телефон с открытой карточкой: блокируем нативный скролл, а не события drei (enabled=false глушил бы и программные полёты).
  // Запись scrollTop при overflow: hidden по-прежнему рождает scroll-события, твины работают.
  useEffect(() => {
    const el = scroll.el
    el.style.overflowY = blocked ? 'hidden' : 'auto'
    el.style.touchAction = blocked ? 'pinch-zoom' : ''
    return () => {
      el.style.overflowY = 'auto'
      el.style.touchAction = ''
    }
  }, [blocked, scroll])

  useFrame(() => {
    const t = scroll.offset
    const { stop, dist } = nearestStop(stops, t)
    const tilt = 1 - smoothstep(0, TILT_RANGE * spacing, dist)
    const { position, target } = chronicleCamera(t, tilt)
    camera.position.set(position[0], position[1], position[2])
    camera.lookAt(target[0], target[1], target[2])

    if (arriving.current && arrivalT.current !== null && !settling.current && Math.abs(t - arrivalT.current) <= STOP_EPS * spacing) arriving.current = false

    const next = arriving.current ? active.current : activeEraFor(stops, t, active.current)
    if (next !== active.current) {
      active.current = next
      useSceneStore.getState().setActiveEra(next)
      const era = index.eras.find((e) => e.id === next)
      if (era) tweenPalette(era.palette.primary, era.palette.glow)
    }

    // Покой определяем по нативному scrollTop: scroll.delta у drei демпфируется дважды, его «хвост» тянется около секунды.
    const el = scroll.el
    const top = el.scrollTop
    const max = el.scrollHeight - el.clientHeight
    const nativeT = max > 0 ? top / max : 0
    if (top !== lastTop.current) {
      lastTop.current = top
      markAlive()
      lastScrollAt.current = performance.now()
      if (settleTimer.current) clearTimeout(settleTimer.current)
      // После остановки демпфирования кадров нет — просим один, чтобы проверить дотягивание.
      settleTimer.current = window.setTimeout(() => invalidate(), SETTLE_IDLE_MS + 30)
    } else if (!settling.current && !held.current && performance.now() - lastScrollAt.current > SETTLE_IDLE_MS) {
      // Дотягиваем по нативной позиции, а не по offset: через 150 мс демпфированный offset ещё отстаёт и вернул бы камеру назад.
      const rest = nearestStop(stops, nativeT)
      if (rest.dist > STOP_EPS * spacing && rest.dist < SETTLE_RANGE * spacing) scrollToEra(rest.stop.id, SETTLE_DURATION)
    }

    // URL и стор — только на остановке и не во время полёта к другой эре. Нативный скролл должен стоять на той же остановке:
    // при мгновенном твине (reduced-motion) камера ещё на старой, и без этой проверки стор откатывался бы к ней.
    if (!arriving.current && !settling.current && dist <= STOP_EPS * spacing && Math.abs(nativeT - stop.t) <= STOP_EPS * spacing && useStore.getState().eraId !== stop.id) setEra(stop.id)

    // Позиция нити для перемонтирования (смена тира, возврат из «Списка»). Не пишем, пока камера не доехала до эры из URL: кадры на t=0 затёрли бы сохранённое.
    // После блока URL/стор: эра в записи уже актуальная.
    if (!arriving.current) setLastOffset(nativeT, useStore.getState().eraId)
  })

  useEffect(() => () => { settling.current?.kill(); if (settleTimer.current) clearTimeout(settleTimer.current) }, [])

  return null
}

/** Режим «Хроника»: скролл по эрам. На телефоне при открытой карточке нативный скролл нити заблокирован. */
export function Chronicle({ index }: { index: DataIndex }) {
  const selectedId = useStore((s) => s.selectedId)
  const reduced = useSceneStore((s) => s.reducedMotion)
  const phone = typeof matchMedia === 'function' && !matchMedia('(min-width: 900px)').matches
  const blocked = phone && selectedId !== null
  return (
    <ScrollControls pages={index.eras.length} damping={reduced ? 0.01 : 0.2} distance={1} maxSpeed={4} style={blocked ? BLOCKED_STYLE : undefined}>
      <CameraRig index={index} blocked={blocked} />
    </ScrollControls>
  )
}
