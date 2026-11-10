import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GOLD } from './stubs/data/goldRewards'
import { MASCOTAS, RIVALES, type MemoramaFace } from './stubs/data/memorama'
import { awardGold } from './stubs/hooks/useWallet'
import { holdsSpecial, useCompanions } from './stubs/hooks/useCompanions'
import { useHeroes } from './stubs/hooks/useHeroes'
import { usePreferences } from './stubs/lib/preferences'
import { ResolvedImg } from './stubs/hooks/useResolvedImage'

type CastMember = MemoramaFace & { id: string }

type Card = MemoramaFace & {
  id: string
  open: boolean
  done: boolean
}

type Mode = 'mascotas' | 'aldea'

function shuffle<T>(items: T[]) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

function deal(faces: MemoramaFace[]): Card[] {
  return shuffle(faces.flatMap((face) => [0, 1].map((copy) => ({ ...face, id: `${face.key}:${copy}:${Math.random().toString(36).slice(2, 7)}`, open: false, done: false }))))
}

export function Memorama() {
  const { gamified } = usePreferences()
  const { heroes } = useHeroes()
  const { companions, owned } = useCompanions()
  const cast: CastMember[] = [
    ...heroes.map((hero) => ({ id: `hero:${hero.id}`, key: `aldea:${hero.heroImage}`, name: hero.heroName, src: hero.heroImage })),
    ...[...companions, ...owned]
      .filter((item) => !holdsSpecial(item) && item.kind !== 'esfera' && item.kind !== 'duelo')
      .map((item) => ({ id: `comp:${item.instanceId}`, key: `aldea:${item.sprite}`, name: item.name, src: item.sprite })),
  ]
  const [mode, setMode] = useState<Mode>('mascotas')
  const playMode: Mode = gamified ? mode : 'mascotas'
  const [petLevel, setPetLevel] = useState(1)
  const [aldeaLevel, setAldeaLevel] = useState(1)
  const [cards, setCards] = useState<Card[] | null>(null)
  const [lock, setLock] = useState(false)
  const [moves, setMoves] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  const finishPaid = useRef(false)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!cards || !gamified || finishPaid.current) return
    if (!cards.every((card) => card.done)) return
    finishPaid.current = true
    const extra = cards.length * GOLD.memoramaPair
    awardGold(extra, `¡Memorama completado! +${extra} de oro 🪙`)
  }, [cards, gamified])

  const villageGroups = Math.floor(cast.length / 5)
  const village = cast.slice(0, Math.min(aldeaLevel, Math.max(villageGroups, 0)) * 5)
  const faces = playMode === 'aldea' ? village : petLevel > 1 ? [...MASCOTAS, ...RIVALES] : MASCOTAS
  const canPlay = faces.length > 0

  function start() {
    if (!canPlay) return
    window.clearTimeout(timer.current)
    finishPaid.current = false
    setLock(false)
    setMoves(0)
    setCards(deal(faces))
  }

  function flip(id: string) {
    if (!cards || lock) return
    const card = cards.find((item) => item.id === id)
    if (!card || card.open || card.done) return
    const open = cards.filter((item) => item.open && !item.done)
    if (open.length >= 2) return
    const next = cards.map((item) => (item.id === id ? { ...item, open: true } : item))
    const shown = next.filter((item) => item.open && !item.done)
    if (shown.length < 2) {
      setCards(next)
      return
    }
    const match = shown[0].key === shown[1].key
    if (match && gamified) {
      awardGold(GOLD.memoramaPair, `¡Par encontrado! +${GOLD.memoramaPair} de oro 🪙`)
    }
    setMoves((current) => current + 1)
    setLock(true)
    setCards(next)
    timer.current = window.setTimeout(() => {
      setCards((current) =>
        current?.map((item) => {
          if (!shown.some((pickedCard) => pickedCard.id === item.id)) return item
          return match ? { ...item, done: true, open: true } : { ...item, open: false }
        }) ?? null,
      )
      setLock(false)
    }, 700)
  }

  if (!cards) {
    return (
      <div className="memorama">
        {gamified ? (
          <div className="memorama-modes" role="group" aria-label="Modo">
            <button type="button" className={mode === 'mascotas' ? 'is-on' : ''} onClick={() => setMode('mascotas')}>
              Mascotas
            </button>
            <button type="button" className={mode === 'aldea' ? 'is-on' : ''} onClick={() => setMode('aldea')}>
              Solo aldea
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className={`memorama-hard${(playMode === 'mascotas' ? petLevel : aldeaLevel) > 1 ? ' is-on' : ''}`}
          onClick={() => {
            if (playMode === 'mascotas') {
              setPetLevel((current) => (current >= 2 ? 1 : current + 1))
              return
            }
            const max = Math.max(1, villageGroups)
            setAldeaLevel((current) => (current >= max ? 1 : current + 1))
          }}
        >
          Cambiar dificultad
          <small>{playMode === 'mascotas' ? `${faces.length} mascotas` : `${village.length} de la aldea`}</small>
        </button>
        <button type="button" className="primary-btn" disabled={!canPlay} onClick={start}>
          Jugar · {faces.length * 2} cartas
        </button>
      </div>
    )
  }

  const found = cards.filter((card) => card.done).length / 2
  const pairs = cards.length / 2
  const won = found === pairs

  return (
    <div className="memorama">
      <header className="memorama-bar">
        <button type="button" className="back-btn" onClick={() => setCards(null)}>
          ← Ajustes
        </button>
        <p>
          {found}/{pairs} · {moves} {moves === 1 ? 'intento' : 'intentos'}
        </p>
        <button type="button" onClick={start}>
          Mezclar
        </button>
      </header>
      <div className="memorama-board">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`memorama-card${card.open || card.done ? ' is-open' : ''}${card.done ? ' is-done' : ''}`}
            aria-label={card.open || card.done ? card.name : 'Carta oculta'}
            onClick={() => flip(card.id)}
          >
            {card.open || card.done ? (
              <>
                <ResolvedImg src={card.src} alt="" />
                <span>{card.name}</span>
              </>
            ) : (
              <span className="memorama-back" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
      {won ? (
        <div className="memorama-win-overlay" role="dialog" aria-modal="true" aria-label="Felicitaciones">
          <div className="memorama-confetti" aria-hidden="true">
            {Array.from({ length: 48 }, (_, index) => (
              <span
                key={index}
                style={
                  {
                    '--i': index,
                    '--x': `${(index % 12) * 8.5 - 4}%`,
                    '--delay': `${(index % 10) * 0.08}s`,
                    '--hue': `${(index * 37) % 360}`,
                    '--rot': `${(index * 47) % 360}deg`,
                    '--dur': `${2.4 + (index % 5) * 0.35}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="memorama-win-card">
            <p className="memorama-win-title">Felicitaciones!</p>
            <div className="memorama-win-actions">
              <button type="button" className="primary-btn" onClick={start}>
                Jugar de nuevo?
              </button>
              <button type="button" className="action-btn" onClick={() => setCards(null)}>
                Volver
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
