import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormStackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/** Vertical stack for form sections (flex column, gap). Use with FormRow, FormControlField, FormControlButton. */
const FormStack = React.forwardRef<HTMLDivElement, FormStackProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('form-stack', className)} {...props}>
      {children}
    </div>
  ),
);
FormStack.displayName = 'FormStack';

export { FormStack };
