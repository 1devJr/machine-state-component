import {
  FieldProps,
  LoadingEntry,
  MessageEntry,
  MessageKind,
  ValidatorEntry,
  ValueState,
} from './store-shape';
import {
  BaseComponentProps,
  BaseComponentStore,
  createBaseComponentStore,
  mergeBaseComponentStore,
} from './base-component-store';

export interface FieldStore<
  TValue = string,
  TProps extends FieldProps = FieldProps,
> extends BaseComponentStore<unknown, BaseComponentProps> {
  fieldProperties: TProps;
  validators: ValidatorEntry<TValue, TProps>[];
  validationRules: string[];
  loadings: LoadingEntry[];
  messages: Record<MessageKind, MessageEntry[]>;
  hintsControl?: { charCount?: boolean; charCountMessage?: string };
  infoControl?: { help?: boolean; helpMessage?: string };
  valueState: ValueState<TValue>;
}

export type FieldStoreOverrides<TValue, TProps extends FieldProps> = Partial<
  FieldStore<TValue, TProps>
> & {
  fieldProperties?: Partial<TProps>;
};

export function mergeFieldStoreConfig<TValue, TProps extends FieldProps>(
  defaults: FieldStore<TValue, TProps>,
  initialMetadata?: FieldStoreOverrides<TValue, TProps>,
  overrides?: FieldStoreOverrides<TValue, TProps>,
): FieldStore<TValue, TProps> {
  const mergedProps: TProps = {
    ...defaults.fieldProperties,
    ...(initialMetadata?.fieldProperties ?? {}),
    ...(overrides?.fieldProperties ?? {}),
  } as TProps;

  const messages: Record<MessageKind, MessageEntry[]> = {
    error:
      overrides?.messages?.error ??
      initialMetadata?.messages?.error ??
      defaults.messages.error,
    info:
      overrides?.messages?.info ??
      initialMetadata?.messages?.info ??
      defaults.messages.info,
    hint:
      overrides?.messages?.hint ??
      initialMetadata?.messages?.hint ??
      defaults.messages.hint,
    success:
      overrides?.messages?.success ??
      initialMetadata?.messages?.success ??
      defaults.messages.success,
  };

  return {
    ...defaults,
    ...initialMetadata,
    ...overrides,
    fieldProperties: mergedProps,
    validators:
      overrides?.validators ??
      initialMetadata?.validators ??
      defaults.validators,
    validationRules:
      overrides?.validationRules ??
      initialMetadata?.validationRules ??
      defaults.validationRules,
    loadings:
      overrides?.loadings ?? initialMetadata?.loadings ?? defaults.loadings,
    messages,
    valueState: {
      current:
        overrides?.valueState?.current ??
        initialMetadata?.valueState?.current ??
        defaults.valueState.current,
      dirty:
        overrides?.valueState?.dirty ??
        initialMetadata?.valueState?.dirty ??
        defaults.valueState.dirty,
      touched:
        overrides?.valueState?.touched ??
        initialMetadata?.valueState?.touched ??
        defaults.valueState.touched,
      valid:
        overrides?.valueState?.valid ??
        initialMetadata?.valueState?.valid ??
        defaults.valueState.valid,
      errors:
        overrides?.valueState?.errors ??
        initialMetadata?.valueState?.errors ??
        defaults.valueState.errors,
    },
    hintsControl:
      overrides?.hintsControl ??
      initialMetadata?.hintsControl ??
      defaults.hintsControl,
    infoControl:
      overrides?.infoControl ??
      initialMetadata?.infoControl ??
      defaults.infoControl,
  };
}

export function createFieldStore<TValue, TProps extends FieldProps>(
  defaults: FieldStore<TValue, TProps>,
  initialMetadata?: FieldStoreOverrides<TValue, TProps>,
  overrides?: FieldStoreOverrides<TValue, TProps>,
): FieldStore<TValue, TProps> {
  const cfg = mergeFieldStoreConfig(defaults, initialMetadata, overrides);

  const base = createBaseComponentStore<unknown, BaseComponentProps>(
    {
      title: cfg.fieldProperties.label,
      visible: cfg.props?.visible ?? true,
      enabled: cfg.props?.enabled ?? !(cfg.fieldProperties.disabled ?? false),
      status: cfg.props?.status ?? 'idle',
      priority: cfg.props?.priority ?? 0,
      expanded: cfg.props?.expanded ?? false,
      layout: cfg.props?.layout,
      id: cfg.props?.id,
      description: cfg.props?.description,
      meta: cfg.props?.meta,
    },
    {
      data: cfg.data,
      request: cfg.request,
      loadings: cfg.loadings,
      messages: cfg.messages,
      errors: cfg.errors,
      valueState: cfg.valueState,
    },
  );

  const merged = mergeBaseComponentStore(base, undefined, cfg);

  return {
    ...merged,
    fieldProperties: cfg.fieldProperties,
    validators: cfg.validators,
    validationRules: cfg.validationRules,
    loadings: cfg.loadings,
    messages: cfg.messages,
    hintsControl: cfg.hintsControl,
    infoControl: cfg.infoControl,
    valueState: cfg.valueState,
  };
}
