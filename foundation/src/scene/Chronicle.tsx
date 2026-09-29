import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ScrollControls, useScroll } from '@react-three/drei'
import { invalidate, useFrame, useStore as useR3FStore, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import type { DataIndex } from '../data/indexDataset'
import { useStore } from '../state/store'
import { tweenTo } from './anim'
import { activeEraFor, chronicleCamera, eraSpacing, eraStops, nearestStop, smoothstep } from './layout'
import { tweenPalette } from './palette'
import { markAlive, useSceneStore } from './sceneStore'

const SETTLE_IDLE_MS = 150
const SETTLE_RANGE = 0.3
const SETTLE_DURATION = 0.4
const NAV_DURATION = 0.8
const TILT_RANGE = 0.35
const STOP_EPS = 0.02

function CameraRig({ index }: { index: DataIndex }) {
  const scroll = useScroll()
  const camera = useThree((s) => s.camera)
  const r3f = useR3FStore()
  const stops = useMemo(() => eraStops(index.eras), [index])
  const spacing = eraSpacing(stops.length)
  const eraId = useStore((s) => s.eraId)
  const setEra = useStore((s) => s.setEra)
  const active = useRef(useSceneStore.getState().activeEraId || eraId)
  const lastScrollAt = useRef(0)
  const settleTimer = useRef<number | null>(null)
  const settling = useRef<gsap.core.Tween | null>(null)
  // Пока камера не доехала до эры из URL (первый полёт после монтирования), кадры на t=0 не должны менять эру, палитру и URL.
  const arriving = useRef(true)

  const scrollToEra = useCallback(
    (id: string, duration: number) => {
      const stop = stops.find((s) => s.id === id)
      if (!stop) { arriving.current = false; return }
      const el = scroll.el
      const max = el.scrollHeight - el.clientHeight
      settling.current?.kill()
      settling.current = tweenTo(el, { scrollTop: stop.t * max, duration, ease: 'power2.inOut', onComplete: () => { settling.current = null; arriving.current = false } })
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
  useEffect(() => {
    useSceneStore.setState({ scrollToEra })
    const raf = requestAnimationFrame(() => scrollToEra(useStore.getState().eraId, NAV_DURATION))
    return () => {
      cancelAnimationFrame(raf)
      useSceneStore.setState({ scrollToEra: undefined })
    }
  }, [scrollToEra])

  // Внешняя смена эры (чип, hashchange) → едем к остановке.
  useEffect(() => {
    if (eraId && eraId !== active.current) scrollToEra(eraId, NAV_DURATION)
  }, [eraId, scrollToEra])

  useFrame(() => {
    const t = scroll.offset
    const { stop, dist } = nearestStop(stops, t)
    const tilt = 1 - smoothstep(0, TILT_RANGE * spacing, dist)
    const { position, target } = chronicleCamera(t, tilt)
    camera.position.set(position[0], position[1], position[2])
    camera.lookAt(target[0], target[1], target[2])

    const next = arriving.current ? active.current : activeEraFor(stops, t, active.current)
    if (next !== active.current) {
      active.current = next
      useSceneStore.getState().setActiveEra(next)
      const era = index.eras.find((e) => e.id === next)
      if (era) tweenPalette(era.palette.primary, era.palette.glow)
    }

    if (Math.abs(scroll.delta) > 1e-4) {
      markAlive()
      lastScrollAt.current = performance.now()
      if (settleTimer.current) clearTimeout(settleTimer.current)
      // После остановки демпфирования кадров нет — просим один, чтобы проверить дотягивание.
      settleTimer.current = window.setTimeout(() => invalidate(), SETTLE_IDLE_MS + 30)
    } else if (!settling.current && performance.now() - lastScrollAt.current > SETTLE_IDLE_MS && dist > STOP_EPS * spacing && dist < SETTLE_RANGE * spacing) {
      scrollToEra(stop.id, SETTLE_DURATION)
    }

    // URL и стор — только на остановке и не во время полёта к другой эре.
    if (!arriving.current && !settling.current && dist <= STOP_EPS * spacing && useStore.getState().eraId !== stop.id) setEra(stop.id)
  })

  useEffect(() => () => { settling.current?.kill(); if (settleTimer.current) clearTimeout(settleTimer.current) }, [])

  return null
}

/** Режим «Хроника»: скролл по эрам. На телефоне при открытой карточке скролл выключен. */
export function Chronicle({ index }: { index: DataIndex }) {
  const selectedId = useStore((s) => s.selectedId)
  const reduced = useSceneStore((s) => s.reducedMotion)
  const phone = typeof matchMedia === 'function' && !matchMedia('(min-width: 900px)').matches
  const enabled = !(phone && selectedId !== null)
  return (
    <ScrollControls pages={index.eras.length} damping={reduced ? 0.01 : 0.2} distance={1} maxSpeed={4} enabled={enabled}>
      <CameraRig index={index} />
    </ScrollControls>
  )
}
