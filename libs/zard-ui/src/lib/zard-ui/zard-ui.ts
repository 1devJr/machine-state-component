import { Component, Input, Signal, computed, signal } from '@angular/core';

type ButtonTone = 'primary' | 'ghost' | 'danger' | 'subtle';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'zui-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="zui-button"
      [class]="classList()"
      [disabled]="disabled"
    >
      <span class="zui-button__label"><ng-content /></span>
    </button>
  `,
  styleUrl: './zard-ui.scss',
})
export class ZuiButton {
  @Input() tone: ButtonTone = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;

  protected classList: Signal<string> = computed(
    () => `zui-button--${this.tone} zui-button--${this.size}`,
  );
}

@Component({
  selector: 'zui-card',
  standalone: true,
  template: `
    <section class="zui-card" [class.zui-card--elevated]="elevated">
      @if (title) {
        <header class="zui-card__header">
          <div class="zui-card__title">{{ title }}</div>
          <div class="zui-card__meta"><ng-content select="[meta]" /></div>
        </header>
      }
      <div class="zui-card__content">
        <ng-content />
      </div>
      @if (footer) {
        <footer class="zui-card__footer">
          <ng-content select="[footer]" />
        </footer>
      }
    </section>
  `,
  styleUrl: './zard-ui.scss',
})
export class ZuiCard {
  @Input({ required: false }) title?: string;
  @Input({ required: false }) footer = false;
  @Input() elevated = false;
}

@Component({
  selector: 'zui-badge',
  standalone: true,
  template: `<span class="zui-badge" [class]="'zui-badge--' + tone"
    ><ng-content
  /></span>`,
  styleUrl: './zard-ui.scss',
})
export class ZuiBadge {
  @Input() tone: 'neutral' | 'success' | 'warning' | 'danger' = 'neutral';
}

@Component({
  selector: 'zui-toggle',
  standalone: true,
  template: `
    <label class="zui-toggle">
      <input type="checkbox" [checked]="checked" (change)="onToggle($event)" />
      <span class="zui-toggle__track">
        <span class="zui-toggle__thumb"></span>
      </span>
      <span class="zui-toggle__label">
        <ng-content />
      </span>
    </label>
  `,
  styleUrl: './zard-ui.scss',
})
export class ZuiToggle {
  @Input() checked = false;
  @Input() disabled = false;

  private readonly state = signal(this.checked);

  protected onToggle(event: Event) {
    if (this.disabled) return;
    const target = event.target as HTMLInputElement;
    this.state.set(target.checked);
  }
}

@Component({
  selector: 'zui-input',
  standalone: true,
  template: `
    <label class="zui-input">
      @if (label) {
        <span class="zui-input__label">{{ label }}</span>
      }
      <input
        class="zui-input__control"
        [placeholder]="placeholder"
        [value]="value"
        [disabled]="disabled"
        (input)="handleInput($event)"
      />
      @if (hint) {
        <small class="zui-input__hint">{{ hint }}</small>
      }
    </label>
  `,
  styleUrl: './zard-ui.scss',
})
export class ZuiInput {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() value = '';
  @Input() disabled = false;

  protected handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
  }
}

export const ZardUiImports = [
  ZuiButton,
  ZuiCard,
  ZuiBadge,
  ZuiToggle,
  ZuiInput,
];
