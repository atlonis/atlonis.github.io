import { useState } from 'react'
import { SEASONS } from '../data/derive'

const KEY = 'foundation:spoilers-ok'

function read(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export function SpoilerBanner() {
  const [hidden, setHidden] = useState(read)
  if (hidden) return null
  const close = () => {
    try { localStorage.setItem(KEY, '1') } catch { /* приватный режим */ }
    setHidden(true)
  }
  return (
    <div className="spoilers" role="note">
      <span>Здесь спойлеры на все {SEASONS} сезона сериала и три книги трилогии.</span>
      <button type="button" onClick={close}>Понятно</button>
    </div>
  )
}
