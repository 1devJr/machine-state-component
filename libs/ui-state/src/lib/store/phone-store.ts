import {
  FieldProps,
  LoadingEntry,
  MessageEntry,
  ValidatorEntry,
} from './store-shape';
import {
  FieldStore,
  FieldStoreOverrides,
  createFieldStore,
} from './field-store';

// Phone-specific props extend FieldProps to allow narrowing if needed
export interface PhoneFieldProps extends FieldProps {
  type: 'phone';
  minLength?: number;
  maxLength?: number;
}

const isMaxLength = (value: string, max?: number) =>
  max === undefined ? true : value.length <= max;

const isMinLength = (value: string, min?: number) =>
  min === undefined ? true : value.length >= min;

const isPhone = (value: string) => /^\+?[1-9]\d{1,14}$/.test(value);

const defaultProps: PhoneFieldProps = {
  label: 'Phone Number',
  name: 'phoneNumber',
  type: 'phone',
  placeholder: 'Enter your phone number',
  disabled: false,
  readOnly: false,
  required: true,
  minLength: 10,
  maxLength: 15,
  description: 'Please enter your phone number in E.164 format.',
  initialValue: '',
};

const validators: ValidatorEntry<string, PhoneFieldProps>[] = [
  {
    type: 'REQUIRED',
    fn: (value, ctx) => (ctx.props.required ? value.trim().length > 0 : true),
    message: 'This field is required.',
  },
  {
    type: 'MIN_LENGTH',
    fn: (value, ctx) => isMinLength(value, ctx.props.minLength),
    message: 'The input is too short.',
  },
  {
    type: 'MAX_LENGTH',
    fn: (value, ctx) => isMaxLength(value, ctx.props.maxLength),
    message: 'The input is too long.',
  },
  {
    type: 'PHONE',
    fn: (value) => isPhone(value),
    message: 'The input is not a phone number.',
  },
];

const validationRules = ['REQUIRED', 'MIN_LENGTH:10', 'MAX_LENGTH:15', 'PHONE'];

const loadings: LoadingEntry[] = [
  {
    scope: 'component',
    isLoading: false,
    message: 'Loading...',
    skeleton: true,
  },
  {
    scope: 'field',
    context: 'hint',
    isLoading: false,
    message: 'Validating...',
    skeleton: false,
  },
  {
    scope: 'field',
    context: 'placeholder',
    isLoading: false,
    message: 'Checking...',
    skeleton: false,
  },
];

const messages: Record<'error' | 'info' | 'hint' | 'success', MessageEntry[]> =
  {
    error: [
      { type: 'REQUIRED', message: 'This field is required.' },
      { type: 'INVALID', message: 'The input is invalid.' },
      { type: 'TOO_SHORT', message: 'The input is too short.' },
      { type: 'TOO_LONG', message: 'The input is too long.' },
      { type: 'INVALID_PHONE', message: 'The input is not a phone number.' },
    ],
    info: [{ type: 'HELP', message: 'Please enter your input.' }],
    hint: [{ type: 'CHAR_COUNT', message: 'You have X characters remaining.' }],
    success: [],
  };

export type PhoneStore = FieldStore<string, PhoneFieldProps>;
export type PhoneStoreOverrides = FieldStoreOverrides<string, PhoneFieldProps>;

export function mergePhoneStoreConfig(
  initialMetadata?: PhoneStoreOverrides,
  overrides?: PhoneStoreOverrides,
): PhoneStoreOverrides {
  return {
    ...initialMetadata,
    ...overrides,
    fieldProperties: {
      ...defaultProps,
      ...(initialMetadata?.fieldProperties ?? {}),
      ...(overrides?.fieldProperties ?? {}),
    },
    validators:
      overrides?.validators ?? initialMetadata?.validators ?? validators,
    validationRules:
      overrides?.validationRules ??
      initialMetadata?.validationRules ??
      validationRules,
    loadings: overrides?.loadings ?? initialMetadata?.loadings ?? loadings,
    messages: overrides?.messages ?? initialMetadata?.messages ?? messages,
    valueState: overrides?.valueState ?? initialMetadata?.valueState,
    hintsControl: overrides?.hintsControl ?? initialMetadata?.hintsControl,
    infoControl: overrides?.infoControl ?? initialMetadata?.infoControl,
  };
}

export function createPhoneStore(overrides?: PhoneStoreOverrides): PhoneStore {
  const cfg = mergePhoneStoreConfig(undefined, overrides);
  const mergedProps = cfg.fieldProperties ?? defaultProps;

  const defaults: PhoneStore = {
    props: {
      title: mergedProps.label,
      visible: cfg.props?.visible ?? true,
      enabled: cfg.props?.enabled ?? !(mergedProps.disabled ?? false),
      status: cfg.props?.status ?? 'idle',
      priority: cfg.props?.priority ?? 0,
      expanded: cfg.props?.expanded ?? false,
      layout: cfg.props?.layout,
      id: cfg.props?.id,
      description: cfg.props?.description,
      meta: cfg.props?.meta,
    },
    data: cfg.data,
    request: cfg.request,
    loadings: cfg.loadings ?? loadings,
    messages: cfg.messages ?? messages,
    errors: cfg.errors ?? [],
    fieldProperties: mergedProps,
    validators: cfg.validators ?? validators,
    validationRules: cfg.validationRules ?? validationRules,
    hintsControl: cfg.hintsControl,
    infoControl: cfg.infoControl,
    valueState: {
      current: cfg.valueState?.current ?? mergedProps.initialValue ?? '',
      dirty: cfg.valueState?.dirty ?? false,
      touched: cfg.valueState?.touched ?? false,
      valid: cfg.valueState?.valid ?? true,
      errors: cfg.valueState?.errors ?? [],
    },
  };

  return createFieldStore<string, PhoneFieldProps>(defaults, undefined, cfg);
}
