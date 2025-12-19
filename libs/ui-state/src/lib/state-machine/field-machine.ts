import { FormControl } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FieldProps } from '../store/store-shape';
import { FieldStore } from '../store/field-store';
import { MachineBuilder } from './machine-builder';
import { MachineState } from './machine-state';
import { Action, MachineInstance, createMachine } from './state-engine';

export type FieldMachineEvent<TValue> =
  | { type: 'CHANGE'; value: TValue }
  | { type: 'BLUR' }
  | { type: 'VALIDATION_RESULT'; value: TValue; errors: string[] }
  | { type: 'SET_DISABLED'; disabled: boolean };

export interface FieldMachineOptions {
  /** debounce para disparar validação; aplicado na transição dirty -> validating */
  validateDelay?: number;
  /** mensagem exibida durante estado de validação */
  validationLoadingMessage?: string;
  /** FormControl fornecido pelo componente (obrigatório para simplificar a máquina) */
  control: FormControl;
}
const collectErrors = (control: FormControl): string[] =>
  Object.values(control.errors ?? {})
    .map((msg) => (Array.isArray(msg) ? msg.map(String) : String(msg)))
    .flat()
    .filter(Boolean);

const awaitValidation = async (control: FormControl): Promise<void> => {
  if (!control.pending) return;
  await firstValueFrom(
    control.statusChanges.pipe(filter((status) => status !== 'PENDING')),
  );
};

/**
 * Atualiza o valor do campo e marca dirty/touched conforme o flag.
 */
function setValueAction<TValue, TProps extends FieldProps>(
  markTouched: boolean,
  control: FormControl<TValue>,
): Action<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  return ({ context, setContext, event }) => {
    if (event.type !== 'CHANGE') return;
    const prev = context();
    if (control && control.value !== event.value) {
      control.setValue(event.value, { emitEvent: false });
    }
    setContext({
      ...prev,
      valueState: {
        ...prev.valueState,
        current: event.value,
        dirty: true,
        touched: markTouched || prev.valueState.touched,
      },
    });
  };
}

/**
 * Marca o campo como touched se ainda não estiver.
 */
function markTouchedAction<TValue, TProps extends FieldProps>(): Action<
  FieldStore<TValue, TProps>,
  FieldMachineEvent<TValue>
> {
  return ({ context, setContext }) => {
    const prev = context();
    if (prev.valueState.touched) return;
    setContext({
      ...prev,
      valueState: { ...prev.valueState, touched: true },
    });
  };
}

/**
 * Aplica resultado de validação no estado (status, valueState, errors).
 */
function applyValidationResultAction<
  TValue,
  TProps extends FieldProps,
>(): Action<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  return ({ context, setContext, event }) => {
    if (event.type !== 'VALIDATION_RESULT') return;
    const prev = context();
    const isValid = event.errors.length === 0;
    setContext({
      ...prev,
      props: { ...prev.props, status: isValid ? 'ready' : 'error' },
      valueState: {
        ...prev.valueState,
        current: event.value,
        dirty: true,
        valid: isValid,
        errors: event.errors,
      },
    });
  };
}

/**
 * Controla loading/hint exibido durante validação.
 */
function setValidatingLoadingAction<TValue, TProps extends FieldProps>(
  isLoading: boolean,
  message: string,
): Action<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  return ({ context, setContext }) => {
    const prev = context();
    const targetIndex = prev.loadings.findIndex(
      (l) => l.scope === 'field' && l.context === 'hint',
    );
    const nextLoadings = [...prev.loadings];

    if (targetIndex >= 0) {
      nextLoadings[targetIndex] = {
        ...nextLoadings[targetIndex],
        isLoading,
        message,
      };
    } else {
      nextLoadings.push({
        scope: 'field',
        context: 'hint',
        isLoading,
        message,
      });
    }

    setContext({
      ...prev,
      props: {
        ...prev.props,
        status: isLoading ? 'loading' : prev.props.status,
      },
      loadings: nextLoadings,
    });
  };
}

/**
 * Habilita/desabilita o campo refletindo em props e fieldProperties.
 */
function setDisabledAction<TValue, TProps extends FieldProps>(
  control: FormControl<TValue>,
): Action<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  return ({ context, setContext, event }) => {
    if (event.type !== 'SET_DISABLED') return;
    const prev = context();
    if (control) {
      if (event.disabled) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    }
    setContext({
      ...prev,
      props: { ...prev.props, enabled: !event.disabled },
      fieldProperties: { ...prev.fieldProperties, disabled: event.disabled },
    });
  };
}

/**
 * Cria a máquina de estado padrão para campos, cobrindo mudança, blur e validação assíncrona.
 * Usa MachineState + MachineBuilder para montar o config antes de passar ao runtime.
 *
 * @example
 * ```ts
 * import { createFieldMachine } from './state-machine/field-machine';
 * import { createPhoneStore } from './store/phone-store';
 *
 * const store = createPhoneStore();
 * const machine = createFieldMachine(store, {
 *   validateDelay: 300,
 *   validationLoadingMessage: 'Validando telefone...'
 * });
 *
 * machine.send({ type: 'CHANGE', value: '+55 11 99999-0000' });
 * machine.send({ type: 'BLUR' });
 * ```
 */
export function createFieldMachine<TValue, TProps extends FieldProps>(
  store: FieldStore<TValue, TProps>,
  options?: FieldMachineOptions,
): MachineInstance<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  /**
   * Helper para criar um MachineState com os generics já preenchidos.
   */
  const validateDelay = options?.validateDelay ?? 250;
  const loadingMessage = options?.validationLoadingMessage ?? 'Validating...';
  const control = options?.control as FormControl<TValue>;
  if (!control) {
    throw new Error(
      'FieldMachine requer um FormControl fornecido pelo componente.',
    );
  }
  type Ctx = FieldStore<TValue, TProps>;
  type Evt = FieldMachineEvent<TValue>;
  const state = () => new MachineState<Ctx, Evt>();

  const idle = state()
    .on('CHANGE', {
      target: 'dirty',
      actions: [setValueAction(false, control)],
    })
    .on('BLUR', { target: 'idle', actions: [markTouchedAction()] })
    .on('SET_DISABLED', {
      target: 'idle',
      actions: [setDisabledAction(control)],
    });

  const dirty = state()
    .on('CHANGE', {
      target: 'dirty',
      actions: [setValueAction(false, control)],
    })
    .on('BLUR', { target: 'dirty', actions: [markTouchedAction()] })
    .on('SET_DISABLED', {
      target: 'dirty',
      actions: [setDisabledAction(control)],
    })
    .after({ delay: validateDelay, target: 'validating', type: 'debounce' });

  const validating = state()
    .entry([setValidatingLoadingAction(true, loadingMessage)])
    .exit([setValidatingLoadingAction(false, loadingMessage)])
    .invoke({
      src: async ({ context, send }) => {
        // garante que o FormControl reflita o valor atual do store antes de validar
        const current = context();
        const value = current.valueState.current;
        control.setValue(value, { emitEvent: false });
        control.updateValueAndValidity();
        await awaitValidation(control);
        const errors = collectErrors(control);
        send({
          type: 'VALIDATION_RESULT',
          value: control.value as TValue,
          errors,
        });
      },
    })
    .on('SET_DISABLED', {
      target: 'validating',
      actions: [setDisabledAction(control)],
    })
    .on('VALIDATION_RESULT', [
      {
        target: 'valid',
        guard: (_ctx, evt) =>
          evt.type === 'VALIDATION_RESULT' && evt.errors.length === 0,
        actions: [applyValidationResultAction()],
      },
      {
        target: 'invalid',
        guard: (_ctx, evt) =>
          evt.type === 'VALIDATION_RESULT' && evt.errors.length > 0,
        actions: [applyValidationResultAction()],
      },
    ]);

  const valid = state()
    .on('CHANGE', {
      target: 'dirty',
      actions: [setValueAction(false, control)],
    })
    .on('BLUR', { target: 'valid', actions: [markTouchedAction()] })
    .on('SET_DISABLED', {
      target: 'valid',
      actions: [setDisabledAction(control)],
    });

  const invalid = state()
    .on('CHANGE', {
      target: 'dirty',
      actions: [setValueAction(false, control)],
    })
    .on('BLUR', { target: 'invalid', actions: [markTouchedAction()] })
    .on('SET_DISABLED', {
      target: 'invalid',
      actions: [setDisabledAction(control)],
    });

  const machineConfig = new MachineBuilder<Ctx, Evt>()
    .withId('field-machine')
    .withInitial('idle')
    .withContext(store)
    .addState('idle', idle)
    .addState('dirty', dirty)
    .addState('validating', validating)
    .addState('valid', valid)
    .addState('invalid', invalid)
    .build();

  return createMachine<Ctx, Evt>(machineConfig);
}
