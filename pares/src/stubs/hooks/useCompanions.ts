export type Companion = {
  instanceId: string
  name: string
  sprite: string
  kind: string
}

export function holdsSpecial(_item?: Companion) {
  return false
}

export function useCompanions() {
  return { companions: [] as Companion[], owned: [] as Companion[] }
}
