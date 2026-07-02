# Lumber Calculator — Formula Reference

All formulas below must be implemented exactly as specified. These are industry-standard lumber calculations.

---

## 1. Board Feet (BF)

**Standard Board Foot Formula:**
```
BF per piece = (Thickness_in × Width_in × Length_ft) / 12
Total BF = BF_per_piece × Quantity
```

**Example:**
- 2" × 4" × 8 ft → (2 × 4 × 8) / 12 = 5.333 BF per piece
- 10 pieces → 53.33 Total BF

**Notes:**
- Thickness and Width are in inches (nominal or actual — broker's preference; default to nominal)
- Length is in feet
- Result: always 2 decimal places

---

## 2. Pricing from MBF

**MBF = Thousand Board Feet**
```
Cost = (Total_BF / 1000) × Price_per_MBF
Cost_per_piece = Cost / Quantity
```

**Example:**
- 5,000 BF at $850/MBF → (5000 / 1000) × 850 = $4,250.00
- 100 pieces → $42.50 per piece

**Price per BF toggle:**
```
Cost = Total_BF × Price_per_BF
```

---

## 3. Piece Count from Target BF

```
BF_per_piece = (Thickness_in × Width_in × Length_ft) / 12
Pieces_needed = CEIL(Target_BF / BF_per_piece)
Actual_BF = Pieces_needed × BF_per_piece
Overage_BF = Actual_BF - Target_BF
```

**Notes:**
- Always round UP (ceiling) — never round down for piece count
- Show overage so the broker knows the actual delivered BF

---

## 4. Linear Feet ↔ Board Feet

**Linear Feet → Board Feet:**
```
BF = (Thickness_in × Width_in × Linear_ft) / 12
```

**Board Feet → Linear Feet:**
```
Linear_ft = (BF × 12) / (Thickness_in × Width_in)
```

**Example:**
- 100 LF of 2×6 → (2 × 6 × 100) / 12 = 100 BF
- 100 LF of 2×4 → (2 × 4 × 100) / 12 = 66.67 BF

---

## 5. Waste / Overage

```
Waste_amount = Base_quantity × (Waste_pct / 100)
Adjusted_quantity = Base_quantity + Waste_amount
```

**Example:**
- 1,000 BF with 15% waste → 1,000 × 0.15 = 150 BF waste → 1,150 BF total

**Common Waste Presets (quick-select buttons):**
- 10% — Framing / Structural
- 15% — Decking / Fencing
- 20% — Flooring / Finish work
- 25% — Custom/High waste

---

## 6. Load Estimator

```
Trucks_needed = CEIL(Total_BF / Truck_capacity_BF)
BF_on_last_truck = Total_BF - ((Trucks_needed - 1) × Truck_capacity_BF)
```

**Truck Presets (editable):**
| Preset Name       | Capacity (BF) |
|-------------------|---------------|
| 53' Flatbed       | 100,000 BF    |
| 48' Flatbed       | 80,000 BF     |
| Short Haul / Local| 40,000 BF     |
| Custom            | User-entered  |

---

## Unit Conversions (Reference)

| From         | To           | Formula                        |
|--------------|--------------|--------------------------------|
| Board Feet   | Cubic Feet   | BF / 12 = cubic feet           |
| Board Feet   | Cubic Meters | BF × 0.002360 = m³             |
| Cubic Meters | Board Feet   | m³ / 0.002360 = BF             |
| Inches       | Millimeters  | in × 25.4 = mm                 |
| Feet         | Meters       | ft × 0.3048 = m                |

---

## Rounding Rules
- Board Feet: 2 decimal places
- Cost/Price: 2 decimal places (currency)
- Piece counts: Always whole numbers (CEIL)
- Linear Feet: 2 decimal places
- Percentages displayed: 1 decimal place

