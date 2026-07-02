# Lumber Calculator — Requirements

## Overview
A mobile-first PWA for a Lumber Broker to perform fast, accurate lumber calculations from his phone in the field. The app must work offline, calculate instantly, and cover the core calculations a broker uses daily.

---

## MVP Modules (Version 1)

### 1. Board Feet Calculator
**Purpose:** Convert lumber dimensions into board feet (BF).
- Inputs: Thickness (inches), Width (inches), Length (feet), Quantity (pieces)
- Output: Total Board Feet, BF per piece
- Notes: Standard industry formula; thickness and width in inches, length in feet

### 2. Pricing Calculator
**Purpose:** Calculate cost of a lumber order.
- Inputs: Total Board Feet, Price per MBF ($ per thousand board feet)
- Output: Total Cost ($), Cost per piece
- Notes: Also support Price per BF as an input toggle
- Bonus: Allow user to input quantity and dimension to auto-calculate BF first, then price

### 3. Piece Count Calculator
**Purpose:** Determine how many pieces are needed to hit a target board footage.
- Inputs: Target total BF needed, Thickness (in), Width (in), Length (ft)
- Output: Number of pieces needed, Actual total BF (rounded up), Overage BF
- Notes: Always round pieces UP to next whole number

### 4. Linear Feet Converter
**Purpose:** Convert between linear feet and board feet for a given dimension.
- Inputs: Linear Feet, Thickness (in), Width (in)
- Output: Board Feet equivalent
- Reverse: Input BF → Output Linear Feet

### 5. Waste / Overage Calculator
**Purpose:** Add a waste or overage buffer to a quantity.
- Inputs: Base quantity (BF or pieces), Waste % (e.g., 10%)
- Output: Adjusted quantity with waste, Amount added for waste
- Notes: Common waste factors: 10% (framing), 15% (decking), 20% (flooring)

### 6. Load Estimator
**Purpose:** Estimate truck/flatbed load capacity in board feet or pieces.
- Inputs: Truck capacity (BF or select common truck type), Piece dimensions, Quantity
- Output: Number of trucks needed, BF per truck, Leftover pieces/BF
- Common truck presets: Flatbed 53' (~100,000 BF), Flatbed 48' (~80,000 BF), Short haul (~40,000 BF)

---

## Nice-to-Have (Version 2, not required for MVP)
- Calculation history (last 10–20 calculations saved to localStorage)
- Export/share result as text or copy to clipboard
- Unit toggle: Imperial ↔ Metric (board feet ↔ cubic meters)
- Species/Grade quick reference list
- Job tagging (assign calculations to a job name)
- Dark mode toggle

---

## Navigation
- Bottom tab bar (mobile standard): 6 icons for the 6 modules
- Each tab = one calculator screen
- Active tab highlighted

---

## Input Behavior
- All numeric inputs: number keyboard on mobile (type="number" or inputmode="decimal")
- Results recalculate live as user types (no submit button)
- "Clear" button per calculator to reset all fields
- Inputs show placeholder example values (e.g., "e.g. 2" for thickness)

---

## Error Handling
- Show inline warning if inputs are zero or blank (don't calculate with empty fields)
- Show warning if result is unusually large (e.g., > 1,000,000 BF) — "Double-check your inputs"
- Never show NaN, Infinity, or raw JS errors to the user

---

## Branding / Styling
- ⚠️ Placeholder: No specific branding defined yet. Use a clean, professional default.
- App title: "Lumber Calc" (update when broker provides business name)
- Color scheme: Forest green primary (#2D6A4F or similar), white background, dark gray text
- Font: System font stack (San Francisco on iOS, Roboto on Android) for performance

