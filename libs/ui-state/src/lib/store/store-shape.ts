// Base store shape for field-like components (extensible by specific components)

export type LoadingScope = 'component' | 'field';
export type LoadingContext =
  | 'placeholder'
  | 'hint'
  | 'button'
  | 'addon'
  | 'label'
  | 'custom';
export type MessageKind = 'error' | 'info' | 'hint' | 'success';

export interface FieldProps {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  description?: string;
  initialValue?: string;
}

export interface LoadingEntry {
  scope: LoadingScope;
  context?: LoadingContext;
  isLoading: boolean;
  message?: string;
  skeleton?: boolean;
}

export interface MessageEntry {
  type: string;
  message: string;
}

export type ValidatorFn<TValue, TProps extends FieldProps> = (
  value: TValue,
  ctx: { props: TProps },
) => boolean | Promise<boolean>;

export interface ValidatorEntry<TValue, TProps extends FieldProps> {
  type: string;
  fn: ValidatorFn<TValue, TProps>;
  message: string;
  blocking?: boolean;
}

export interface ValueState<TValue> {
  current: TValue;
  dirty: boolean;
  touched: boolean;
  valid: boolean;
  errors: string[];
}

export interface StoreShape<
  TValue = string,
  TProps extends FieldProps = FieldProps,
> {
  fieldProperties: TProps;
  validators: ValidatorEntry<TValue, TProps>[];
  validationRules: string[];
  loadings: LoadingEntry[];
  messages: Record<MessageKind, MessageEntry[]>;
  hintsControl?: { charCount?: boolean; charCountMessage?: string };
  infoControl?: { help?: boolean; helpMessage?: string };
  valueState: ValueState<TValue>;
}

export function createBaseStore<TValue, TProps extends FieldProps>(
  props: TProps,
  options?: {
    validators?: ValidatorEntry<TValue, TProps>[];
    validationRules?: string[];
    loadings?: LoadingEntry[];
    messages?: Partial<Record<MessageKind, MessageEntry[]>>;
    value?: TValue;
  },
): StoreShape<TValue, TProps> {
  return {
    fieldProperties: props,
    validators: options?.validators ?? [],
    validationRules: options?.validationRules ?? [],
    loadings: options?.loadings ?? [],
    messages: {
      error: options?.messages?.error ?? [],
      info: options?.messages?.info ?? [],
      hint: options?.messages?.hint ?? [],
      success: options?.messages?.success ?? [],
    },
    hintsControl: undefined,
    infoControl: undefined,
    valueState: {
      current: options?.value ?? (props.initialValue as TValue),
      dirty: false,
      touched: false,
      valid: true,
      errors: [],
    },
  };
}
