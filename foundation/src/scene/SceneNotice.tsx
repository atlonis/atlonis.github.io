import { useStore } from '../state/store'

/** Пометки над списком, пока 3D не показано. */
export function SceneNotice() {
  const gate = useStore((s) => s.gate)
  const scene3d = useStore((s) => s.scene3d)
  const want3d = useStore((s) => s.want3d)
  const request3d = useStore((s) => s.request3d)

  if (gate === 'unavailable') return <p className="notice">3D недоступно на этом устройстве.</p>
  if (scene3d === 'failed') return <p className="notice">3D-карта не загрузилась. <button type="button" onClick={request3d}>Повторить загрузку 3D</button></p>
  if (scene3d === 'lost') return <p className="notice">Графический контекст потерян. <button type="button" onClick={request3d}>Перезапустить 3D</button></p>
  if (!want3d) {
    return (
      <div className="poster">
        <p>Галактика, нить эр и планеты — в 3D.</p>
        <button type="button" onClick={request3d}>Открыть 3D-карту</button>
      </div>
    )
  }
  if (scene3d === 'loading') return <p className="notice">Загружаю 3D-карту…</p>
  return null
}
