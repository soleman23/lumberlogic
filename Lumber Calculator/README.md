# Lumber Calc — Mobile-First Lumber Calculator PWA

A single-page Progressive Web App for a professional lumber broker who uses it daily in the field from his phone. No frameworks, no backend, no build step — vanilla HTML/CSS/JS. Works offline once loaded.

## For Claude Code: Read These First

Before writing any code, read the spec files in this order:

1. `REQUIREMENTS.md` — the 6 calculator modules, input behavior, error handling, navigation
2. `FORMULAS.md` — exact lumber math. Implement formulas exactly as written; these are industry-standard
3. `UI_SPEC.md` — layout, color palette, typography, spacing, accessibility
4. `OPEN_QUESTIONS (1).docx` — decisions on ambiguous items (Word file; extract text if needed). Resolved defaults are summarized below

`claude-design/` contains earlier design prompts/specs (`DESIGN_PROMPT.md`, `DESIGN_SPEC.md`, `STEPS.md`) — reference only, specs above take precedence.

## Current State

The app is **already built and working**. Don't rebuild from scratch — modify the existing files unless explicitly asked otherwise.

| File | Purpose |
|------|---------|
| `index.html` | App shell: header, 6 calculator screens, bottom tab bar |
| `app.js` | All calculator logic, live recalculation, clipboard copy |
| `styles.css` | All styles per UI_SPEC.md |
| `manifest.json` | PWA manifest (name "Lumber Calc", theme #2D6A4F, standalone) |
| `service-worker.js` | Offline caching |
| `icons/` | 192, 512, and 512-maskable PNG icons |

## The 6 Calculators (bottom tab bar)

1. **Board Feet** — (T″ × W″ × L′) / 12 × qty; supports multiple line items
2. **Pricing** — cost from $/MBF (default) or $/BF toggle
3. **Piece Count** — pieces needed for target BF; always CEIL, show overage
4. **Linear Feet** — LF ↔ BF converter, both directions
5. **Waste** — % buffer with preset pills (10/15/20/25%)
6. **Load Estimator** — trucks needed; presets 53′ (100k BF), 48′ (80k BF), short haul (40k BF), custom; BF or weight toggle

## Resolved Decisions (from OPEN_QUESTIONS)

- Nominal dimensions (not actual) for inputs
- Price per MBF is the default pricing unit; $/BF is a toggle
- No calculation history in MVP ("calculate and go")
- Copy result to clipboard (no share sheet)
- Imperial units only for MVP
- Board Feet screen supports multiple line items (Q7)
- Load Estimator has a weight/BF toggle (Q8)

## Non-Negotiable Rules

- **Formulas per FORMULAS.md exactly.** BF = (thickness_in × width_in × length_ft) / 12
- **Rounding:** BF/LF/currency to 2 decimals; piece and truck counts always CEIL; never round piece counts down
- **Live calculation** as the user types — no submit button
- **Never show NaN, Infinity, or raw JS errors.** Blank/zero inputs show "—"; warn if result > 1,000,000 BF
- **Mobile-first:** 390px design width, max-width 480px centered on desktop; tap targets ≥ 44px; input font ≥ 16px (prevents iOS zoom)
- **Offline-capable:** if you add or rename files, update the service worker cache list and bump the cache version
- Target browsers: iOS Safari 16+, Android Chrome 110+
- No console errors on load; all inputs have `<label>`s; WCAG AA contrast

## Testing Locally

No build step. Serve the folder over HTTP (service workers don't register from `file://`):

```
npx serve .
# or
python -m http.server 8080
```

Then open on a phone or in DevTools mobile emulation (390px). After changing `service-worker.js` or cached files, hard-refresh or unregister the SW to see updates.

## Spot-Check Values

- 2×4×8′ = 5.33 BF/pc; 10 pcs = 53.33 BF
- 5,000 BF @ $850/MBF = $4,250.00
- 100 LF of 2×6 = 100 BF; 100 LF of 2×4 = 66.67 BF
- 1,000 BF + 15% waste = 1,150 BF
