export interface GateEnv {
  webgl2: boolean
  reducedMotion: boolean
  saveData: boolean
  forceOff: boolean
}
export type GateDecision = 'auto' | 'button' | 'unavailable'

/** Что делать с 3D: грузить сразу, только по кнопке или никогда. */
export function decide3D(env: GateEnv): GateDecision {
  if (env.forceOff || !env.webgl2) return 'unavailable'
  if (env.reducedMotion || env.saveData) return 'button'
  return 'auto'
}

/** Читает окружение браузера. Пробный WebGL2-контекст сразу отпускаем. */
export function readGateEnv(): GateEnv {
  let webgl2 = false
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (gl) {
      webgl2 = true
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    webgl2 = false
  }
  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  const saveData = conn?.saveData === true
  const forceOff = new URLSearchParams(location.search).has('no3d')
  return { webgl2, reducedMotion, saveData, forceOff }
}
