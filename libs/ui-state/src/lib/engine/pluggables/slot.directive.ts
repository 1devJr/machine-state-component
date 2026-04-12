import {
  ComponentRef,
  Directive,
  effect,
  inject,
  Injector,
  input,
  OnDestroy,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { EngineFacade } from '../facade/engine.facade';
import { EngineEvent, EngineState } from '../store/engine.types';
import {
  ENGINE_PLUGGABLE_CONTEXT,
  PluggableConfig,
  PluggableContext,
  PluggableStoreArtifacts,
  PluggableWithArtifacts,
  SlotId,
} from './pluggable.types';

@Directive({
  selector: '[uiEngineSlot]',
  standalone: true,
})
export class EngineSlotDirective<
  TState extends EngineState<TStatus>,
  TStatus extends string,
  TEvent extends EngineEvent,
  TServices extends Record<string, unknown>,
> implements OnDestroy
{
  readonly slotId = input.required<SlotId>({ alias: 'uiEngineSlot' });
  readonly pluggable = input<PluggableConfig | undefined>();
  readonly facade = input<
    EngineFacade<TState, TStatus, TEvent, TServices> | undefined
  >();

  readonly #vcr = inject(ViewContainerRef);
  readonly #injector = inject(Injector);

  #componentRef: ComponentRef<unknown> | null = null;
  #currentPluggableId: string | null = null;
  #currentComponentType: Type<unknown> | null = null;

  #transitionsCleanup: (() => void) | null = null;
  #effectsCleanup: (() => void) | null = null;
  #sliceModuleCleanup: (() => void) | null = null;
  #registeredSliceKey: string | null = null;

  constructor() {
    effect(() => {
      const pluggable = this.pluggable();
      const slotId = this.slotId();
      const facade = this.facade();
      if (!facade) {
        this.#clear();
        return;
      }

      if (!pluggable) {
        this.#clear();
        return;
      }

      const isSameId = pluggable.id === this.#currentPluggableId;
      const isSameType = pluggable.component === this.#currentComponentType;

      if (isSameId && isSameType && this.#componentRef) {
        this.#componentRef.setInput('config', pluggable.config);
        return;
      }

      this.#clear();
      this.#createComponent(facade, slotId, pluggable);
    });
  }

  #extractStoreArtifacts(
    component: Type<unknown>,
  ): PluggableStoreArtifacts<TState, TStatus, TEvent, TServices> | undefined {
    const candidate = component as Partial<
      PluggableWithArtifacts<TState, TStatus, TEvent, TServices>
    >;
    return candidate.storeArtifacts;
  }

  #createComponent(
    facade: EngineFacade<TState, TStatus, TEvent, TServices>,
    slotId: SlotId,
    pluggable: PluggableConfig,
  ): void {
    const artifacts = this.#extractStoreArtifacts(pluggable.component);

    const sliceRegistration = pluggable.slotSlice ?? artifacts?.slice;

    if (sliceRegistration) {
      facade.registerSlice(
        sliceRegistration.key,
        sliceRegistration.initialState,
      );
      this.#registeredSliceKey = sliceRegistration.key;
    }

    if (artifacts?.transitions) {
      this.#transitionsCleanup = facade.registerTransitions(
        artifacts.transitions,
      );
    }

    if (artifacts?.effects?.length) {
      this.#effectsCleanup = facade.registerEffects(artifacts.effects);
    }

    if (artifacts?.actions || artifacts?.selections) {
      this.#sliceModuleCleanup = facade.registerSliceModule(
        this.#registeredSliceKey ?? slotId,
        {
          actions: artifacts.actions,
          selections: artifacts.selections,
        },
      );
    }

    const context: PluggableContext<TState, TStatus, TEvent, unknown> = {
      commands: facade.commands,
      state: facade.state,
      injector: this.#injector,
      config: pluggable.config,
      slotId,
    };

    const childInjector = Injector.create({
      providers: [{ provide: ENGINE_PLUGGABLE_CONTEXT, useValue: context }],
      parent: this.#injector,
    });

    this.#componentRef = this.#vcr.createComponent(pluggable.component, {
      injector: childInjector,
    });

    this.#componentRef.setInput('config', pluggable.config);

    if (pluggable.cssClass) {
      const host = this.#componentRef.location.nativeElement as HTMLElement;
      for (const className of pluggable.cssClass.split(' ')) {
        host.classList.add(className);
      }
    }

    this.#currentPluggableId = pluggable.id;
    this.#currentComponentType = pluggable.component;
  }

  #clear(): void {
    this.#transitionsCleanup?.();
    this.#transitionsCleanup = null;

    this.#effectsCleanup?.();
    this.#effectsCleanup = null;

    this.#sliceModuleCleanup?.();
    this.#sliceModuleCleanup = null;

    if (this.#registeredSliceKey) {
      this.facade()?.unregisterSlice(this.#registeredSliceKey);
      this.#registeredSliceKey = null;
    }

    this.#vcr.clear();
    this.#componentRef = null;
    this.#currentPluggableId = null;
    this.#currentComponentType = null;
  }

  ngOnDestroy(): void {
    this.#clear();
  }
}
