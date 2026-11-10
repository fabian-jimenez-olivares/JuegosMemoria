export function writeAppItem(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* ignore */ }
}
