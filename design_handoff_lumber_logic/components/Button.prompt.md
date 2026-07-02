**Button** — the Tally action control; use `primary` for the one main action per screen, `secondary` for adjacent confirmations, `ghost` for low-emphasis, `icon` for square label-less actions.

```jsx
<Button variant="primary" onClick={calc}>Calculate</Button>
<Button variant="secondary">Save quote</Button>
<Button variant="ghost">Reset</Button>
<Button variant="icon" aria-label="Add" icon={<PlusSvg/>} />
<Button disabled>Disabled</Button>
```

Variants: `primary` (timber fill, darkens on hover) · `secondary` (white, border → timber on hover) · `ghost` (text only) · `icon` (40px / 36px square). Sizes: `md` (default), `sm`. Pass `disabled` to mute and block clicks.
