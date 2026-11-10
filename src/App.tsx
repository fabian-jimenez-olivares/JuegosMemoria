import { useState, type CSSProperties, type ReactNode } from 'react'
import { Memorama } from './Memorama'
import { Secuencia, Retencion, Ubicacion } from './MemoriaGames'
import { bumpToolUse } from './stubs/hooks/useToolUse'

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

const GAME_TITLES: Record<GameId, string> = {
  pares: 'Memorama',
  secuencia: 'Secuencia',
  retencion: 'Retención',
  ubicacion: 'Ubicación',
}

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export default function App() {
  const [game, setGame] = useState<GameId | null>(null)

  function choose(next: GameId | null) {
    setGame(next)
    if (next) bumpToolUse('memoria')
  }

  if (!game) {
    return (
      <main className="game-shell">
        <h1>Memoria</h1>
        <p className="hub-lead">Ejercita la memoria.</p>
        <section className="panel aldea-hub-panel">
          <nav className="module-grid memoria-grid" aria-label="Minijuegos de memoria">
            {GAMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className="module-tile aldea-module-tile"
                style={{ '--tile-accent': item.accent } as CSSProperties}
                onClick={() => choose(item.id)}
              >
                <span className="module-icon">
                  <Glyph>{item.icon}</Glyph>
                </span>
                <span className="module-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </section>
      </main>
    )
  }

  return (
    <main className="game-shell memoria-play">
      <header className="hub-play-bar">
        <button type="button" className="action-btn" onClick={() => choose(null)}>
          ← Memoria
        </button>
        <h1>{GAME_TITLES[game]}</h1>
      </header>
      {game === 'pares' ? <Memorama /> : null}
      {game === 'secuencia' ? <Secuencia /> : null}
      {game === 'retencion' ? <Retencion /> : null}
      {game === 'ubicacion' ? <Ubicacion /> : null}
    </main>
  )
}
