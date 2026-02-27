import { JsonPipe } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';
import {
  EngineDevtoolsOverlayPayload,
  EngineDevtoolsOverlaySide,
} from './devtools-overlay.types';

@Component({
  selector: 'ui-engine-devtools-overlay',
  standalone: true,
  imports: [JsonPipe],
  template: `
    @if (enabled()) {
      <button
        type="button"
        class="engine-devtools-launcher"
        [class.engine-devtools-launcher--left]="side() === 'left'"
        [class.engine-devtools-launcher--right]="side() === 'right'"
        [attr.aria-expanded]="isOpen()"
        (click)="toggleOpen()"
      >
        Devtools
      </button>
    }

    @if (enabled() && isOpen()) {
      <aside
        class="engine-devtools-panel"
        [class.engine-devtools-panel--left]="side() === 'left'"
        [class.engine-devtools-panel--right]="side() === 'right'"
        [style.width.px]="panelWidth()"
      >
        <header class="engine-devtools-panel__header">
          <div>
            <h3>{{ payload()?.title ?? 'Engine Devtools' }}</h3>
            @if (payload()?.subtitle) {
              <p>{{ payload()?.subtitle }}</p>
            }
          </div>

          <div class="engine-devtools-panel__header-actions">
            <label class="engine-devtools-width">
              <span>Largura</span>
              <input
                type="range"
                min="320"
                max="920"
                [value]="panelWidth()"
                (input)="onWidthInput($event)"
              />
            </label>
            <button type="button" (click)="toggleSide()">
              Lado: {{ side() === 'right' ? 'Direita' : 'Esquerda' }}
            </button>
            <button type="button" (click)="close()">Fechar</button>
          </div>
        </header>

        <section class="engine-devtools-panel__content">
          @for (section of sections(); track section.id) {
            <article class="engine-devtools-section">
              <h4>{{ section.title }}</h4>

              @if (section.kind === 'list') {
                <ul>
                  @for (item of section.items; track item.title + item.meta) {
                    <li>
                      <strong>{{ item.title }}</strong>
                      @if (item.subtitle) {
                        <p>{{ item.subtitle }}</p>
                      }
                      @if (item.meta) {
                        <small>{{ item.meta }}</small>
                      }
                      @if (item.details !== undefined) {
                        <pre>{{ item.details | json }}</pre>
                      }
                    </li>
                  }
                </ul>
              }

              @if (section.kind === 'json') {
                <pre>{{ section.value | json }}</pre>
              }
            </article>
          }
        </section>
      </aside>
    }
  `,
  styles: [
    `
      .engine-devtools-launcher {
        position: fixed;
        top: 50%;
        z-index: 1100;
        transform: translateY(-50%);
        border: 2px solid #283446;
        background: #ffffff;
        color: #162231;
        border-radius: 999px;
        padding: 0.35rem 0.75rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28);
      }

      .engine-devtools-launcher--right {
        right: 0.65rem;
      }

      .engine-devtools-launcher--left {
        left: 0.65rem;
      }

      .engine-devtools-panel {
        position: fixed;
        top: 0;
        bottom: 0;
        z-index: 1110;
        display: grid;
        grid-template-rows: auto 1fr;
        background: #f6f8fc;
        border-left: 1px solid #b5c0cf;
        border-right: 1px solid #b5c0cf;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
        min-width: 320px;
        max-width: 92vw;
        resize: horizontal;
        overflow: auto;
      }

      .engine-devtools-panel--right {
        right: 0;
      }

      .engine-devtools-panel--left {
        left: 0;
      }

      .engine-devtools-panel__header {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: flex-start;
        padding: 0.8rem;
        border-bottom: 1px solid #c8d0dc;
        background: linear-gradient(180deg, #ffffff 0%, #edf2f9 100%);
      }

      .engine-devtools-panel__header h3 {
        margin: 0;
        color: #1f2b3a;
      }

      .engine-devtools-panel__header p {
        margin: 0.2rem 0 0;
        color: #4a5666;
      }

      .engine-devtools-panel__header-actions {
        display: flex;
        gap: 0.35rem;
        align-items: center;
      }

      .engine-devtools-panel__header-actions button {
        border: 1px solid #8b99ac;
        border-radius: 0.5rem;
        background: #ffffff;
        color: #1a2635;
        padding: 0.32rem 0.55rem;
        cursor: pointer;
        font-weight: 600;
      }

      .engine-devtools-width {
        display: grid;
        gap: 0.15rem;
        font-size: 0.78rem;
        color: #38485b;
      }

      .engine-devtools-width input {
        width: 130px;
      }

      .engine-devtools-panel__content {
        overflow: auto;
        padding: 0.75rem;
        display: grid;
        gap: 0.7rem;
      }

      .engine-devtools-section {
        background: #ffffff;
        border: 1px solid #c2ccda;
        border-radius: 0.65rem;
        padding: 0.65rem;
      }

      .engine-devtools-section h4 {
        margin: 0 0 0.45rem;
        color: #1d2a39;
      }

      .engine-devtools-section ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.4rem;
      }

      .engine-devtools-section li {
        border: 1px solid #dde4ef;
        border-radius: 0.5rem;
        padding: 0.4rem;
        color: #273242;
      }

      .engine-devtools-section li p {
        margin: 0.2rem 0;
      }

      .engine-devtools-section li small {
        color: #536173;
      }

      .engine-devtools-section pre {
        margin: 0.35rem 0 0;
        max-height: 180px;
        overflow: auto;
        background: #151a22;
        color: #ffffff;
        border-radius: 0.45rem;
        padding: 0.45rem;
      }
    `,
  ],
})
export class EngineDevtoolsOverlayComponent {
  readonly enabled = input<boolean>(false);
  readonly payload = input<EngineDevtoolsOverlayPayload | null>(null);

  readonly isOpen = signal(false);
  readonly side = signal<EngineDevtoolsOverlaySide>('right');
  readonly panelWidth = signal(440);

  readonly sections = computed(() => this.payload()?.sections ?? []);

  constructor() {
    effect(() => {
      if (!this.enabled()) {
        this.isOpen.set(false);
      }
    });
  }

  toggleOpen(): void {
    this.isOpen.update((value) => !value);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggleSide(): void {
    this.side.update((value) => (value === 'right' ? 'left' : 'right'));
  }

  onWidthInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value)) {
      this.panelWidth.set(value);
    }
  }
}
