import * as React from 'react';

/**
 * Tally pill chip for species, dimension members, and filters. Renders a
 * <button> when `onClick` is supplied (toggle), otherwise a static <span>.
 *
 * @startingPoint section="Lumber Calculator" subtitle="Selectable species / dimension pill chip" viewport="700x120"
 */
export interface ChipProps {
  /** Selected (filled) state. @default false */
  selected?: boolean;
  /** Toggle handler. When present the chip is an interactive button. */
  onClick?: (e: React.MouseEvent) => void;
  /** Dim and block interaction. @default false */
  disabled?: boolean;
  /** Chip label. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function Chip(props: ChipProps): JSX.Element;
