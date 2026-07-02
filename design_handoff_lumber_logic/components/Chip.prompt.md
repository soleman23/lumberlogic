**Chip** — pill for species, dimension members, and filters. Interactive (a `<button>` toggle) when given `onClick`; otherwise a static `<span>` tag.

```jsx
<Chip selected onClick={() => pick('White Oak')}>White Oak</Chip>
<Chip onClick={() => pick('Walnut')}>Walnut</Chip>
<Chip>Read-only tag</Chip>
```

Selected fills timber-700 with timber-100 text; unselected is white with an oak border.
