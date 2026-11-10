export function awardGold(amount: number, motivo?: string) {
  if (!amount) return
  console.log('[stub awardGold]', amount, motivo ?? '')
}
export function adjustGold(delta: number, motivo?: string) {
  console.log('[stub adjustGold]', delta, motivo ?? '')
}
