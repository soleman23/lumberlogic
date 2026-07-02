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

## Deploy (Netlify)

This repo includes a root [`netlify.toml`](../netlify.toml) configured for:

| Setting | Value |
|---------|-------|
| Base directory | `tally` |
| Build command | `npm run build` |
| Publish directory | `dist` |

In the Netlify dashboard, **do not** override these unless you know why. The most common 404 cause is publishing the repo root instead of `tally/dist`.

After connecting the repo, trigger a new deploy. Direct links like `/loads` and `/prices` work via the SPA redirect rule.

## Structure

- `src/lib/tallyMath.ts` — pure calculation functions (unit tested)
- `src/context/` — React state + localStorage persistence
- `src/screens/` — Calculator, Saved Loads, Prices, Send Quote
- `src/styles/tokens.css` — design tokens from design handoff
