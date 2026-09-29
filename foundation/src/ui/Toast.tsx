import { useEffect } from 'react'
import { useStore } from '../state/store'

export function Toast() {
  const notice = useStore((s) => s.notice)
  const setNotice = useStore((s) => s.setNotice)
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(t)
  }, [notice, setNotice])
  if (!notice) return null
  return <div className="toast" role="status">{notice}</div>
}
