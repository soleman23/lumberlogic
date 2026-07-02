import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import './Button.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'icon'
type Size = 'md' | 'sm'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  children,
  className = '',
  ...rest
}: Props) {
  const [hover, setHover] = useState(false)

  return (
    <button
      type="button"
      disabled={disabled}
      className={`btn btn--${variant} btn--${size} ${hover && !disabled ? 'btn--hover' : ''} ${className}`.trim()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {icon}
      {variant !== 'icon' && children}
      {variant === 'icon' && children}
    </button>
  )
}
