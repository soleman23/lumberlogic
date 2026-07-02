import React from 'react';

/**
 * Tally pill chip — for species, dimension members, and filters.
 * Selected = timber-700 fill; unselected = white with oak border.
 */
export function Chip({
  selected = false,
  onClick,
  children,
  disabled = false,
  style: styleOverride,
  ...rest
}) {
  const interactive = typeof onClick === 'function' && !disabled;
  const base = {
    fontFamily: "var(--font-sans, 'IBM Plex Sans', sans-serif)",
    fontSize: '13px',
    fontWeight: selected ? 600 : 500,
    borderRadius: 'var(--radius-pill, 999px)',
    padding: '8px 14px',
    cursor: disabled ? 'not-allowed' : (interactive ? 'pointer' : 'default'),
    lineHeight: 1,
    transition: 'background .15s ease, border-color .15s ease, color .15s ease',
    opacity: disabled ? 0.5 : 1,
  };
  const tone = selected
    ? { color: 'var(--timber-100, #F4E4CC)', background: 'var(--timber-700, #7E4E18)', border: '1px solid var(--timber-700, #7E4E18)' }
    : { color: 'var(--timber-700, #7E4E18)', background: 'var(--oak-surface, #fff)', border: '1px solid var(--oak-300, #D6C8B2)' };

  const Tag = interactive ? 'button' : 'span';
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      aria-pressed={interactive ? selected : undefined}
      style={{ ...base, ...tone, ...styleOverride }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
