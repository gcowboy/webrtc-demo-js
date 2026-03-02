import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const FormRow = React.forwardRef<HTMLDivElement, FormRowProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('form-row', className)} {...props}>
      {children}
    </div>
  ),
);
FormRow.displayName = 'FormRow';

export { FormRow };
