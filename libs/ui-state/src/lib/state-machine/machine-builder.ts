import type {
  MachineConfig,
  MachineEvent,
  StateConfig,
  StateKey,
} from './state-types';
import { MachineState } from './machine-state';

export class MachineBuilder<TContext, TEvent extends MachineEvent> {
  private idValue = 'machine';
  private initialValue: StateKey = '__initial__';
  private contextValue: TContext = {} as TContext;
  private statesValue: Record<StateKey, StateConfig<TContext, TEvent>> = {};

  /**
   * Define o identificador da máquina (apenas informativo para logs/inspeção).
   */
  withId(id: string): this {
    this.idValue = id;
    return this;
  }

  /**
   * Define o estado inicial da máquina. Cria a entrada caso ainda não exista.
   */
  withInitial(state: StateKey): this {
    this.initialValue = state;
    this.ensureState(state);
    return this;
  }

  /**
   * Define o contexto inicial da máquina.
   */
  withContext(ctx: TContext): this {
    this.contextValue = ctx;
    return this;
  }

  /**
   * Adiciona um estado já configurado (via MachineState) ao builder.
   *
   * @example
   * ```ts
   * const idle = new MachineState<{ count: number }, { type: 'INC' }>()
   *   .on('INC', { target: 'active' });
   *
   * const cfg = new MachineBuilder<{ count: number }, { type: 'INC' }>()
   *   .withId('counter')
   *   .withInitial('idle')
   *   .withContext({ count: 0 })
   *   .addState('idle', idle)
   *   .addState('active', new MachineState())
   *   .build();
   * ```
   */
  addState(
    state: StateKey,
    machineState: MachineState<TContext, TEvent>,
  ): this {
    this.statesValue[state] = machineState.toConfig();
    return this;
  }

  /**
   * Finaliza a construção e retorna o MachineConfig pronto para `createMachine`.
   */
  build(): MachineConfig<TContext, TEvent> {
    const states = { ...this.statesValue };
    if (!states[this.initialValue]) {
      states[this.initialValue] = {};
    }
    return {
      id: this.idValue,
      initial: this.initialValue,
      context: this.contextValue,
      states,
    };
  }

  private ensureState(state: StateKey): void {
    if (!this.statesValue[state]) {
      this.statesValue[state] = {} as StateConfig<TContext, TEvent>;
    }
  }
}
