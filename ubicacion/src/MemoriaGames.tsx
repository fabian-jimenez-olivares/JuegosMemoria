import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { GOLD } from './stubs/data/goldRewards'
import { bumpToolUse } from './stubs/hooks/useToolUse'
import { awardGold } from './stubs/hooks/useWallet'
import { formatRunMs, readBestSequence, readBestTime, saveBestSequence, saveBestTime } from './stubs/lib/concentracionRecords'
import { GOLD_FX_TOAST_MS } from './stubs/lib/goldFx'
import { getGamified } from './stubs/lib/preferences'

type GameId = 'pares' | 'secuencia' | 'retencion' | 'ubicacion'

const GAMES: { id: GameId; label: string; accent: string; icon: ReactNode }[] = [
  {
    id: 'pares',
    label: 'Pares',
    accent: '#c46bd4',
    icon: (
      <>
        <rect x="3" y="4" width="8" height="11" rx="1.4" />
        <rect x="13" y="9" width="8" height="11" rx="1.4" />
      </>
    ),
  },
  {
    id: 'secuencia',
    label: 'Secuencia',
    accent: '#e06b4f',
    icon: (
      <>
        <rect x="4.4" y="4.4" width="7.2" height="7.2" rx="1" fill="#e06b4f" stroke="none" />
        <rect x="12.4" y="4.4" width="7.2" height="7.2" rx="1" fill="#3ea87a" stroke="none" />
        <rect x="4.4" y="12.4" width="7.2" height="7.2" rx="1" fill="#d4a017" stroke="none" />
        <rect x="12.4" y="12.4" width="7.2" height="7.2" rx="1" fill="#5b8def" stroke="none" />
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 12h16M12 4v16" />
      </>
    ),
  },
  {
    id: 'retencion',
    label: 'Retención',
    accent: '#5bb8a8',
    icon: (
      <>
        <path d="M5 7h14M5 12h14M5 17h9" />
        <path d="M16.5 15.5 18 17l2.5-3" />
      </>
    ),
  },
  {
    id: 'ubicacion',
    label: 'Ubicación',
    accent: '#6aa8e8',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 12h16M12 4v16" />
        <text x="8" y="10.2" fill="currentColor" stroke="none" fontSize="7" fontWeight="800" textAnchor="middle">
          1
        </text>
        <text x="16" y="18.2" fill="currentColor" stroke="none" fontSize="7" fontWeight="800" textAnchor="middle">
          3
        </text>
      </>
    ),
  },
]

function pick<T>(items: T[], count: number) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy.slice(0, count)
}

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const GAME_TITLES: Record<GameId, string> = {
  pares: 'Memorama',
  secuencia: 'Secuencia',
  retencion: 'Retención',
  ubicacion: 'Ubicación',
}

const SECUENCIA_START = 4
const SECUENCIA_MAX = 8

const PADS = [
  { label: 'Rojo', color: '#e06b4f' },
  { label: 'Verde', color: '#3ea87a' },
  { label: 'Ámbar', color: '#d4a017' },
  { label: 'Azul', color: '#5b8def' },
  { label: 'Violeta', color: '#8b5cf6' },
  { label: 'Rosa', color: '#e06b9a' },
  { label: 'Cian', color: '#3ec4c4' },
  { label: 'Lima', color: '#8bc34a' },
]

function Difficulty({
  level,
  max,
  onRaise,
  label = 'Subir dificultad',
  wrap = false,
}: {
  level: number
  max: number
  onRaise: () => void
  label?: string
  wrap?: boolean
}) {
  return (
    <button type="button" className={`memorama-hard${level > 1 ? ' is-on' : ''}`} disabled={!wrap && level >= max} onClick={onRaise}>
      {label}
      <small>Nivel {level}</small>
    </button>
  )
}

export function Secuencia() {
  const [level, setLevel] = useState(SECUENCIA_START)
  const [round, setRound] = useState<number[]>(() => [Math.floor(Math.random() * SECUENCIA_START)])
  const [phase, setPhase] = useState<'show' | 'play' | 'fail'>('show')
  const [lit, setLit] = useState<number | null>(null)
  const [step, setStep] = useState(0)
  const [session, setSession] = useState<number | null>(null)
  const [best, setBest] = useState(() => readBestSequence(SECUENCIA_START))
  const [fresh, setFresh] = useState(false)
  const pads = PADS.slice(0, level)

  useEffect(() => {
    if (phase !== 'show') return
    let index = 0
    let flash: number | undefined
    const timer = window.setInterval(() => {
      if (index >= round.length) {
        window.clearInterval(timer)
        setLit(null)
        setStep(0)
        setPhase('play')
        return
      }
      const pad = round[index]
      setLit(pad)
      window.clearTimeout(flash)
      flash = window.setTimeout(() => setLit(null), 380)
      index += 1
    }, 700)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(flash)
    }
  }, [phase, round])

  function restart(nextLevel = level) {
    setRound([Math.floor(Math.random() * nextLevel)])
    setStep(0)
    setLit(null)
    setSession(null)
    setFresh(false)
    setBest(readBestSequence(nextLevel))
    setPhase('show')
  }

  function markFail() {
    const score = Math.max(round.length - 1, step + 1)
    const previous = readBestSequence(level)
    const next = saveBestSequence(level, score)
    setSession(score)
    setBest(next)
    setFresh(previous == null || score > previous)
    setPhase('fail')
  }

  function press(pad: number) {
    if (phase !== 'play') return
    setLit(pad)
    window.setTimeout(() => setLit(null), 180)
    if (round[step] !== pad) {
      markFail()
      return
    }
    if (getGamified()) {
      awardGold(GOLD.secuenciaCorrect, `¡Secuencia! +${GOLD.secuenciaCorrect} de oro 🪙`)
    }
    if (step + 1 >= round.length) {
      setPhase('show')
      setRound((current) => [...current, Math.floor(Math.random() * level)])
      return
    }
    setStep((current) => current + 1)
  }

  return (
    <div className="memoria-game">
      <Difficulty
        level={level}
        max={SECUENCIA_MAX}
        onRaise={() => {
          const next = Math.min(SECUENCIA_MAX, level + 1)
          setLevel(next)
          restart(next)
        }}
      />
      <p className={`concentra-hud-times${fresh ? ' is-new' : ''}`}>
        <span>
          Sesión <strong>{session == null ? '—' : session}</strong>
        </span>
        <span>
          {best == null ? (
            'Sin récord'
          ) : (
            <>
              {fresh ? 'Nuevo récord' : 'Récord'} <strong>{best}</strong>
            </>
          )}
        </span>
      </p>
      <p>{phase === 'fail' ? 'La secuencia se cortó.' : phase === 'show' ? 'Mira el orden.' : `Repite ${round.length} ${round.length === 1 ? 'paso' : 'pasos'}.`}</p>
      <div className={`memoria-pads${pads.length === 1 ? ' is-one' : ''}`}>
        {pads.map((pad, index) => (
          <button
            key={pad.label}
            type="button"
            className={`memoria-pad${lit === index ? ' is-lit' : ''}`}
            style={{ '--pad': pad.color } as CSSProperties}
            aria-label={pad.label}
            onClick={() => press(index)}
          >
            {pad.label}
          </button>
        ))}
      </div>
      {phase === 'fail' ? (
        <button type="button" className="primary-btn" onClick={() => restart()}>
          Otra vez
        </button>
      ) : null}
    </div>
  )
}

const RETENCION_COUNTS = [5, 7, 9, 11, 15]
const RETENCION_SYMBOLS = ['★', '●', '▲', '◆', '♥', '✿', '☀', '☂', '♫', '⚑', '✧', '⬡', '♣', '♦', '♠', '☾', '⚡', '❄', '☯', '⚔']

export function Retencion() {
  const [level, setLevel] = useState(1)
  const count = RETENCION_COUNTS[level - 1]
  const [phase, setPhase] = useState<'idle' | 'watch' | 'sort' | 'result'>('idle')
  const [target, setTarget] = useState<string[]>(() => Array.from({ length: RETENCION_COUNTS[0] }, () => ''))
  const [slots, setSlots] = useState<(string | null)[]>(() => Array.from({ length: RETENCION_COUNTS[0] }, () => null))
  const [pool, setPool] = useState<string[]>([])
  const [time, setTime] = useState(0)
  const [session, setSession] = useState<number | null>(null)
  const [best, setBest] = useState(() => readBestTime('retencion', 1))
  const [fresh, setFresh] = useState(false)
  const [solved, setSolved] = useState(false)
  const started = useRef(0)
  const memoMs = useRef(0)
  const slotsRef = useRef(slots)
  const poolRef = useRef(pool)
  const [drag, setDrag] = useState<{
    from: 'pool' | 'slot'
    index: number
    symbol: string
    x: number
    y: number
    ox: number
    oy: number
    over: number | null
    moved: boolean
  } | null>(null)
  const dragRef = useRef(drag)
  slotsRef.current = slots
  poolRef.current = pool
  dragRef.current = drag

  function resetBoard(nextLevel = level) {
    const nextCount = RETENCION_COUNTS[nextLevel - 1]
    setTarget(Array.from({ length: nextCount }, () => ''))
    setSlots(Array.from({ length: nextCount }, () => null))
    setPool([])
    setDrag(null)
    setTime(0)
    setSession(null)
    setFresh(false)
    setSolved(false)
    setBest(readBestTime('retencion', nextLevel))
    setPhase('idle')
  }

  function changeLevel() {
    if (phase === 'watch') return
    const next = level >= 5 ? 1 : level + 1
    setLevel(next)
    resetBoard(next)
  }

  function start() {
    const next = pick(RETENCION_SYMBOLS, count)
    setTarget(next)
    setSlots(Array.from({ length: count }, () => null))
    setPool([])
    setDrag(null)
    setSession(null)
    setFresh(false)
    setSolved(false)
    started.current = performance.now()
    setPhase('watch')
  }

  function memorized() {
    memoMs.current = Math.max(1, Math.round(performance.now() - started.current))
    setTime(memoMs.current / 1000)
    setSession(memoMs.current)
    setSlots(Array.from({ length: count }, () => null))
    setPool(pick(target, target.length))
    setDrag(null)
    setPhase('sort')
  }

  function moveToSlot(symbol: string, from: 'pool' | 'slot', fromIndex: number, slotIndex: number) {
    const currentSlots = [...slotsRef.current]
    const occupant = currentSlots[slotIndex]
    currentSlots[slotIndex] = symbol
    if (from === 'slot') {
      currentSlots[fromIndex] = occupant
      setPool([...poolRef.current])
    } else {
      const nextPool = poolRef.current.filter((_, index) => index !== fromIndex)
      if (occupant) nextPool.push(occupant)
      setPool(nextPool)
    }
    setSlots(currentSlots)
    setDrag(null)
  }

  function returnToPool(slotIndex: number) {
    const symbol = slotsRef.current[slotIndex]
    if (!symbol) return
    setSlots(slotsRef.current.map((item, index) => (index === slotIndex ? null : item)))
    setPool([...poolRef.current, symbol])
    setDrag(null)
  }

  function hitFromPoint(x: number, y: number) {
    const node = document.elementFromPoint(x, y)
    const slot = node instanceof Element ? node.closest('[data-retencion-slot]') : null
    if (slot) return { kind: 'slot' as const, index: Number(slot.getAttribute('data-retencion-slot')) }
    const piece = node instanceof Element ? node.closest('[data-retencion-pool]') : null
    if (piece) return { kind: 'pool' as const, index: Number(piece.getAttribute('data-retencion-pool')) }
    return null
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, from: 'pool' | 'slot', index: number, symbol: string) {
    if (event.button !== 0) return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Capture is optional; pointermove still tracks while pressed.
    }
    event.preventDefault()
    setDrag({
      from,
      index,
      symbol,
      x: event.clientX,
      y: event.clientY,
      ox: event.clientX,
      oy: event.clientY,
      over: null,
      moved: true,
    })
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = dragRef.current
    if (!current) return
    const dx = event.clientX - current.ox
    const dy = event.clientY - current.oy
    const hit = hitFromPoint(event.clientX, event.clientY)
    setDrag({
      ...current,
      x: event.clientX,
      y: event.clientY,
      over: hit?.kind === 'slot' ? hit.index : null,
      moved: current.moved || dx * dx + dy * dy > 16,
    })
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = dragRef.current
    if (!current) return
    const hit = hitFromPoint(event.clientX, event.clientY)
    if (hit?.kind === 'slot' && !(current.from === 'slot' && current.index === hit.index)) {
      moveToSlot(current.symbol, current.from, current.index, hit.index)
      return
    }
    if (current.from === 'slot' && (hit?.kind === 'pool' || !hit) && current.moved) {
      returnToPool(current.index)
      return
    }
    setDrag(null)
  }

  function verify() {
    const correct = slots.every((symbol, index) => symbol === target[index])
    setSolved(correct)
    if (correct) {
      const previous = readBestTime('retencion', level)
      const next = saveBestTime('retencion', level, memoMs.current)
      setBest(next)
      setFresh(previous == null || next < previous)
    }
    setPhase('result')
    if (correct && getGamified()) {
      const gold = GOLD.retencionLevel * level
      awardGold(gold, `¡Retención! +${gold} de oro 🪙`)
    }
  }

  const prompt =
    phase === 'idle'
      ? `Memoriza ${count} símbolos y su orden.`
      : phase === 'watch'
        ? 'Memoriza el orden. Pulsa cuando esté listo.'
        : phase === 'sort'
          ? 'Arrastra las piezas a su lugar.'
          : !solved
            ? 'El orden no coincide.'
            : fresh
              ? 'Orden correcto. ¡Nuevo récord!'
              : 'Orden correcto.'

  return (
    <div className="memoria-game retencion-game">
      <p className={`concentra-hud-times${fresh ? ' is-new' : ''}`}>
        <span>
          Sesión <strong>{session == null ? '—' : formatRunMs(session)}</strong>
        </span>
        <span>
          {best == null ? (
            'Sin récord'
          ) : (
            <>
              {fresh ? 'Nuevo récord' : 'Récord'} <strong>{formatRunMs(best)}</strong>
            </>
          )}
        </span>
      </p>
      <div className="retencion-bar">
        <button
          type="button"
          className={`memorama-hard${level > 1 ? ' is-on' : ''}`}
          disabled={phase === 'watch'}
          onClick={changeLevel}
        >
          Cambiar dificultad (Nivel {level})
        </button>
        {phase === 'watch' ? (
          <button type="button" className="primary-btn retencion-start" onClick={memorized}>
            ¡Listo, memorizado!
          </button>
        ) : phase === 'sort' ? (
          <button type="button" className="primary-btn retencion-start" onClick={verify}>
            Verificar
          </button>
        ) : (
          <button type="button" className="primary-btn retencion-start" onClick={start}>
            Empezar
          </button>
        )}
      </div>
      <p>{prompt}</p>
      {phase === 'idle' || phase === 'watch' ? (
        <div className="retencion-row" style={{ '--retencion-cols': Math.min(5, count) } as CSSProperties}>
          {(phase === 'watch' ? target : Array.from({ length: count }, () => '')).map((symbol, index) => (
            <span key={`${symbol}-${index}`} className={symbol ? '' : 'is-empty'}>
              {symbol}
            </span>
          ))}
        </div>
      ) : null}
      {phase === 'sort' ? (
        <div className="retencion-sort">
          <p className="retencion-label">Destino</p>
          <div className="retencion-row is-slots" style={{ '--retencion-cols': Math.min(5, count) } as CSSProperties}>
            {slots.map((symbol, index) => (
              <button
                key={`slot-${index}`}
                type="button"
                data-retencion-slot={index}
                className={`retencion-slot${symbol ? ' is-filled' : ''}${drag?.over === index ? ' is-target' : ''}${drag?.from === 'slot' && drag.index === index ? ' is-lifted' : ''}`}
                onPointerDown={(event) => {
                  if (!symbol) return
                  startDrag(event, 'slot', index, symbol)
                }}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                {symbol ?? <small>{index + 1}</small>}
              </button>
            ))}
          </div>
          <p className="retencion-label">Piezas</p>
          <div className="retencion-row is-pool" style={{ '--retencion-cols': Math.min(5, count) } as CSSProperties}>
            {pool.map((symbol, index) => (
              <button
                key={`pool-${symbol}-${index}`}
                type="button"
                data-retencion-pool={index}
                className={`retencion-piece${drag?.from === 'pool' && drag.index === index ? ' is-lifted' : ''}`}
                onPointerDown={(event) => startDrag(event, 'pool', index, symbol)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                {symbol}
              </button>
            ))}
          </div>
          {drag ? (
            <span className="retencion-ghost" style={{ left: drag.x, top: drag.y }}>
              {drag.symbol}
            </span>
          ) : null}
        </div>
      ) : null}
      {phase === 'result' ? (
        <div className="retencion-result">
          <p>
            Tiempo de retención <strong>{time.toFixed(2)} s</strong>
          </p>
          {fresh ? <p className="retencion-new-record">¡NUEVO RÉCORD DEL NIVEL!</p> : null}
        </div>
      ) : null}
    </div>
  )
}

const UBICACION = [
  { figures: 5, order: false, small: false, numberMax: 1 },
  { figures: 4, order: false, small: false, numberMax: 2 },
  { figures: 4, order: false, small: false, numberMax: 3 },
  { figures: 4, order: false, small: false, numberMax: 5 },
  { figures: 6, order: true, small: true, numberMax: 9 },
]

function dealUbicacion(level: number, total: number) {
  const rule = UBICACION[level - 1]
  const count = Math.min(rule.figures, Math.max(1, total - 1))
  const targets = pick(Array.from({ length: total }, (_, index) => index), count)
  const numbers: Record<number, number> = {}
  if (rule.numberMax > 0) {
    for (const index of targets) numbers[index] = 1 + Math.floor(Math.random() * rule.numberMax)
  }
  return { targets, numbers }
}

export function Ubicacion() {
  const [level, setLevel] = useState(1)
  const rule = UBICACION[level - 1]
  const boardRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState({ cols: 4, rows: 4 })
  const [targets, setTargets] = useState<number[]>([])
  const [numbers, setNumbers] = useState<Record<number, number>>({})
  const [counts, setCounts] = useState<Record<number, number>>({})
  const [cursor, setCursor] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'watch' | 'mark' | 'done' | 'fail'>('idle')
  const [session, setSession] = useState<number | null>(null)
  const [best, setBest] = useState(() => readBestTime('ubicacion', 1))
  const [fresh, setFresh] = useState(false)
  const [help, setHelp] = useState(false)
  const started = useRef(0)
  const memoMs = useRef(0)

  useLayoutEffect(() => {
    if (!rule.small) {
      setGrid((current) => (current.cols === 4 && current.rows === 4 ? current : { cols: 4, rows: 4 }))
      return
    }
    function measure() {
      const node = boardRef.current
      if (!node) return
      const width = node.parentElement?.clientWidth ?? node.clientWidth
      const top = node.getBoundingClientRect().top
      const height = Math.max(160, window.innerHeight - top - 16)
      const cell = 36
      const gap = 6
      const cols = Math.max(4, Math.floor((width + gap) / (cell + gap)))
      const rows = Math.max(4, Math.floor((height + gap) / (cell + gap)))
      setGrid((current) => (current.cols === cols && current.rows === rows ? current : { cols, rows }))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [rule.small])

  useEffect(() => {
    setTargets([])
    setNumbers({})
    setCounts({})
    setCursor(0)
    setSession(null)
    setFresh(false)
    setBest(readBestTime('ubicacion', level))
    setPhase('idle')
  }, [level, grid.cols, grid.rows])

  function finish(ok: boolean) {
    if (ok) {
      const previous = readBestTime('ubicacion', level)
      const next = saveBestTime('ubicacion', level, memoMs.current)
      const isRecord = previous == null || next < previous
      setBest(next)
      setFresh(isRecord)
      setPhase('done')
      if (getGamified()) {
        const gold = GOLD.ubicacionLevel * level
        awardGold(gold, `¡Ubicación! +${gold} de oro 🪙`)
        if (isRecord) {
          const extra = GOLD.ubicacionRecord * level
          window.setTimeout(() => {
            awardGold(extra, `¡Récord de ubicación! +${extra} de oro 🪙`)
          }, GOLD_FX_TOAST_MS + 200)
        }
      }
      return
    }
    setPhase('fail')
  }

  function start() {
    const next = dealUbicacion(level, grid.cols * grid.rows)
    setTargets(next.targets)
    setNumbers(next.numbers)
    setCounts({})
    setCursor(0)
    setSession(null)
    setFresh(false)
    started.current = performance.now()
    setPhase('watch')
  }

  function memorized() {
    memoMs.current = Math.max(1, Math.round(performance.now() - started.current))
    setSession(memoMs.current)
    setCounts({})
    setCursor(0)
    setPhase('mark')
  }

  function mark(index: number) {
    if (phase !== 'mark') return
    if (rule.order && index !== targets[cursor]) {
      finish(false)
      return
    }
    if (!targets.includes(index)) {
      finish(false)
      return
    }
    if (rule.numberMax === 0) {
      if (index in counts) return
      const next = { ...counts, [index]: 1 }
      setCounts(next)
      if (rule.order) setCursor((current) => current + 1)
      if (targets.every((item) => next[item] === 1)) finish(true)
      return
    }
    const nextCount = ((counts[index] ?? 0) + 1) % (rule.numberMax + 1)
    const next = { ...counts, [index]: nextCount }
    setCounts(next)
    if (rule.order && nextCount === numbers[index]) setCursor((current) => current + 1)
    if (targets.every((item) => (item === index ? nextCount : (counts[item] ?? 0)) === numbers[item])) finish(true)
  }

  const prompt =
    phase === 'idle'
      ? 'Pulsa Empezar y memoriza las casillas.'
      : phase === 'fail'
        ? 'Fallaste.'
        : phase === 'done'
          ? fresh
            ? 'Encontraste las casillas. ¡Nuevo récord!'
            : 'Encontraste las casillas.'
          : phase === 'watch'
            ? rule.numberMax > 0
              ? rule.order
                ? 'Memoriza el número y el orden.'
                : 'Memoriza el número de cada casilla.'
              : rule.order
                ? 'Recuerda el orden.'
                : 'Recuerda las casillas.'
            : rule.numberMax > 0
              ? rule.order
                ? 'Aprieta en orden hasta cada número.'
                : 'Aprieta cada casilla hasta su número.'
              : rule.order
                ? 'Márcalas en orden.'
                : 'Marca las que brillaron.'

  return (
    <div className="memoria-game">
      <p className={`concentra-hud-times${fresh ? ' is-new' : ''}`}>
        <span>
          Sesión <strong>{session == null ? '—' : formatRunMs(session)}</strong>
        </span>
        <span>
          {best == null ? (
            'Sin récord'
          ) : (
            <>
              {fresh ? 'Nuevo récord' : 'Récord'} <strong>{formatRunMs(best)}</strong>
            </>
          )}
        </span>
      </p>
      <div className="retencion-bar">
        <button
          type="button"
          className={`memorama-hard${level > 1 ? ' is-on' : ''}`}
          disabled={phase === 'watch'}
          onClick={() => setLevel((current) => (current >= 5 ? 1 : current + 1))}
        >
          Cambiar dificultad (Nivel {level})
        </button>
        {phase === 'watch' ? (
          <button type="button" className="primary-btn retencion-start" onClick={memorized}>
            Ya, memorizado
          </button>
        ) : phase === 'mark' ? (
          <button type="button" className="primary-btn retencion-start is-ghost" tabIndex={-1} aria-hidden disabled>
            Ya, memorizado
          </button>
        ) : (
          <button type="button" className="primary-btn retencion-start" onClick={start}>
            Empezar
          </button>
        )}
      </div>
      <div className="memoria-help-row">
        <p>{prompt}</p>
        <button type="button" className="memoria-help" aria-label="Ayuda" aria-expanded={help} onClick={() => setHelp(true)}>
          ❓
        </button>
      </div>
      {help ? (
        <div className="memoria-help-card" role="dialog" aria-label="Cómo ganar">
          <button type="button" className="memoria-help-close" aria-label="Cerrar" onClick={() => setHelp(false)}>
            ×
          </button>
          <p>
            Algunas casillas muestran un número. Cada vez que aprietas esa casilla, el número sube 1. Al llegar al
            máximo, 5 o 9 según el nivel, vuelve a 0. Ganas cuando cada casilla queda en el número que viste. Si el
            nivel pide orden, complétalas en el orden en que aparecieron.
          </p>
        </div>
      ) : null}
      <div
        ref={boardRef}
        className={`memoria-cells${rule.small ? ' is-small' : ''}`}
        style={rule.small ? ({ '--cols': grid.cols } as CSSProperties) : undefined}
      >
        {Array.from({ length: grid.cols * grid.rows }, (_, index) => {
          const goal = numbers[index]
          const count = counts[index]
          const lit =
            phase === 'watch'
              ? targets.includes(index)
              : rule.numberMax === 0
                ? count === 1
                : count != null && count === goal
          const label = phase === 'watch' && goal ? String(goal) : phase === 'mark' || phase === 'done' || phase === 'fail' ? (count != null ? String(count) : '') : ''
          return (
            <button
              key={index}
              type="button"
              className={lit ? 'is-on' : ''}
              aria-label={`Casilla ${index + 1}`}
              onClick={() => mark(index)}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
