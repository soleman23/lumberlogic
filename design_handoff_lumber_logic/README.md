# Handoff: Lumber Logic — Tally lumber calculator

## Overview
Lumber Logic ("Tally") is a lumber broker's working tool: it turns rough dimensions and unit counts into board feet, lineal feet, and load pricing, then lets the broker save priced loads, maintain a price book against weekly market numbers, and send a quote document to a customer. Four app screens (Calculator, Saved Loads, Prices, Send Quote), fully responsive across desktop / tablet / phone.

## About the design files
The files in `design/` are **design references created in HTML** — interactive prototypes showing intended look and behavior, **not production code to copy directly**. Your task is to **recreate these designs in your codebase's environment** (React, Vue, Swift, etc.) using its established patterns and libraries. If no codebase exists yet, choose an appropriate stack (a React SPA with client-side routing is a natural fit — the prototypes' logic is already written as React-style class components you can read for exact behavior).

Open any `design/*.dc.html` file directly in a browser to see and interact with the live design (keep `support.js` beside them). Every screen's markup uses inline styles, so exact values (colors, sizes, spacing) can always be read straight from the source.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, shadows, copy, and interactions are final. Recreate pixel-perfectly. All demo data (customers, species, prices) is placeholder seed data — replace with real data models.

---

## Design tokens

Canonical CSS custom properties live in `tokens/` (`colors.css`, `typography.css`, `spacing.css`; `styles.css` is the import root). Key values:

### Color
- **Timber (brand / primary actions):** 50 `#FBF4EA` · 100 `#F4E4CC` · 200 `#E9C99B` · 300 `#DDAC6A` · 400 `#CE8E3F` · **500 `#BC7A2C` (brand)** · **600 `#A0641F` (press/hover)** · 700 `#7E4E18` · 800 `#5C3914` · 900 `#3D260F`
- **Oak (warm neutrals):** page backdrop `#EFE7D8` · surface `#FFFFFF` · paper `#FAF6EF` · 100 `#F3ECE0` · 200 `#E6DCCC` (default border) · 300 `#D6C8B2` (strong border) · 500 `#8C7E6B` (muted text) · 700 `#4A3F33` (body text) · ink `#221A12` (strong text)
- **Walnut (dark panels):** bg `#17120D` · surface `#211A13` · surface-2 `#2B221A` · line `#3A2F23` · text `#F3ECE0` · text-dim `#C9BCA6` · text-mute `#A89A85`
- **Semantic:** Forest `#3F7D54` (yield / savings / quoted; the screens also use `#2F6342` for money-green text and `#9FCBAE` on dark) · Clay `#C0492F` (waste / overrides; `#B5482F` in text/inputs) · Amber `#D69A2E` (review / draft)
- No gradients anywhere. Shadows are always **warm brown**, never grey.

### Typography (Google Fonts)
- **Space Grotesk** 600/700 — headlines, dimension labels ("2×6"), all big figures
- **IBM Plex Sans** 400/500/600 — interface, body, buttons
- **IBM Plex Mono** 400/500 — every tally number, unit, SKU, price, date, status badge, eyebrow label
- Scale: display 64/1.0/−.025em · h1 34/1.05/−.02em · h2 22/1.1/−.01em · body 16/1.5 · label 13 uppercase +.04em · mono 13
- Eyebrow pattern above every page title: Plex Mono, 12px, uppercase, letter-spacing .14em, color `#A0641F`
- Units are lowercase and explicit: `bf`, `LF`, `pc`, `$/MBF`. Dimensions read `2″ × 6″ × 12′`. Signed percentages: `+9.6%`.

### Spacing / radii / elevation
- 4px base scale (4, 8, 12, 16, 24, 32, 48, 72)
- Radii: 6 field · 10 chip/button · 14 card · 18 large container · 999 pill (screens also use 8–9 for small inputs and 16 for grid cards)
- Elevation: flat `0 1px 2px rgba(60,40,15,.06)` · raised `0 4px 14px rgba(60,40,15,.10)` · floating `0 12px 30px rgba(60,40,15,.16)`
- Cards: white, 1px `#E6DCCC` border, soft warm shadow `0 3px 14px rgba(60,40,15,.05)`
- Focus state on inputs: border `#BC7A2C` + ring `0 0 0 3px rgba(188,122,44,.16)`

### Iconography
Inline stroke SVGs, 1.7–2.4px stroke, round caps/joins, drawn in `#7E4E18` (destructive: `#9c4a36`). No icon font, no emoji. Copy every icon path verbatim from the design sources. Brand mark = stacked-timber cube SVG (in every header).

---

## Global chrome (all screens)

- **Top bar:** `#FAF6EF`, 1px bottom border `#E6DCCC`, sticky (unstick when viewport height ≤480px). Content max-width 1240px, padding `12px clamp(14px,3.5vw,28px)`. Left: 30px logo mark + "Lumber Logic" wordmark (Space Grotesk 700 18px; "Lumber" ink, "Logic" `#A0641F`). Center-left: nav links (14px; active = weight 600 ink on `#F3ECE0` pill, inactive = 500 `#8C7E6B`, hover → ink). Right: screen-specific action + 34px round avatar (`#7E4E18` bg, `#F4E4CC` initials "CB").
- **Main column:** max-width 1240px, padding `clamp(20px,5vw,32px) clamp(14px,3.5vw,28px) 72px`.
- **Page header:** eyebrow (mono uppercase) → h1 `clamp(26px,7vw,32px)` → one-line description 14px `#6B5E4D`.
- **Toast:** fixed bottom-center, `#17120D` bg, `#F3ECE0` text 14px/500, radius 12, floating shadow, green check icon; auto-dismiss ~2.6–2.8s. On phones it lifts above the tab bar.

### Responsive tiers
- Phone **≤760px** (design floor 375px), tablet **761–1099px**, desktop **≥1100px**. Landscape phones: height ≤480px drops tab-bar labels to icons and unsticks the header.
- **Phone navigation (decided pattern — see `Mobile Explorations.dc.html`, options 1a + 1e):** the top-bar nav is replaced by a fixed 3-tab bottom bar (Calculator / Loads / Prices): `#FAF6EF` bg, top border, 21px stroke icons + 11px labels, active tab `#A0641F`, ≥44px targets, safe-area inset padding. Header actions collapse to short labels or icon-only buttons.
- Grids use `repeat(auto-fill, minmax(min(<col>,100%), 1fr))`; gutters and display type use `clamp()`.

---

## Screens

### 1 · Calculator ("Load tally") — `design/Tally Home.dc.html`
The core worksheet. Five dimension blocks (2×4, 2×6, 2×8, 2×10, 2×12) × seven lengths (8–20 ft, step 2).

**Math** (see `dimTotals()` in source): a cell's board feet = `units × length × pieces/unit × (t×w/12)`. LF = `units × length`. Cost = `bf × effectivePrice / 1000`, where effective $/MBF = per-cell override if set, else the dimension's base $/MBF. Avg $/MBF = `cost/bf × 1000`.

**Desktop block layout** — one card (radius 16) split into three panels:
1. **Info panel** (188px, `#FAF6EF`, right border): accent swatch (12px, radius 3) + dimension label (Space Grotesk 700 22px); "Pieces / unit" number input (mono 600 17px, **clay-red text `#B5482F`**); "Base $ / MBF" input with $ prefix (mono, `#7E4E18`).
2. **Grid** (flex-1): four rows labeled ft / Units / $-MBF / Board ft (62px row labels, 10–11px uppercase). Length headers Space Grotesk 600 15px. Unit inputs: `#FAF6EF` bg, `#D6C8B2` border, radius 8, mono 600 16px centered. Price-override inputs: white bg, `#7E4E18` text; **when overridden** → text `#B5482F`, bg `#FBEFE9`, border `#E0B8A8`. Board-ft row is read-only mono 12px `#8C7E6B`; empty cells show `·`.
3. **Row summary** (212px, Walnut `#17120D`): "Board feet" figure (Space Grotesk 600 30px white + `bf` unit in `#CE8E3F`), then a 2×2 mono grid: Pieces, LF, Avg $/MBF (`#CE8E3F`), Cost (`#9FCBAE`), separated by a `#2C231A` top border.

**Grand totals** (top-right, desktop): three tiles — Total board ft (Walnut dark tile), Pieces (white tile), Load value (white tile, green `#2F6342` figure). All 28px Space Grotesk.

**Mixed-truck builder** (below the worksheet): heading + "Add truck" primary button (Timber `#BC7A2C`, radius 10, white text, + icon; hover `#A0641F`). Cards in an auto-fill grid (min 340px): editable truck-name input (bottom-border style, focus → Timber), delete button (trash, `#9c4a36`), toggleable member chips (pill; on = `#7E4E18` bg / `#F4E4CC` text, off = white / `#8C7E6B`, 1px border), "On this truck" bf figure + `LF · pcs` line, right-aligned "Target bf" input, and a 10px progress bar (track `#F3ECE0`): fill Timber normally, **Forest `#2F6342` at 92–105% full, Clay `#B5482F` when over 100%**; width animates `.25s ease`. Below: `NN% full` (colored to match) and `N bf left` / `+N over`.

**Tablet:** info panel folds into a header row (label + pc/unit + base $/MBF inputs); grid keeps horizontal layout; summary becomes a full-width Walnut strip.
**Phone:** each block = header row (label + compact pc/unit + $/MBF), then **one row per length**: grid `40px 1fr 76px` — length (Space Grotesk 600 16px), a −/input/+ stepper (buttons 40×44, `#FAF6EF` bg, radius 9; input 44px tall mono 600 17px), right-aligned board-ft. Per-length $/MBF overrides are **desktop/tablet only**. Grand totals become a **fixed Walnut totals strip** pinned above the tab bar (bf + pcs left, green $ right). "Clear tally" → "Clear".

**State:** `pieces{dim}`, `base{dim}`, `units{dim|len}`, `override{dim|len}` (null = no override), truck groups `{id, name, target, members[]}`. "Clear tally" zeroes all units and overrides. Everything recomputes live on change.

### 2 · Saved loads ("Your tally book") — `design/Tally Saved Loads.dc.html`
Header action: "New load" primary button (+ icon) → Calculator; phone: 38px icon-only.

**Controls row:** search input (icon + placeholder "Search customer or species", 40px, radius 10) · status segmented filter All/Quoted/Draft (active = `#7E4E18` bg `#F4E4CC` text, radius 7 inside radius-10 container) · sort select (Date saved / Load value / Board ft / Pieces / Customer) + direction toggle button (arrow rotates 180° when ascending, `.15s`).

**Load card** (auto-fill grid, min 300px; radius 16): 40px initials tile (`#F4E4CC` bg, `#7E4E18` mono) · customer name 15px/600 ellipsized · mono sub-line `{ref} · {species}` in `#A0641F` · status pill top-right (**Quoted** = green `#2F6342` on `#E4EFE6`, border `#CADDCD`; **Draft** = amber `#9A6A12` on `#F8ECCF`, border `#EAD7A6`). Middle: Board feet figure (29px) vs. Value (22px green, right). Stats strip (`#FAF6EF`, radius 11, 3 columns): Pieces / $-MBF / Saved. Footer buttons: **Open** (outline, `#7E4E18`) · **Send** (primary Timber) · duplicate + delete 38px icon squares (delete hover → `#F4E5E0` bg).

**Behavior:** search matches name/species/ref; filter + sort combine; Open → Calculator; Send → Send screen; Duplicate inserts a Draft copy below the original; Delete removes; each fires a toast. Empty state: centered card "No loads match your search."

### 3 · Prices ("Board price book") — `design/Tally Prices.dc.html`
Header action: "Sync market" outline button (refresh icon); phone: icon-only.
Eyebrow carries the week: "Price sheet · week of Jun 29".

**Controls:** search ("Search species or grade") + segmented All / Softwood / Hardwood.
**Stat tiles** (5, flex-wrap): Softwood avg, Hardwood avg, Avg margin (green), Movers up (green), Movers down (clay) — 26px figures, mono sub-labels.

**Species groups:** "SOFTWOOD / HARDWOOD" section headers (Space Grotesk 600 15px uppercase `#7E4E18` + hairline + count). Cards (auto-fill min 384px): accent swatch + species name 17px + grade tag (mono 10px uppercase on `#F4E4CC`) + "Upd {date}" + weekly-change pill (▲/▼ + %, green/clay/neutral, computed vs. last week). Rows per size (dashed `#F2EBDE` separators): size label (Space Grotesk 600 15px; dimensional `2×4`…`2×12` for softwood, quarters `4/4`…`8/4` for hardwood) · **"Your $" editable input** (80px, `#FAF6EF` bg, mono 600, `#7E4E18`) · market price + weekly delta (▲/▼ + `+N`/`−N`/`unch`, green/clay/`#A99B86`) · **margin badge** `+X.X%` (green `#2F6342` on `#E4EFE6`) or negative (clay `#B5482F` on `#FBEFE9`).

**Behavior:** editing "Your $" recomputes that row's margin, the card's averages, and the stat tiles live. Search + group filter combine; empty state card when nothing matches.

### 4 · Send quote — `design/Tally Send.dc.html`
Reached from a Saved Loads card's **Send**. Back link "‹ Saved loads"; eyebrow `Cascade Millworks · Q-2026-0428`; header shows a Draft status dot (amber) + quote number (desktop only).

**Two-panel workspace** (side-by-side ≥1000px; compose rail stacks **above** the document below 1000px):

**Document desk** (left, flex-1): recessed desk surface `#EAE0CF` (border `#DCCFB9`, radius 18) holding a **US-Letter quote page** (816px wide, min-height 1056px, white, floating shadow):
- Header band `#FBF4EA` (bottom border `#F0E0C6`): logo + company name (Space Grotesk 700 22px) + mono address block; right: "QUOTE" eyebrow, quote number 22px, Issued / Valid-through dates.
- "Prepared for" chip: pill `#F3ECE0` — company 14px/600 · contact · PO, dot-separated.
- **Line-item table** (radius 14, 1px border): header row **ink `#221A12` bg**, mono 10px uppercase `#C9BCA6` — Material / Pcs / Bd ft / $ per MBF / Amount. Rows zebra white/`#FAF6EF`: species 14px/600 + grade tag + mono dims (`2″×6″×16′`); numbers right-aligned mono 13px.
- Totals: left mono block (items / pieces / board feet); right card `#FBF4EA` (radius 14): Subtotal, Freight, Tax (resale exempt $0.00), rule `#E9C99B`, then **Total due** (Space Grotesk 700 26px `#A0641F`).
- Note block `#FAF6EF`: "Note from Casey Brooks" eyebrow + message text (mirrors the rail's textarea live).
- Footer line, mono 10px `#A99B86`, centered: validity + FOB + company.

**Compose rail** (right, 360px, sticky top-86px on desktop; radius 18, floating shadow):
- "SEND TO CUSTOMER" eyebrow + "Send quote" h3
- **To:** customer card (`#FAF6EF`; 34px initials tile, name + contact/role) + email input with envelope icon
- **Delivery:** segmented Email / Share link / PDF (active = white bg + small shadow)
- **Message to customer:** textarea (5 rows) — live-updates the document note
- **Document options:** "Show per-line $/MBF" toggle (44×26 pill; on = Timber; hides the $/MBF column and reflows the table grid) · "Valid through" date input (updates both document dates)
- Quote total banner (`#FBF4EA`, green 20px figure)
- **Send quote** primary button (Timber, send icon, 44px) + 44px PDF-download icon button. Send fires a toast ("Emailed …" per delivery method) then returns to Saved Loads (~1.4s).

**Phone document reflow:** table grid drops Pcs and $/MBF columns (`1fr 62px 92px`); totals block keeps counts; page min-height auto.

### Mobile pattern reference — `design/Mobile Explorations.dc.html`
Option **2a** at the top is the decided phone pattern (bottom tab bar **1a** + stacked length rows **1e**), assembled at 375px with live inputs. Options 1b/1c/1d/1f were explored and rejected — reference only.

### Design-system specimen — `design/Tally Design System.dc.html`
Full foundations + components + screens sheet. Use it as the visual source of truth when a value is ambiguous.

---

## Interactions & motion summary
- Restrained motion: progress bars ease width `.25s`; sort-direction arrow rotates `.15s`; toggle track color-transitions `.16s`. No entrance animations on app screens.
- Hover = darker fill or border→Timber; focus = Timber border + 3px amber ring; primary button hover `#BC7A2C → #A0641F`.
- All recomputation (tally math, margins, quote totals) is synchronous and live on every keystroke/click.
- Hit targets on phone ≥44px.

## State management (suggested)
- **Tally worksheet:** dims (static config: name, t, w, default pieces, accent) + `units`, `pieces`, `base`, per-cell `override` maps; truck groups. Persist as a "load" when saved.
- **Loads:** list of `{id, customer, ref, species, status: Quoted|Draft, bf, value, pieces, savedDate}` + query/filter/sort UI state.
- **Price book:** static species/size config + `yourPrice` map; market prices + weekly change come from a market-sync source.
- **Send:** quote (lines, freight, validUntil, showUnitPricing), recipient (customer, contact, email), message, delivery method.
- Note: there is no customer-management flow designed yet — the Send recipient is seeded per quote. Treat the customer entity as an open design/product question.

## Assets
- Brand mark + all icons: inline SVGs inside the design sources (copy verbatim).
- Fonts via Google Fonts: Space Grotesk (500–700), IBM Plex Sans (400–600), IBM Plex Mono (400–500).
- No raster images.

## Screenshots
`screenshots/` holds desktop captures for quick visual reference: `01-calculator`, `02-saved-loads`, `03-prices`, `04-send-quote`, plus `05-mobile-pattern` (the decided 375px layout). They are convenience previews only — the interactive HTML in `design/` is the source of truth.

## Files in this bundle
- `design/Tally Home.dc.html` — Calculator (desktop/tablet/phone logic included)
- `design/Tally Saved Loads.dc.html` — Saved loads
- `design/Tally Prices.dc.html` — Price book
- `design/Tally Send.dc.html` — Send quote
- `design/Mobile Explorations.dc.html` — phone-pattern decision record (2a = decided)
- `design/Tally Design System.dc.html` — foundations/components specimen
- `design/support.js` — runtime that makes the prototypes interactive in a browser (not for production)
- `tokens/*.css` — canonical design tokens (colors, typography, spacing/radius/elevation)
- `components/Button|Stepper|Chip` — extracted React form primitives with `.d.ts` prop contracts and usage notes (`.prompt.md`); good starting points for your component library
- `screenshots/*.png` — desktop reference captures

## Suggested implementation order
1. Tokens + fonts + global chrome (top bar, tab bar, toast)
2. Calculator math core (pure functions, unit-tested against the formulas above)
3. Calculator screen (desktop → tablet → phone)
4. Saved loads, then Prices
5. Send quote (document render + compose rail)
6. Wire persistence (saved loads, price book) and real market data
