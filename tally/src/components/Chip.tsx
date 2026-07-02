import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Chip.css'

type Props = {
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>

export function Chip({ selected = false, onClick, disabled = false, children, className = '', ...rest }: Props) {
  const interactive = typeof onClick === 'function' && !disabled
  const Tag = interactive ? 'button' : 'span'

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      aria-pressed={interactive ? selected : undefined}
      disabled={disabled}
      className={`chip ${selected ? 'chip--selected' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  )
}
