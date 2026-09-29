import type { CSSProperties } from 'react'
import type { DataIndex } from '../data/indexDataset'
import type { Kind, NonEraOut } from '../data/schema'
import { openEntity } from '../router/bind'
import { useStore } from '../state/store'

const GROUPS: { kind: Kind; title: string }[] = [
  { kind: 'planet', title: 'Планеты' },
  { kind: 'character', title: 'Персонажи' },
  { kind: 'faction', title: 'Фракции' },
  { kind: 'event', title: 'События' },
  { kind: 'artifact', title: 'Объекты и места' },
]

export function timelineNote(e: NonEraOut, eraId: string): string | undefined {
  return e.timeline?.find((t) => t.era === eraId)?.note.ru
}

function Item({ e, eraId, index }: { e: NonEraOut; eraId: string; index: DataIndex }) {
  return (
    <li>
      <button type="button" className="item" onClick={() => openEntity(index, e.id)}>
        <b>{e.name.ru}</b>
        {e.originalName && <i> ({e.originalName})</i>}
        <span>{timelineNote(e, eraId) ?? e.summary.ru}</span>
      </button>
    </li>
  )
}

export function ListView({ index }: { index: DataIndex }) {
  const eraId = useStore((s) => s.eraId)
  const differences = index.entities.filter((e): e is NonEraOut => e.kind === 'difference')
  return (
    <div className="list">
      {index.eras.map((era) => {
        const items = index.byEra.get(era.id) ?? []
        return (
          <section key={era.id} id={`era-${era.id}`} className={era.id === eraId ? 'era active' : 'era'} style={{ '--era': era.palette.primary } as CSSProperties}>
            <h2>{era.name.ru}</h2>
            <p className="years">{era.years.label.ru}</p>
            <p className="muted">{era.summary.ru}</p>
            {GROUPS.map((g) => {
              const group = items.filter((e) => e.kind === g.kind)
              if (!group.length) return null
              return (
                <div key={g.kind} className="group">
                  <h3>{g.title}</h3>
                  <ul>{group.map((e) => <Item key={e.id} e={e} eraId={era.id} index={index} />)}</ul>
                </div>
              )
            })}
          </section>
        )
      })}
      {differences.length > 0 && (
        <section className="era" id="era-differences">
          <h2>Чем сериал отличается от книги</h2>
          <ul>{differences.map((e) => <Item key={e.id} e={e} eraId={eraId} index={index} />)}</ul>
        </section>
      )}
    </div>
  )
}
