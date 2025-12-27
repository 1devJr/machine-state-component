import { FormControl } from '@angular/forms';
import { FieldProps } from '../../store/store-shape';
import { FieldStore } from '../../store/field-store';
import { MachineBuilder } from '../machine-builder';
import { MachineState } from '../machine-state';
import { MachineInstance, createMachine } from '../state-engine';
import {
  awaitValidation,
  collectErrors,
  configureControlFromStore,
  syncControlValue,
} from './field-machine.helpers';
import {
  DEFAULT_LOADING_MESSAGE,
  DEFAULT_VALIDATE_DELAY,
  DEFAULT_VALIDATION_TIMEOUT,
  FieldMachineOptions,
} from './field-machine.options';
import {
  applyValidationResultAction,
  markTouchedAction,
  setDisabledAction,
  setValidatingLoadingAction,
  setValueAction,
} from './field-machine.actions';

export type FieldMachineEvent<TValue> =
  | { type: 'CHANGE'; value: TValue }
  | { type: 'BLUR' }
  | { type: 'VALIDATION_RESULT'; value: TValue; errors: string[] }
  | { type: 'SET_DISABLED'; disabled: boolean };

/**
 * Cria a máquina de estado padrão para campos, cobrindo mudança, blur e validação assíncrona.
 * Usa MachineState + MachineBuilder para montar o config antes de passar ao runtime.
 *
 * @example
 * ```ts
 * import { createFieldMachine } from './state-machine/field-machine/field-machine';
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
  const validateDelay = options?.validateDelay ?? DEFAULT_VALIDATE_DELAY;
  const loadingMessage =
    options?.validationLoadingMessage ?? DEFAULT_LOADING_MESSAGE;
  const validationTimeoutMs =
    options?.validationTimeoutMs ?? DEFAULT_VALIDATION_TIMEOUT;
  const control = options?.control as FormControl<TValue>;
  if (!control) {
    throw new Error(
      'FieldMachine requer um FormControl fornecido pelo componente.',
    );
  }
  configureControlFromStore(control, store);
  type Ctx = FieldStore<TValue, TProps>;
  type Evt = FieldMachineEvent<TValue>;
  const state = () => new MachineState<Ctx, Evt>();

  const idle = state()
    .on('CHANGE', {
      target: 'dirty',
      actions: [setValueAction(false, control)],
    })
    .on('BLUR', { target: 'idle', actions: [markTouchedAction(control)] })
    .on('SET_DISABLED', {
      target: 'idle',
      actions: [setDisabledAction(control)],
    });

  const dirty = state()
    .on('CHANGE', {
      target: 'dirty',
      actions: [setValueAction(false, control)],
    })
    .on('BLUR', { target: 'dirty', actions: [markTouchedAction(control)] })
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
        syncControlValue(control, value);
        control.updateValueAndValidity();
        const validationOutcome = await awaitValidation(
          control,
          validationTimeoutMs,
        );
        const errors = collectErrors(control);
        const timedOutErrors =
          validationOutcome === 'timeout'
            ? [...errors, 'Validation timeout']
            : errors;
        send({
          type: 'VALIDATION_RESULT',
          value: control.value as TValue,
          errors: timedOutErrors,
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
        actions: [applyValidationResultAction(control)],
      },
      {
        target: 'invalid',
        guard: (_ctx, evt) =>
          evt.type === 'VALIDATION_RESULT' && evt.errors.length > 0,
        actions: [applyValidationResultAction(control)],
      },
    ]);

  const valid = state()
    .on('CHANGE', {
      target: 'dirty',
      actions: [setValueAction(false, control)],
    })
    .on('BLUR', { target: 'valid', actions: [markTouchedAction(control)] })
    .on('SET_DISABLED', {
      target: 'valid',
      actions: [setDisabledAction(control)],
    });

  const invalid = state()
    .on('CHANGE', {
      target: 'dirty',
      actions: [setValueAction(false, control)],
    })
    .on('BLUR', { target: 'invalid', actions: [markTouchedAction(control)] })
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
