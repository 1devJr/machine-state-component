import { FormControl } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { createFieldMachine } from './field-machine';
import { createPhoneStore } from '../../store/phone-store';

const makeStore = (value = '') =>
  createPhoneStore({
    valueState: {
      current: value,
      dirty: false,
      touched: false,
      valid: true,
      errors: [],
    },
  });

describe('field-machine', () => {
  it('segue dirty -> validating -> valid quando o controle é válido', async () => {
    vi.useFakeTimers();
    try {
      const control = new FormControl('');
      const store = makeStore('');
      const machine = createFieldMachine(store, {
        control,
        validateDelay: 5,
        validationTimeoutMs: 200,
        validationLoadingMessage: 'Validando...',
      });

      machine.send({ type: 'CHANGE', value: '+5511999999999' });
      expect(machine.state()).toBe('dirty');

      vi.advanceTimersByTime(5);
      await vi.runAllTimersAsync();

      expect(machine.state()).toBe('valid');
      expect(machine.context().valueState.current).toBe('+5511999999999');
      expect(machine.context().valueState.errors).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('segue para invalid quando há erros de validação', async () => {
    vi.useFakeTimers();
    try {
      const control = new FormControl('', {
        validators: [() => ({ required: 'Required' })],
      });
      const store = makeStore('');
      const machine = createFieldMachine(store, {
        control,
        validateDelay: 5,
        validationTimeoutMs: 200,
        validationLoadingMessage: 'Validando...',
      });

      machine.send({ type: 'CHANGE', value: '' });
      vi.advanceTimersByTime(5);
      await vi.runAllTimersAsync();

      expect(machine.state()).toBe('invalid');
      expect(machine.context().valueState.errors).toContain('Required');
    } finally {
      vi.useRealTimers();
    }
  });

  it('marca timeout de validação quando o controle permanece em pending', async () => {
    vi.useFakeTimers();
    try {
      const neverValidator = () => new Promise<null>(() => {});
      const control = new FormControl('', {
        asyncValidators: [neverValidator],
      });
      const store = makeStore('');
      const machine = createFieldMachine(store, {
        control,
        validateDelay: 5,
        validationTimeoutMs: 20,
        validationLoadingMessage: 'Validando...',
      });

      machine.send({ type: 'CHANGE', value: 'any' });
      vi.advanceTimersByTime(5);
      await vi.advanceTimersByTimeAsync(25);

      expect(machine.state()).toBe('invalid');
      expect(machine.context().valueState.errors).toContain(
        'Validation timeout',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
