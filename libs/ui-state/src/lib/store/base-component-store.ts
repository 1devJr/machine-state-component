import { LoadingEntry, MessageEntry, MessageKind } from './store-shape';

export type ComponentStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'
  | 'disabled'
  | 'hidden';

export interface BaseComponentProps {
  id?: string;
  title?: string;
  description?: string;
  visible?: boolean;
  enabled?: boolean;
  priority?: number;
  status?: ComponentStatus;
  layout?: 'default' | 'compact' | 'spacious' | string;
  expanded?: boolean;
  readonly?: boolean;
  meta?: Record<string, unknown>;
}

export interface RequestState {
  inFlight: boolean;
  lastError?: string;
  lastSuccessAt?: number;
}

export interface BaseComponentStore<
  TData = unknown,
  TProps extends BaseComponentProps = BaseComponentProps,
> {
  props: TProps;
  data?: TData;
  request?: RequestState;
  loadings: LoadingEntry[];
  messages: Record<MessageKind, MessageEntry[]>;
  errors: string[];
  valueState?: {
    current: unknown;
    dirty: boolean;
    touched: boolean;
    valid: boolean;
    errors: string[];
  };
}

export function createBaseComponentStore<
  TData,
  TProps extends BaseComponentProps,
>(
  props: TProps,
  options?: {
    data?: TData;
    request?: RequestState;
    loadings?: LoadingEntry[];
    messages?: Partial<Record<MessageKind, MessageEntry[]>>;
    errors?: string[];
    valueState?: BaseComponentStore['valueState'];
  },
): BaseComponentStore<TData, TProps> {
  return {
    props: {
      visible: true,
      enabled: true,
      status: 'idle',
      priority: 0,
      expanded: false,
      ...props,
    },
    data: options?.data,
    request: options?.request ?? { inFlight: false },
    loadings: options?.loadings ?? [],
    messages: {
      error: options?.messages?.error ?? [],
      info: options?.messages?.info ?? [],
      hint: options?.messages?.hint ?? [],
      success: options?.messages?.success ?? [],
    },
    errors: options?.errors ?? [],
    valueState: options?.valueState,
  };
}

export function mergeBaseComponentStore<
  TData,
  TProps extends BaseComponentProps,
>(
  base: BaseComponentStore<TData, TProps>,
  initialMetadata?: Partial<BaseComponentStore<TData, TProps>>,
  overrides?: Partial<BaseComponentStore<TData, TProps>>,
): BaseComponentStore<TData, TProps> {
  const mergedProps: TProps = {
    ...base.props,
    ...(initialMetadata?.props as Partial<TProps> | undefined),
    ...(overrides?.props as Partial<TProps> | undefined),
  } as TProps;

  return {
    ...base,
    ...initialMetadata,
    ...overrides,
    props: mergedProps,
    data: overrides?.data ?? initialMetadata?.data ?? base.data,
    request: overrides?.request ?? initialMetadata?.request ?? base.request,
    loadings: overrides?.loadings ?? initialMetadata?.loadings ?? base.loadings,
    messages: overrides?.messages ?? initialMetadata?.messages ?? base.messages,
    errors: overrides?.errors ?? initialMetadata?.errors ?? base.errors,
    valueState:
      overrides?.valueState ?? initialMetadata?.valueState ?? base.valueState,
  };
}
