**Stepper** — labelled `−/value/+` control with a unit suffix for dimensions and counts. Controlled: pass `value`, update on `onChange`.

```jsx
const [w, setW] = React.useState(6);
<Stepper label="Width" value={w} unit="in" step={0.5} min={1} onChange={setW} />
```

The big figure uses Space Grotesk; the unit uses Plex Mono. `step`, `min`, `max` clamp the output. Common units: `in`, `ft`, `pc`.
