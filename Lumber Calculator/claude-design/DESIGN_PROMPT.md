# Paste-ready prompt for claude.ai/design

Copy everything inside the box below and paste it into claude.ai/design as your first message.
(Optionally attach DESIGN_SPEC.md and a screenshot of the current app for higher fidelity.)

---

Design a mobile-first web app called **Lumber Calculator** — a clean, professional tool a lumber broker uses on his phone in the field. Focus on the visual design and layout (the math doesn't need to fully work yet, but show realistic example numbers in every result). Build it as a single self-contained page.

**Form factor:** Designed for a 390px-wide phone screen. Center the content with a max width of 480px on larger screens. Fixed header on top, fixed bottom tab bar, scrollable content in between.

**Overall feel:** Modern, calm, trustworthy. Forest-green and white. Big tap targets, large readable numbers, no clutter. Think "native iOS/Android utility app," not a website.

## Color palette (use exactly)
- Primary green `#2D6A4F` — header, active tab, primary buttons
- Dark green `#1B4332` — large result numbers
- Light green `#D8F3DC` — result card background
- Mid green `#52B788` — pills, secondary highlights
- Off-white `#F8F9FA` — page background
- Dark gray `#212529` — body text
- Mid gray `#6C757D` — labels, placeholders, sub-text
- Light gray `#CED4DA` — input borders, dividers
- Amber `#FFC107` — warnings
- White `#FFFFFF` — cards and inputs

## Typography
System font stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). Base 16px. Headings 600–700 weight. Result numbers 28px bold. All input text 18px so it's easy to read.

## Structure
- **Header (56px):** solid primary green, app name "Lumber Calculator" centered in white, 18px bold.
- **Bottom tab bar (64px):** white with a top divider, 6 tabs each with an emoji icon + short label. Active tab = green icon/label with a 3px green top border; inactive = mid-gray. Tabs:
  1. 📐 Board Ft
  2. 💲 Pricing
  3. 🔢 Pieces
  4. 📏 Linear
  5. ♻️ Waste
  6. 🚚 Load
- **Content area:** one white rounded card (radius 12px, subtle shadow, 16px padding) per screen, holding a title (20px bold), a one-line gray description (13px), the inputs, a result card, and an actions row.

## Inputs
Each input is a row: a 15px label above a field. Field is 48px tall, white, 1px `#CED4DA` border, 8px radius; on focus the border turns green with a soft green glow. A small gray unit chip sits on the right edge of the field (e.g. "in", "ft", "BF", "%", "lb", "$/MBF"). Number-style inputs.

## Result card
Light-green (`#D8F3DC`) rounded card. Big dark-green primary number (28px bold) with a small unit beside it, and one or two gray secondary lines below (16px). When empty it shows "—". Add an amber warning strip style for "double-check your inputs" messages.

## Action buttons (bottom of each card)
Two side-by-side: **Clear** (outlined, gray) and **Copy 📋** (filled green, white text). Both 44px tall.

## The 6 screens (show each, with example values filled in)

1. **Board Feet** — title "Board Feet", desc "Add one or more dimensions and total the board feet." Show 2 stacked "Item" line cards, each with 4 small side-by-side fields: Thick (in), Width (in), Length (ft), Qty (pcs), and a small green per-line BF readout. A dashed "+ Add Line" button under them. Result: large "1,066.67 BF total", sub "2 line items".

2. **Pricing** — title "Pricing", desc "Calculate the cost of an order." A segmented toggle "$ / MBF | $ / BF" (MBF active). Fields: Total Board Feet (BF), Price per MBF ($ … /MBF), Quantity (pcs, optional). Result: large "$4,250.00", sub "5,000 BF @ $850/MBF · $42.50 per piece".

3. **Piece Count** — title "Piece Count", desc "How many pieces to hit a target board footage." Field: Target Board Feet (BF). A row of 3 small side-by-side dimension fields: Thickness, Width, Length. Result: large "188 pieces", sub "Actual: 1,002.67 BF · Overage: 2.67 BF".

4. **Linear ↔ Board Feet** — title "Linear ↔ Board Feet", desc "Convert between linear feet and board feet for a dimension." Segmented toggle "Linear → Board | Board → Linear". Field: Linear Feet (LF). Two side-by-side dimension fields: Thickness, Width. Result: large "100.00 BF", sub "2×6 dimension".

5. **Waste / Overage** — title "Waste / Overage", desc "Add a waste buffer to a quantity." Field: Base Quantity. A row of pill buttons: "10% Framing", "15% Decking", "20% Flooring", "25% Custom". Field: Waste %. Result: large "1,150.00", sub "Base: 1,000 + Waste: 150 (15.0%)".

6. **Load Estimator** — title "Load Estimator", desc "Estimate trucks needed for a load." Segmented toggle "By Weight | By Board Feet" (Weight active). In weight mode show two truck preset pills "Maxi 65,000 lb" and "Reg 48,000 lb", then fields: Truck Capacity (lb), Total Board Feet (BF), Weight per BF (lb/BF). Result: large "2 trucks", sub "Total weight: 75,000 lb · Last truck: 10,000 lb".

## Spacing & details
8px spacing system. 16px card padding, 12px between input rows, 24px between sections. Respect mobile safe areas (notch / home bar). Ensure WCAG-AA contrast and 44px minimum tap targets. No information by color alone.

Show the **Board Feet** screen as the default/active one, and present the other five screens so I can see them too (either as separate frames or a way to switch tabs).
