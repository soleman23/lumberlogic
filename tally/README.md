# Lumber Logic (Tally)

React + Vite + TypeScript PWA for lumber brokers: calculator worksheet, saved loads, price book, and send quote.

## Develop

```bash
cd tally
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Build output is in `dist/`. Deploy to GitHub Pages, Netlify, or any static host. PWA service worker registers automatically in production builds.

## Structure

- `src/lib/tallyMath.ts` — pure calculation functions (unit tested)
- `src/context/` — React state + localStorage persistence
- `src/screens/` — Calculator, Saved Loads, Prices, Send Quote
- `src/styles/tokens.css` — design tokens from design handoff
