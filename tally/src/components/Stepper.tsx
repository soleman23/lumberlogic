import './Stepper.css'

type Props = {
  label?: string
  value: number
  unit?: string
  step?: number
  min?: number
  max?: number
  onChange: (next: number) => void
  width?: string | number
}

export function Stepper({
  label,
  value,
  unit,
  step = 1,
  min = 0,
  max = Infinity,
  onChange,
  width,
}: Props) {
  const clamp = (n: number) => Math.max(min, Math.min(max, +n.toFixed(2)))
  const set = (next: number) => onChange(clamp(next))

  return (
    <div className="stepper" style={width ? { width } : undefined}>
      {label != null && <span className="stepper__label">{label}</span>}
      <div className="stepper__control">
        <button type="button" className="stepper__btn" aria-label="Decrease" onClick={() => set(value - step)}>
          −
        </button>
        <div className="stepper__value">
          <span className="stepper__num">{value}</span>
          {unit != null && <span className="stepper__unit">{unit}</span>}
        </div>
        <button type="button" className="stepper__btn" aria-label="Increase" onClick={() => set(value + step)}>
          +
        </button>
      </div>
    </div>
  )
}
