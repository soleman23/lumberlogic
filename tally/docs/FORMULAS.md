# Lumber Logic — Business Rules & Formulas

## Board feet (dimensional)

```text
BF = totalPieces × thickness × width × length ÷ 12
totalPieces = units × piecesPerUnit
```

## Lineal feet (dimensional)

Total lumber lineal feet (not package-length):

```text
LF = totalPieces × length
```

## Random-width hardwood

Direct board feet entry when sold by BF measurement.

## Pricing

- **Market/reference price** — informational only
- **Acquisition cost** — Cade's actual cost; required for markup/margin
- **Selling price** — customer price

```text
Markup $ = selling price − acquisition cost
Markup % = markup $ ÷ acquisition cost
Gross profit = selling price − acquisition cost
Gross margin % = gross profit ÷ selling price
```

When acquisition cost is missing: display "Cost required" / "Not available". Never substitute market price unless explicitly chosen.

## Reconciliation tolerance

- Currency: $0.01
- Board feet: 0.01 BF

## Quote numbering

Format: `CB-YYYY-####` (collision-resistant sequence in storage).
