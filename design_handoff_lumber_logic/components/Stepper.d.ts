import * as React from 'react';

/**
 * Tally dimension stepper: a labelled −/value/+ control with a unit suffix,
 * for thickness, width, length and piece counts. Controlled component.
 *
 * @startingPoint section="Lumber Calculator" subtitle="Labelled −/value/+ dimension stepper" viewport="700x140"
 */
export interface StepperProps {
  /** Field label, shown uppercase above the control. */
  label?: React.ReactNode;
  /** Current numeric value (controlled). */
  value: number;
  /** Unit suffix shown after the value, e.g. "in", "ft", "pc". */
  unit?: string;
  /** Increment/decrement amount. @default 1 */
  step?: number;
  /** Lower clamp. @default -Infinity */
  min?: number;
  /** Upper clamp. @default Infinity */
  max?: number;
  /** Called with the clamped next value when ± is pressed. */
  onChange?: (next: number) => void;
  /** Optional fixed width for the control column. */
  width?: number | string;
  style?: React.CSSProperties;
}

export declare function Stepper(props: StepperProps): JSX.Element;
