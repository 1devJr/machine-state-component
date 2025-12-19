import { Signal, computed, signal } from '@angular/core';
import {
  Action,
  AfterConfig,
  EventKey,
  InvokeConfig,
  MachineConfig,
  MachineEvent,
  MachineInstance,
  StateConfig,
  StateKey,
  TransitionConfig,
} from './state-types';

export type {
  Action,
  AfterConfig,
  EventKey,
  InvokeConfig,
  MachineConfig,
  MachineEvent,
  MachineInstance,
  StateConfig,
  StateKey,
  TransitionConfig,
} from './state-types';

interface CompiledMachine<TContext, TEvent extends MachineEvent> {
  onMap: Map<StateKey, Map<EventKey, TransitionConfig<TContext, TEvent>[]>>;
  afterMap: Map<StateKey, AfterConfig<TContext>[]>;
  invokeMap: Map<StateKey, InvokeConfig<TContext, TEvent>>;
  entryMap: Map<StateKey, Action<TContext, TEvent>[]>;
  exitMap: Map<StateKey, Action<TContext, TEvent>[]>;
}

/**
 * Instancia uma máquina de estados reativa: compila o config, cria sinais de estado/contexto
 * e devolve API para enviar eventos e encerrar.
 *
 * @example
 * ```ts
 * import { MachineBuilder } from './machine-builder';
 * import { MachineState } from './machine-state';
 *
 * // 1) Defina estados de forma isolada
 * const idle = new MachineState<{ count: number }, { type: 'INC' }>()
 *   .on('INC', { target: 'active', actions: [({ context, setContext }) => {
 *     const next = context().count + 1;
 *     setContext({ count: next });
 *   }] });
 *
 * const active = new MachineState<{ count: number }, { type: 'INC' }>()
 *   .after({ delay: 500, target: 'idle' });
 *
 * // 2) Monte o config com o builder
 * const machineConfig = new MachineBuilder<{ count: number }, { type: 'INC' }>()
 *   .withId('counter')
 *   .withInitial('idle')
 *   .withContext({ count: 0 })
 *   .addState('idle', idle)
 *   .addState('active', active)
 *   .build();
 *
 * // 3) Crie a máquina e envie eventos
 * const machine = createMachine(machineConfig);
 * machine.send({ type: 'INC' });
 * console.log(machine.state());   // 'active'
 * console.log(machine.context()); // { count: 1 }
 * ```
 *
 * @param config Configuração declarativa da máquina (estados, transições e contexto inicial).
 * @returns Instância reativa com sinais `state` e `context`, além de `send` e `stop`.
 */
export function createMachine<TContext, TEvent extends MachineEvent>(
  config: MachineConfig<TContext, TEvent>,
): MachineInstance<TContext, TEvent> {
  const compiled = compileMachine(config);
  const stateSig = signal<StateKey>(config.initial);
  const ctxSig = signal<TContext>(config.context);

  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const invocations = new Map<StateKey, AbortController>();

  const api = {
    context: () => ctxSig(),
    setContext: (next: TContext | ((prev: TContext) => TContext)) => {
      ctxSig.set(
        typeof next === 'function'
          ? (next as (p: TContext) => TContext)(ctxSig())
          : next,
      );
    },
  };

  const clearTimersFor = (state: StateKey) => {
    for (const [key, handle] of timers.entries()) {
      if (key.startsWith(`${state}::`)) {
        clearTimeout(handle);
        timers.delete(key);
      }
    }
  };

  const scheduleAfter = (state: StateKey) => {
    const afters = compiled.afterMap.get(state);
    if (!afters) return;
    for (const aft of afters) {
      const key = `${state}::after::${aft.delay}`;
      if (aft.type === 'debounce') {
        const existing = timers.get(key);
        if (existing) clearTimeout(existing);
      }
      const handle = setTimeout(() => {
        timers.delete(key);
        performTransition(state, { type: `@@after_${aft.delay}` } as TEvent, {
          target: aft.target,
          actions: aft.actions as Action<TContext, TEvent>[] | undefined,
        });
      }, aft.delay);
      timers.set(key, handle);
    }
  };

  const startInvoke = (state: StateKey) => {
    const inv = compiled.invokeMap.get(state);
    if (!inv) return;
    const controller = new AbortController();
    invocations.set(state, controller);
    void Promise.resolve(
      inv.src({ signal: controller.signal, context: () => ctxSig(), send }),
    ).catch(() => {
      invocations.delete(state);
      controller.abort();
    });
  };

  const stopInvoke = (state: StateKey) => {
    const controller = invocations.get(state);
    if (controller) {
      controller.abort();
      invocations.delete(state);
    }
    const inv = compiled.invokeMap.get(state);
    inv?.onCleanup?.();
  };

  const runActions = (
    actions: Action<TContext, TEvent>[] | undefined,
    event: TEvent,
  ) => {
    actions?.forEach((fn) => fn({ ...api, event, send }));
  };

  const performTransition = (
    from: StateKey,
    event: TEvent,
    transition: TransitionConfig<TContext, TEvent> | undefined,
  ) => {
    if (!transition) return;
    if (transition.guard && !transition.guard(ctxSig(), event)) return;

    // exit
    runActions(compiled.exitMap.get(from), event);
    clearTimersFor(from);
    stopInvoke(from);

    // transition actions
    runActions(transition.actions, event);

    // enter target
    stateSig.set(transition.target);
    runActions(compiled.entryMap.get(transition.target), event);
    scheduleAfter(transition.target);
    startInvoke(transition.target);
  };

  const send = (evt: TEvent) => {
    const current = stateSig();
    const map = compiled.onMap.get(current);
    if (!map) return;
    const transitions = map.get(evt.type);
    if (!transitions || transitions.length === 0) return;
    // pick first that passes guard
    for (const t of transitions) {
      if (!t.guard || t.guard(ctxSig(), evt)) {
        performTransition(current, evt, t);
        return;
      }
    }
  };

  // initialize entry/after/invoke of initial state
  runActions(compiled.entryMap.get(config.initial), {
    type: '@@init',
  } as TEvent);
  scheduleAfter(config.initial);
  startInvoke(config.initial);

  return {
    state: computed(() => stateSig()),
    context: computed(() => ctxSig()),
    send,
    stop: () => {
      clearTimersFor(stateSig());
      stopInvoke(stateSig());
    },
  };
}

/**
 * Normaliza o config em mapas otimizados para execução (on/after/invoke/entry/exit).
 * Uso interno do runtime; não é necessário chamá-la diretamente.
 *
 * @param config Configuração declarativa da máquina.
 * @returns Estruturas pré-processadas para execução performática.
 */
function compileMachine<TContext, TEvent extends MachineEvent>(
  config: MachineConfig<TContext, TEvent>,
): CompiledMachine<TContext, TEvent> {
  const onMap = new Map<
    StateKey,
    Map<EventKey, TransitionConfig<TContext, TEvent>[]>
  >();
  const afterMap = new Map<StateKey, AfterConfig<TContext>[]>();
  const invokeMap = new Map<StateKey, InvokeConfig<TContext, TEvent>>();
  const entryMap = new Map<StateKey, Action<TContext, TEvent>[]>();
  const exitMap = new Map<StateKey, Action<TContext, TEvent>[]>();

  for (const [stateKey, stateCfg] of Object.entries(config.states)) {
    if (stateCfg.on) {
      const evtMap = new Map<EventKey, TransitionConfig<TContext, TEvent>[]>();
      for (const [eventKey, transitions] of Object.entries(stateCfg.on)) {
        const list = Array.isArray(transitions) ? transitions : [transitions];
        evtMap.set(eventKey, list);
      }
      onMap.set(stateKey, evtMap);
    }
    if (stateCfg.after) {
      afterMap.set(stateKey, stateCfg.after);
    }
    if (stateCfg.invoke) {
      invokeMap.set(stateKey, stateCfg.invoke);
    }
    if (stateCfg.entry) {
      entryMap.set(stateKey, stateCfg.entry);
    }
    if (stateCfg.exit) {
      exitMap.set(stateKey, stateCfg.exit);
    }
  }

  return { onMap, afterMap, invokeMap, entryMap, exitMap };
}
