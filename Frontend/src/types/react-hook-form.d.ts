/**
 * react-hook-form published package types reference missing ../src in dist,
 * so TypeScript fails to resolve useForm. This declaration provides the missing exports.
 */
declare module 'react-hook-form' {
  export type ControllerRenderProps = { field: { value: any; onChange: (x: any) => void; onBlur: () => void; name: string; ref: (r: any) => void } };

  export function useForm<T = Record<string, unknown>>(options?: { defaultValues?: T; values?: T }): any;
  export function useFormContext<T = unknown>(): any;
  export const FormProvider: React.ComponentType<{ children: React.ReactNode; [key: string]: any }>;
  export function Controller<TFieldValues = Record<string, unknown>>(
    props: {
      name: string;
      control?: any;
      render: (args: ControllerRenderProps) => React.ReactElement;
      rules?: Record<string, unknown>;
    },
  ): React.ReactElement;

  export type FieldValues = Record<string, unknown>;
  export type FieldPath<TFieldValues extends FieldValues> = string;
  export type ControllerProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
    name: TName;
    control?: any;
    render: (args: ControllerRenderProps) => React.ReactElement;
    rules?: Record<string, unknown>;
  };
  export type UseFormReturn<TFieldValues extends FieldValues = FieldValues> = any;
}
