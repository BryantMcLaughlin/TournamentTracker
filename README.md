# Tournament Tracker HUD

Lightweight Vue 3 + Vite dashboard for monitoring live tournament brackets. Connect with a tournament ID to see the ready queue, athlete lookups, bracket summaries, and live stats streamed from the bracket sync API.

## Quick start
- Install Node.js 18+ and npm.
- Install deps: `npm install`
- Start dev server: `npm run dev` (default on http://localhost:5173)
- Build for production: `npm run build`
- Preview the build: `npm run preview`

## Configuration
- Optional: set `VITE_BRACKET_SYNC_URL` in `.env.local` to point at your bracket sync API.  
  Defaults to `https://brackets-production.up.railway.app`.

## Usage
- Enter a tournament ID to connect; recent tournaments load automatically.
- The HUD streams updates (SSE) and shows ready matches with ETA estimates, athlete-specific upcoming matches, and per-bracket progress counts.
