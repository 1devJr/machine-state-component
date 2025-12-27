import { FormControl } from '@angular/forms';
import { FieldProps } from '../../store/store-shape';
import { FieldStore } from '../../store/field-store';
import { Action } from '../state-engine';
import {
  syncControlValue,
  toggleControl,
  updateLoadingHint,
} from './field-machine.helpers';
import { FieldMachineEvent } from './field-machine';

export function setValueAction<TValue, TProps extends FieldProps>(
  markTouched: boolean,
  control: FormControl<TValue>,
): Action<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  return ({ context, setContext, event }) => {
    if (event.type !== 'CHANGE') return;
    const prev = context();
    syncControlValue(control, event.value);
    control.markAsDirty({ onlySelf: true });
    if (markTouched) {
      control.markAsTouched({ onlySelf: true });
    }
    setContext({
      ...prev,
      valueState: {
        ...prev.valueState,
        current: event.value,
        dirty: control.dirty || prev.valueState.dirty,
        touched: control.touched || prev.valueState.touched,
      },
    });
  };
}

export function markTouchedAction<TValue, TProps extends FieldProps>(
  control: FormControl<TValue>,
): Action<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  return ({ context, setContext }) => {
    const prev = context();
    if (prev.valueState.touched && control.touched) return;
    control.markAsTouched({ onlySelf: true });
    setContext({
      ...prev,
      valueState: { ...prev.valueState, touched: true },
    });
  };
}

export function applyValidationResultAction<TValue, TProps extends FieldProps>(
  control: FormControl<TValue>,
): Action<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  return ({ context, setContext, event }) => {
    if (event.type !== 'VALIDATION_RESULT') return;
    const prev = context();
    const isValid = event.errors.length === 0;
    setContext({
      ...prev,
      props: { ...prev.props, status: isValid ? 'ready' : 'error' },
      valueState: {
        ...prev.valueState,
        current: control.value as TValue,
        dirty: control.dirty,
        touched: control.touched,
        valid: isValid,
        errors: event.errors,
      },
    });
  };
}

export function setValidatingLoadingAction<TValue, TProps extends FieldProps>(
  isLoading: boolean,
  message: string,
): Action<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  return ({ context, setContext }) => {
    const prev = context();
    const nextLoadings = updateLoadingHint(prev.loadings, isLoading, message);

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

export function setDisabledAction<TValue, TProps extends FieldProps>(
  control: FormControl<TValue>,
): Action<FieldStore<TValue, TProps>, FieldMachineEvent<TValue>> {
  return ({ context, setContext, event }) => {
    if (event.type !== 'SET_DISABLED') return;
    const prev = context();
    toggleControl(control, event.disabled);
    setContext({
      ...prev,
      props: { ...prev.props, enabled: !control.disabled },
      fieldProperties: { ...prev.fieldProperties, disabled: control.disabled },
    });
  };
}
