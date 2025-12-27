import { AsyncValidatorFn, FormControl, ValidatorFn } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { filter, timeout } from 'rxjs/operators';
import { FieldProps } from '../../store/store-shape';
import { FieldStore } from '../../store/field-store';

export const collectErrors = (control: FormControl): string[] =>
  Object.values(control.errors ?? {})
    .flatMap((msg) => (Array.isArray(msg) ? msg.map(String) : String(msg)))
    .filter(Boolean);

export const awaitValidation = async (
  control: FormControl,
  timeoutMs?: number,
): Promise<'ok' | 'timeout'> => {
  if (!control.pending) return 'ok';
  const validation$ = control.statusChanges.pipe(
    filter((status) => status !== 'PENDING'),
    timeout({
      each: timeoutMs ?? undefined,
    }),
  );

  try {
    await firstValueFrom(validation$);
    return 'ok';
  } catch (err) {
    return 'timeout';
  }
};

export const syncControlValue = <TValue>(
  control: FormControl<TValue>,
  value: TValue,
): void => {
  if (!control) return;
  if (control.value !== value) {
    control.setValue(value, { emitEvent: false });
  }
};

export const toggleControl = <TValue>(
  control: FormControl<TValue>,
  disabled: boolean,
): void => {
  if (!control) return;
  if (disabled) {
    control.disable({ emitEvent: false });
  } else {
    control.enable({ emitEvent: false });
  }
};

export const updateLoadingHint = (
  loadings: FieldStore<unknown, FieldProps>['loadings'],
  isLoading: boolean,
  message: string,
) => {
  const targetIndex = loadings.findIndex(
    (l) => l.scope === 'field' && l.context === 'hint',
  );
  const nextLoadings = [...loadings];

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

  return nextLoadings;
};

export const configureControlFromStore = <TValue, TProps extends FieldProps>(
  control: FormControl<TValue>,
  store: FieldStore<TValue, TProps>,
) => {
  const syncValidators: ValidatorFn[] = [];
  const asyncValidators: AsyncValidatorFn[] = [];

  store.validators?.forEach((entry) => {
    if (!entry?.fn) return; // skip malformed validator configs
    const isAsync = entry.fn.constructor.name === 'AsyncFunction';
    if (isAsync) {
      asyncValidators.push((ctrl) =>
        Promise.resolve(
          entry.fn(ctrl.value as TValue, { props: store.fieldProperties }),
        ).then((valid) => (valid ? null : { [entry.type]: entry.message })),
      );
      return;
    }

    syncValidators.push((ctrl) => {
      const valid = entry.fn(ctrl.value as TValue, {
        props: store.fieldProperties,
      });
      return valid ? null : { [entry.type]: entry.message };
    });
  });

  control.setValidators(syncValidators);
  control.setAsyncValidators(asyncValidators);
  control.setValue(store.valueState.current, { emitEvent: false });

  if (store.valueState.dirty) {
    control.markAsDirty({ onlySelf: true });
  } else {
    control.markAsPristine();
  }

  if (store.valueState.touched) {
    control.markAsTouched({ onlySelf: true });
  } else {
    control.markAsUntouched();
  }

  const isDisabled =
    store.fieldProperties.disabled === true ||
    store.props.enabled === false ||
    store.props.status === 'disabled';

  if (isDisabled) {
    control.disable({ emitEvent: false });
  } else {
    control.enable({ emitEvent: false });
  }

  control.updateValueAndValidity({ emitEvent: false });
};
