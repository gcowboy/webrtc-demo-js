import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormControlButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Primary submit style (default). Set false for secondary/custom styling. */
  variant?: 'primary' | 'secondary';
}

const FormControlButton = React.forwardRef<
  HTMLButtonElement,
  FormControlButtonProps
>(
  (
    { className, variant = 'primary', type = 'button', children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        variant === 'primary' && 'form-submit',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
FormControlButton.displayName = 'FormControlButton';

export { FormControlButton };
