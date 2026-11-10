export function useHeroes() {
  return { heroes: [] as { id: string; heroName: string; heroImage: string }[] }
}
