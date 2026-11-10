export type MemoramaFace = { key: string; name: string; src: string }

const COLORS = ['#e06b4f', '#3ea87a', '#5b8def', '#d4a017', '#8b5cf6', '#e06b9a', '#3ec4c4', '#8bc34a']

function face(i: number): MemoramaFace {
  const color = COLORS[i % COLORS.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="20" fill="${color}"/><text x="64" y="76" text-anchor="middle" font-size="42" font-family="sans-serif" fill="#fff">${i + 1}</text></svg>`
  return {
    key: `demo:${i}`,
    name: `Cara ${i + 1}`,
    src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
  }
}

export const MASCOTAS: MemoramaFace[] = Array.from({ length: 20 }, (_, i) => face(i))
export const RIVALES: MemoramaFace[] = Array.from({ length: 12 }, (_, i) => face(i + 20))
