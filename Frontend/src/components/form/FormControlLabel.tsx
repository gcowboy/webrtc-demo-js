import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormControlLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

const FormControlLabel = React.forwardRef<HTMLLabelElement, FormControlLabelProps>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={cn('form-label', className)} {...props}>
      {children}
    </label>
  ),
);
FormControlLabel.displayName = 'FormControlLabel';

export { FormControlLabel };
