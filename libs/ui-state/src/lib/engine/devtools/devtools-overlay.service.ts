import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  DestroyRef,
  EnvironmentInjector,
  inject,
  Injectable,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { EngineDevtoolsOverlayComponent } from './devtools-overlay.component';
import { EngineDevtoolsOverlayPayload } from './devtools-overlay.types';

@Injectable({
  providedIn: 'root',
})
export class EngineDevtoolsOverlayService {
  readonly #appRef = inject(ApplicationRef);
  readonly #document = inject(DOCUMENT);
  readonly #environmentInjector = inject(EnvironmentInjector);
  readonly #destroyRef = inject(DestroyRef);

  #componentRef: ComponentRef<EngineDevtoolsOverlayComponent> | null = null;

  constructor() {
    this.#destroyRef.onDestroy(() => {
      this.destroy();
    });
  }

  setEnabled(enabled: boolean): void {
    this.#ensureComponent();
    this.#componentRef?.setInput('enabled', enabled);
  }

  setPayload(payload: EngineDevtoolsOverlayPayload | null): void {
    this.#ensureComponent();
    this.#componentRef?.setInput('payload', payload);
  }

  destroy(): void {
    if (!this.#componentRef) {
      return;
    }

    const appRefState = this.#appRef as ApplicationRef & {
      destroyed?: boolean;
    };
    if (!appRefState.destroyed) {
      this.#appRef.detachView(this.#componentRef.hostView);
    }
    this.#componentRef.destroy();
    this.#componentRef = null;
  }

  #ensureComponent(): void {
    if (this.#componentRef) {
      return;
    }

    this.#componentRef = createComponent(EngineDevtoolsOverlayComponent, {
      environmentInjector: this.#environmentInjector,
    });

    this.#appRef.attachView(this.#componentRef.hostView);
    this.#document.body.appendChild(this.#componentRef.location.nativeElement);
  }
}
