import { writeAppItem } from './persistGate'

const KEY = 'motivacional.juego.standalone.records.v1'
type Records = Record<string, Record<string, number>>

function readAll(): Records {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Records
  } catch {
    return {}
  }
}

export function formatRunMs(ms: number) {
  const total = Math.max(0, Math.round(ms))
  const mins = Math.floor(total / 60000)
  const secs = Math.floor((total % 60000) / 1000)
  const cs = Math.floor((total % 1000) / 10)
  if (mins > 0) return `${mins}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
  return `${secs}.${String(cs).padStart(2, '0')}s`
}

export function readBestTime(game: string, level: number) {
  const value = readAll()[game]?.[String(level)]
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

export function saveBestTime(game: string, level: number, ms: number) {
  const elapsed = Math.max(1, Math.round(ms))
  const all = readAll()
  const prev = readBestTime(game, level)
  const best = prev == null || elapsed < prev ? elapsed : prev
  writeAppItem(KEY, JSON.stringify({ ...all, [game]: { ...all[game], [String(level)]: best } }))
  return best
}

export function readBestSequence(level: number) {
  const value = readAll().secuencia?.[String(level)]
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

export function saveBestSequence(level: number, score: number) {
  const value = Math.max(1, Math.round(score))
  const all = readAll()
  const prev = readBestSequence(level)
  const best = prev == null || value > prev ? value : prev
  writeAppItem(KEY, JSON.stringify({ ...all, secuencia: { ...all.secuencia, [String(level)]: best } }))
  return best
}

export function readBestSemaforo() {
  const value = readAll().semaforo?.best
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

export function saveBestSemaforo(streak: number) {
  const best = Math.max(readBestSemaforo(), Math.max(0, Math.round(streak)))
  const all = readAll()
  writeAppItem(KEY, JSON.stringify({ ...all, semaforo: { best } }))
  return best
}

export function readBestRainMath() {
  const value = readAll().rainmath?.best
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

export function saveBestRainMath(score: number) {
  const best = Math.max(readBestRainMath(), Math.max(0, Math.round(score)))
  const all = readAll()
  writeAppItem(KEY, JSON.stringify({ ...all, rainmath: { best } }))
  return best
}
