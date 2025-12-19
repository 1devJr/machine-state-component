import type {
  Action,
  AfterConfig,
  InvokeConfig,
  MachineEvent,
  StateConfig,
  TransitionConfig,
} from './state-types';

export class MachineState<TContext, TEvent extends MachineEvent> {
  private config: StateConfig<TContext, TEvent> = {};

  /**
   * Define transições para um evento no estado.
   * Aceita único objeto ou array, permitindo múltiplas transições com guards.
   *
   * @example
   * ```ts
   * const idle = new MachineState<{ count: number }, { type: 'INC' | 'RESET' }>()
   *   .on('INC', { target: 'active', actions: [({ context, setContext }) => {
   *     setContext({ count: context().count + 1 });
   }] })
   *   .on('RESET', { target: 'idle', actions: [({ setContext }) => setContext({ count: 0 })] });
   * ```
   */
  on(
    event: TEvent['type'],
    transition:
      | TransitionConfig<TContext, TEvent>
      | TransitionConfig<TContext, TEvent>[],
  ): this {
    const list = Array.isArray(transition) ? transition : [transition];
    this.config.on = this.config.on ?? {};
    const existing = this.config.on[event];
    const merged = Array.isArray(existing) ? [...existing, ...list] : list;
    this.config.on[event] = merged;
    return this;
  }

  after(
    cfg: NonNullable<StateConfig<TContext, TEvent>['after']>[number],
  ): this {
    this.config.after = [...(this.config.after ?? []), cfg];
    return this;
  }

  /**
   * Define um bloco invoke executado na entrada do estado. Abortado automaticamente ao sair.
   * Use para side-effects assíncronos (fetch/validators) que podem despachar eventos.
   *
   * @example
   * ```ts
   * new MachineState<{ token: string | null }, { type: 'TOKEN_READY'; token: string }>()
   *   .invoke({
   *     src: async ({ send }) => {
   *       const token = await fetch('/token').then(r => r.text());
   *       send({ type: 'TOKEN_READY', token });
   *     },
   *   });
   * ```
   */
  invoke(cfg: NonNullable<StateConfig<TContext, TEvent>['invoke']>): this {
    this.config.invoke = cfg;
    return this;
  }

  /**
   * Registra ações a serem executadas na entrada do estado.
   * São acumulativas e preservam ordem de registro.
   */
  entry(actions: NonNullable<StateConfig<TContext, TEvent>['entry']>): this {
    this.config.entry = [...(this.config.entry ?? []), ...actions];
    return this;
  }

  /**
   * Registra ações a serem executadas na saída do estado.
   * São acumulativas e preservam ordem de registro.
   */
  exit(actions: NonNullable<StateConfig<TContext, TEvent>['exit']>): this {
    this.config.exit = [...(this.config.exit ?? []), ...actions];
    return this;
  }

  /**
   * Exporta a configuração imutável do estado para ser consumida pelo builder.
   * Clona arrays para evitar mutação externa após o build.
   */
  toConfig(): StateConfig<TContext, TEvent> {
    const { on, after, invoke, entry, exit } = this.config;
    return {
      on,
      after: after ? [...after] : undefined,
      invoke,
      entry: entry ? [...entry] : undefined,
      exit: exit ? [...exit] : undefined,
    };
  }
}
