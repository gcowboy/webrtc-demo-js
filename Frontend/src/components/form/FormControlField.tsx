import * as React from 'react';
import { cn } from '@/lib/utils';
import { FormControlLabel } from './FormControlLabel';

export interface FormControlFieldProps {
  label: React.ReactNode;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}

const FormControlField = React.forwardRef<HTMLDivElement, FormControlFieldProps>(
  ({ label, htmlFor, children, className }, ref) => (
    <div ref={ref} className={cn('field-group', className)}>
      <FormControlLabel htmlFor={htmlFor}>{label}</FormControlLabel>
      {children}
    </div>
  ),
);
FormControlField.displayName = 'FormControlField';

export { FormControlField };
