import React from 'react';

/**
 * Tally dimension stepper — a labelled −/value/+ control with a unit suffix.
 * Controlled: pass `value` and handle `onChange(next)`.
 */
export function Stepper({
  label,
  value,
  unit,
  step = 1,
  min = -Infinity,
  max = Infinity,
  onChange,
  width,
  style: styleOverride,
}) {
  const clamp = (n) => Math.max(min, Math.min(max, +n.toFixed(2)));
  const set = (next) => onChange && onChange(clamp(next));

  const btn = {
    width: '46px',
    background: 'var(--oak-100, #F3ECE0)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    lineHeight: 1,
    color: 'var(--timber-700, #7E4E18)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width, ...styleOverride }}>
      {label != null && (
        <span style={{
          fontFamily: "var(--font-sans, 'IBM Plex Sans', sans-serif)",
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          color: 'var(--oak-500, #8C7E6B)',
        }}>{label}</span>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--oak-surface, #fff)',
        border: '1px solid var(--oak-300, #D6C8B2)',
        borderRadius: 'var(--radius-chip, 10px)',
        overflow: 'hidden',
      }}>
        <button type="button" aria-label="Decrease" onClick={() => set(value - step)}
          style={{ ...btn, borderRight: '1px solid var(--oak-200, #E6DCCC)' }}>−</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', padding: '12px 8px' }}>
          <span style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)", fontWeight: 600, fontSize: '22px', color: 'var(--oak-ink, #221A12)' }}>{value}</span>
          {unit != null && (
            <span style={{ fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)", fontSize: '13px', color: 'var(--oak-500, #8C7E6B)' }}>{unit}</span>
          )}
        </div>
        <button type="button" aria-label="Increase" onClick={() => set(value + step)}
          style={{ ...btn, borderLeft: '1px solid var(--oak-200, #E6DCCC)' }}>+</button>
      </div>
    </div>
  );
}
