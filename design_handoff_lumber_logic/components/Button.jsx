import React from 'react';

/**
 * Tally primary control. Timber-filled by default; press darkens to timber-600.
 * Hover/focus handled internally. Renders an <button>.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon = null,
  children,
  onClick,
  type = 'button',
  style: styleOverride,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const sm = size === 'sm';
  const isIcon = variant === 'icon';

  const base = {
    fontFamily: "var(--font-sans, 'IBM Plex Sans', sans-serif)",
    fontWeight: 600,
    fontSize: sm ? '13px' : '14px',
    lineHeight: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-chip, 10px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background .15s ease, border-color .15s ease, color .15s ease',
    padding: isIcon ? 0 : (sm ? '9px 14px' : '11px 18px'),
    ...(isIcon ? { width: sm ? '36px' : '40px', height: sm ? '36px' : '40px' } : {}),
  };

  const variants = {
    primary: {
      color: '#fff',
      background: hover ? 'var(--timber-600, #A0641F)' : 'var(--timber-500, #BC7A2C)',
      border: 'none',
      boxShadow: 'var(--elev-flat, 0 1px 2px rgba(60,40,15,.14))',
    },
    secondary: {
      color: 'var(--timber-700, #7E4E18)',
      background: 'var(--oak-surface, #fff)',
      border: `1px solid ${hover ? 'var(--timber-500, #BC7A2C)' : 'var(--oak-300, #D6C8B2)'}`,
    },
    ghost: {
      color: hover ? 'var(--oak-ink, #221A12)' : 'var(--oak-500, #8C7E6B)',
      background: 'transparent',
      border: 'none',
    },
    icon: {
      color: 'var(--timber-700, #7E4E18)',
      background: 'var(--oak-surface, #fff)',
      border: `1px solid ${hover ? 'var(--timber-500, #BC7A2C)' : 'var(--oak-300, #D6C8B2)'}`,
    },
  };

  const disabledStyle = disabled
    ? { color: '#B7AB98', background: 'var(--oak-100, #F3ECE0)', border: 'none', boxShadow: 'none', opacity: 1 }
    : null;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variants[variant], ...disabledStyle, ...styleOverride }}
      {...rest}
    >
      {icon}
      {!isIcon && children}
      {isIcon && (children || null)}
    </button>
  );
}
