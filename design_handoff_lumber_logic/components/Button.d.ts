import * as React from 'react';

/**
 * Tally action button. Primary for the main action on a screen; secondary for
 * adjacent confirmations; ghost for low-emphasis (Reset); icon for square,
 * label-less actions.
 *
 * @startingPoint section="Lumber Calculator" subtitle="Branded button — primary / secondary / ghost / icon" viewport="700x140"
 */
export interface ButtonProps {
  /** Visual emphasis. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  /** Control height. @default "md" */
  size?: 'sm' | 'md';
  /** Dim and block interaction. @default false */
  disabled?: boolean;
  /** Leading icon node (e.g. an inline <svg>). For variant="icon", the sole child. */
  icon?: React.ReactNode;
  /** Button label. */
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** @default "button" */
  type?: 'button' | 'submit' | 'reset';
  /** Extra inline style merged last. */
  style?: React.CSSProperties;
}

export declare function Button(props: ButtonProps): JSX.Element;
