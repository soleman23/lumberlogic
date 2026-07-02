# Lumber Logic

Lumber broker tools: board-feet tally, pricing, saved loads, and quotes.

## Production app

The **Lumber Logic / Tally** app is in [`tally/`](tally/):

```bash
cd tally
npm install
npm run dev
```

Build for production:

```bash
cd tally
npm run build
```

Output goes to `tally/dist/` (PWA with offline support).

## Reference materials

| Folder | Purpose |
|--------|---------|
| [`tally/`](tally/) | React + Vite + TypeScript PWA (production) |
| [`design_handoff_lumber_logic/`](design_handoff_lumber_logic/) | Design spec, tokens, interactive prototypes |
| [`Lumber Calculator/`](Lumber%20Calculator/) | Legacy 6-calculator vanilla PWA (reference) |

## Tests

```bash
cd tally
npm test
```
