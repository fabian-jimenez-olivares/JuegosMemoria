# Secuencia

## Qué hace
Repite la secuencia de pads iluminados. Cada acierto alarga la cadena.

Módulo de origen en la app: **memoria** (`src/components/`).

## Cómo ejecutarlo
Desde esta carpeta:

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite (por defecto http://localhost:5173).

## Estructura
- `src/Game.tsx` — lógica del juego (modifica aquí).
- `src/App.tsx` — montaje mínimo.
- `src/stubs/` — sustitutos de oro, récords, preferencias y tool-use de la app principal.
- `src/styles.css` — estilos extraídos + base.

## Cómo devolver cambios a la app
1. Edita y prueba en este proyecto standalone.
2. Pásame (o copia) el `Game.tsx` (y CSS si cambió) para reintegrarlo en:
   - Concentración → `src/components/ConcentracionPanel.tsx`
   - MindGames → `src/components/MindGamesPanel.tsx` / `RainMathGame.tsx`
   - Memoria → `src/components/MemoriaPanel.tsx` / `Memorama.tsx`

Los stubs no deben pegarse tal cual en la app: allí ya existen `useWallet`, `GOLD`, etc.
