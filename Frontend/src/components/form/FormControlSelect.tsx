import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FormControlSelectOption {
  value: string;
  label: string;
}

export interface FormControlSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: FormControlSelectOption[];
  placeholder?: string;
  /** Optional wrapper class (e.g. for width) */
  wrapperClassName?: string;
}

const FormControlSelect = React.forwardRef<
  HTMLSelectElement,
  FormControlSelectProps
>(
  (
    {
      options,
      placeholder,
      wrapperClassName,
      className,
      id,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => (
    <div className={cn('form-select-wrap', wrapperClassName)}>
      <select
        ref={ref}
        id={id}
        aria-label={ariaLabel}
        className={cn('form-select', className)}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
);
FormControlSelect.displayName = 'FormControlSelect';

export { FormControlSelect };
