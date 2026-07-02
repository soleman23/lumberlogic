# Lumber Calculator — UI Specification

## Layout Overview

```
┌─────────────────────────┐
│  [App Header / Logo]    │  ← Fixed top bar, app name
├─────────────────────────┤
│                         │
│   [Calculator Screen]   │  ← Scrollable content area
│                         │
│                         │
├─────────────────────────┤
│ [BF][Price][Pcs][LF]    │  ← Fixed bottom tab bar
│    [Waste][Load]        │
└─────────────────────────┘
```

---

## Header
- Height: 56px
- Background: Primary green (#2D6A4F)
- Text: App name ("Lumber Calc") in white, 18px bold, centered
- Optional: Hamburger or settings icon on the right (for future use)

---

## Bottom Tab Bar
- Height: 64px (includes iOS safe area padding)
- 6 tabs with icon + short label
- Active tab: highlighted with white icon + label, green underline or filled pill
- Inactive tab: muted gray icon + label

| Tab | Icon (emoji or SVG) | Label     |
|-----|---------------------|-----------|
| 1   | 📐                  | Board Ft  |
| 2   | 💲                  | Pricing   |
| 3   | 🔢                  | Pieces    |
| 4   | 📏                  | Linear    |
| 5   | ♻️                  | Waste     |
| 6   | 🚚                  | Load      |

---

## Calculator Card Layout (each screen)

```
┌─────────────────────────┐
│  Calculator Title       │  ← 20px bold, dark text
│  Brief description      │  ← 13px gray subtext
├─────────────────────────┤
│  Label         [Input]  │  ← Input row
│  Label         [Input]  │
│  Label         [Input]  │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │   RESULT AREA     │  │  ← Result card, green bg
│  │  5,333 BF         │  │
│  │  53.33 per piece  │  │
│  └───────────────────┘  │
├─────────────────────────┤
│  [Clear]    [Copy📋]    │  ← Action buttons
└─────────────────────────┘
```

---

## Input Rows
- Label: left-aligned, 15px, dark gray (#333)
- Input field: right-aligned or full-width below label
- Input height: 48px minimum
- Input border: 1px solid #CCC, border-radius 8px
- Input focus: green border (#2D6A4F), subtle shadow
- Font size in inputs: 18px (prevents iOS zoom on focus — must be ≥ 16px)
- Units label inside or beside input (e.g., "in", "ft", "$/MBF")

---

## Result Card
- Background: Light green (#D8F3DC) or primary green for emphasis
- Border-radius: 12px
- Padding: 16px
- Primary result: 28px bold, dark green (#1B4332)
- Secondary result lines: 16px, medium gray
- Always visible (shows "—" when inputs are empty)

---

## Buttons
- Clear button: outlined style, gray border, gray text, 44px height
- Copy/Share button: filled, green background, white text, 44px height
- Waste preset buttons: small pill buttons (10%, 15%, 20%, 25%), tap to auto-fill

---

## Color Palette

| Name           | Hex       | Use                          |
|----------------|-----------|------------------------------|
| Primary Green  | #2D6A4F   | Header, active tabs, accents |
| Dark Green     | #1B4332   | Primary result text          |
| Light Green    | #D8F3DC   | Result card background       |
| Mid Green      | #52B788   | Buttons, highlights          |
| Off White      | #F8F9FA   | Page background              |
| Dark Gray      | #212529   | Body text                    |
| Mid Gray       | #6C757D   | Labels, placeholders         |
| Light Gray     | #CED4DA   | Input borders, dividers      |
| Warning Amber  | #FFC107   | Warnings, validation alerts  |
| White          | #FFFFFF   | Cards, input backgrounds     |

---

## Typography
- Font: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- Base size: 16px (prevents iOS auto-zoom in inputs)
- Headings: 600–700 weight
- Body: 400 weight
- All inputs: minimum 16px to prevent iOS zoom

---

## Spacing System
- Base unit: 8px
- Padding inside cards: 16px
- Margin between input rows: 12px
- Section spacing: 24px
- Border radius: 8px (inputs), 12px (cards), 16px (modals)

---

## Responsive Behavior
- Primary design: 390px wide (iPhone 14 / most Android phones)
- Content max-width: 480px, centered on larger screens
- Bottom tab bar: always fixed to bottom
- Header: always fixed to top
- Content area: scrollable between header and tab bar

---

## PWA / Install Behavior
- App name: "Lumber Calc"
- Theme color: #2D6A4F
- Background color: #F8F9FA
- Display mode: standalone (no browser chrome when installed)
- Icon: simple lumber/board SVG or initials "LC" on green background
- Orientation: portrait (primary), landscape supported

---

## Accessibility
- All inputs have associated `<label>` elements
- Color contrast meets WCAG AA (4.5:1 for text)
- Touch targets minimum 44×44px
- No information conveyed by color alone

