import { useEffect, useState } from 'react'
import type { DataIndex } from '../data/indexDataset'
import { KIND_TITLES, bookPartLabel, seasonLabel } from '../data/labels'
import type { NonEraOut } from '../data/schema'
import { openEntity } from '../router/bind'
import { useStore } from '../state/store'
import { timelineNote } from './ListView'

type TabKey = 'show' | 'book' | 'related'
const TAB_TITLES: Record<TabKey, string> = { show: 'Сериал', book: 'В книге', related: 'Связи' }

export function tabsFor(e: NonEraOut): TabKey[] {
  switch (e.book.presence) {
    case 'same': return ['show', 'related']
    case 'different': return ['show', 'book', 'related']
    case 'show-only': return ['show', 'related']
    case 'book-only': return ['book', 'related']
  }
}

function Paragraphs({ text }: { text?: string }) {
  if (!text) return <p className="muted">Текст появится в контент-фазе.</p>
  return <>{text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</>
}

export function EntityCard({ index }: { index: DataIndex }) {
  const selectedId = useStore((s) => s.selectedId)
  const eraId = useStore((s) => s.eraId)
  const select = useStore((s) => s.select)
  const entity = selectedId ? index.byId.get(selectedId) : undefined
  const e = entity && entity.kind !== 'era' ? (entity as NonEraOut) : undefined
  const tabs = e ? tabsFor(e) : []
  const [tab, setTab] = useState<TabKey>('show')

  useEffect(() => { if (e) setTab(tabsFor(e)[0]) }, [e])
  useEffect(() => {
    if (!e) return
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') select(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [e, select])

  if (!e) return null
  const note = timelineNote(e, eraId)
  const badge = e.book.presence === 'show-only' ? 'В книге нет' : e.book.presence === 'book-only' ? 'В сериале нет' : null
  const bookText = e.book.presence === 'book-only' ? e.body?.ru : e.book.diff?.ru

  return (
    <aside className="card" aria-label={e.name.ru}>
      <div className="card-head">
        <div>
          <p className="kind">{KIND_TITLES[e.kind]}{badge && <span className="badge">{badge}</span>}</p>
          <h2>
            {e.name.ru}
            {e.originalName && <i> ({e.originalName})</i>}
            {e.book.name && <small> · в книге — {e.book.name.ru}</small>}
          </h2>
        </div>
        <button type="button" className="close" aria-label="Закрыть" onClick={() => select(null)}>×</button>
      </div>
      <div className="tags">
        {e.appearsIn.show?.map((s) => <span key={`s${s.season}`}>{seasonLabel(s.season)}</span>)}
        {e.appearsIn.book?.map((p) => <span key={p}>{bookPartLabel(p)}</span>)}
        {e.eras.map((id) => <span key={id} className="era-tag">{index.byId.get(id)?.name.ru}</span>)}
      </div>
      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t} type="button" className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>{TAB_TITLES[t]}</button>
        ))}
      </nav>
      <div className="card-body">
        {tab === 'show' && (
          <>
            {note && <p className="now"><b>В эту эру:</b> {note}</p>}
            {e.kind === 'character' && e.actor && <p className="muted">Актёр: {e.actor}</p>}
            <Paragraphs text={e.body?.ru} />
          </>
        )}
        {tab === 'book' && <Paragraphs text={bookText} />}
        {tab === 'related' && (
          <ul className="related">
            {e.related.length === 0 && <li className="muted">Связей пока нет.</li>}
            {e.related.map((r) => {
              const target = index.byId.get(r.id)
              if (!target) return null
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => openEntity(index, r.id)}><b>{target.name.ru}</b><span>{r.role.ru}</span></button>
                </li>
              )
            })}
            {e.book.counterpart && index.byId.get(e.book.counterpart) && (
              <li>
                <button type="button" onClick={() => openEntity(index, e.book.counterpart!)}>
                  <b>{index.byId.get(e.book.counterpart)!.name.ru}</b><span>двойник в книге</span>
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </aside>
  )
}
