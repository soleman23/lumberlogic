# Lumber Calculator — Design Spec (attach to claude.ai/design)

A condensed, single-file reference. Attach this alongside the prompt so the
design tool has exact tokens and screen contents.

## App
- Name: **Lumber Calculator**
- Audience: lumber broker, used on a phone in the field
- Platform target: 390px wide phone; max content width 480px, centered
- Mode: light only

## Layout shell
| Region | Size | Notes |
|--------|------|-------|
| Header | 56px, fixed top | green `#2D6A4F`, app name white 18px bold, centered |
| Content | scrollable | one white card per screen |
| Tab bar | 64px, fixed bottom | 6 tabs, white, top divider `#CED4DA` |

## Color tokens
| Token | Hex | Use |
|-------|-----|-----|
| Primary green | `#2D6A4F` | header, active tab, primary button |
| Dark green | `#1B4332` | result numbers |
| Light green | `#D8F3DC` | result card bg |
| Mid green | `#52B788` | pills, highlights |
| Off-white | `#F8F9FA` | page bg |
| Dark gray | `#212529` | body text |
| Mid gray | `#6C757D` | labels, placeholders, subtext |
| Light gray | `#CED4DA` | borders, dividers |
| Amber | `#FFC107` | warnings |
| White | `#FFFFFF` | cards, inputs |

## Type
- Stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- Base 16px · card title 20px/700 · description 13px/`#6C757D`
- Result primary 28px/700 `#1B4332` · result secondary 16px/`#6C757D`
- Inputs 18px (prevents iOS zoom)

## Components
- **Card:** white, radius 12px, padding 16px, subtle shadow.
- **Input:** 48px tall, white, 1px `#CED4DA`, radius 8px; focus = green border + soft green glow; gray unit chip on right edge.
- **Result card:** light-green `#D8F3DC`, radius 12px, padding 16px; shows "—" when empty.
- **Warning strip:** amber border `#FFC107` on `#FFF8E1`, small text.
- **Segmented toggle:** two/three buttons, active = green fill + white text.
- **Pills:** rounded, green outline, fill green when selected; ≥40px tall.
- **Buttons:** Clear (outlined gray) + Copy 📋 (filled green); both 44px.
- **Tab:** emoji icon + 11px label; active = green + 3px green top border.

## Spacing
8px base · card padding 16px · row gap 12px · section gap 24px · radii: 8px inputs, 12px cards.

## Tabs
| # | Icon | Label |
|---|------|-------|
| 1 | 📐 | Board Ft |
| 2 | 💲 | Pricing |
| 3 | 🔢 | Pieces |
| 4 | 📏 | Linear |
| 5 | ♻️ | Waste |
| 6 | 🚚 | Load |

## Screen contents (with example values)

**1. Board Feet** — "Add one or more dimensions and total the board feet."
- Stacked Item cards; each: Thick(in) / Width(in) / Length(ft) / Qty(pcs) + small green per-line BF
- Dashed "+ Add Line" button
- Result: **1,066.67 BF total** · "2 line items"

**2. Pricing** — "Calculate the cost of an order."
- Toggle: **$/MBF** | $/BF
- Total Board Feet (BF) · Price per MBF ($…/MBF) · Quantity (pcs, optional)
- Result: **$4,250.00** · "5,000 BF @ $850/MBF · $42.50 per piece"

**3. Piece Count** — "How many pieces to hit a target board footage."
- Target Board Feet (BF) · Thickness / Width / Length (3 small fields)
- Result: **188 pieces** · "Actual: 1,002.67 BF · Overage: 2.67 BF"

**4. Linear ↔ Board Feet** — "Convert between linear feet and board feet for a dimension."
- Toggle: **Linear → Board** | Board → Linear
- Linear Feet (LF) · Thickness / Width (2 small fields)
- Result: **100.00 BF** · "2×6 dimension"

**5. Waste / Overage** — "Add a waste buffer to a quantity."
- Base Quantity · pills: 10% Framing / 15% Decking / 20% Flooring / 25% Custom · Waste %
- Result: **1,150.00** · "Base: 1,000 + Waste: 150 (15.0%)"

**6. Load Estimator** — "Estimate trucks needed for a load."
- Toggle: **By Weight** | By Board Feet
- Weight mode: pills "Maxi 65,000 lb" / "Reg 48,000 lb"; fields Truck Capacity (lb) · Total Board Feet (BF) · Weight per BF (lb/BF)
- Result: **2 trucks** · "Total weight: 75,000 lb · Last truck: 10,000 lb"

## Accessibility
WCAG-AA contrast · 44px min tap targets · labeled inputs · no meaning by color alone · respect safe-area insets.
