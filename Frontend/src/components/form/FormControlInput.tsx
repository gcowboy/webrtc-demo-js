import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormControlInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const FormControlInput = React.forwardRef<
  HTMLInputElement,
  FormControlInputProps
>(({ className, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn('form-input', className)}
    {...props}
  />
));
FormControlInput.displayName = 'FormControlInput';

export { FormControlInput };
