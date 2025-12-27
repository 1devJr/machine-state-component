import { Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  PhoneStore,
  PhoneStoreOverrides,
  UiPhoneField,
  UiStatePanel,
  createPhoneStore,
} from '@machine-state-component/ui-state';

@Component({
  imports: [UiStatePanel, UiPhoneField, ReactiveFormsModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly phoneControl = new FormControl<string>('+55119999999', {
    nonNullable: true,
  });

  protected readonly phoneStore = signal<PhoneStore>(createPhoneStore());
  protected readonly storeOverrides = signal<PhoneStoreOverrides | undefined>(
    undefined,
  );
  protected readonly contextEditor = signal<string>(
    JSON.stringify(this.phoneStore(), null, 2),
  );
  protected readonly contextError = signal<string>('');
  protected readonly phoneValue = computed(
    () => this.phoneStore().valueState.current,
  );

  protected onStoreChange(store: PhoneStore) {
    this.phoneStore.set(store);
    this.contextEditor.set(JSON.stringify(store, null, 2));
    // mantenha o FormControl externo sincronizado com o contexto emitido
    this.syncControlWithStore(store);
  }

  protected applyContextFromEditor() {
    try {
      const parsed = JSON.parse(this.contextEditor()) as PhoneStoreOverrides;
      this.storeOverrides.set(parsed);
      this.contextError.set('');
      // opcional: já refletir no controle externo enquanto o componente reconstrói
      if (
        parsed.valueState?.current !== undefined &&
        this.phoneControl.value !== parsed.valueState.current
      ) {
        this.phoneControl.setValue(parsed.valueState.current, {
          emitEvent: false,
          emitModelToViewChange: false,
        });
      }
      if (parsed.props?.enabled === false || parsed.fieldProperties?.disabled) {
        this.phoneControl.disable({ emitEvent: false });
      } else if (
        parsed.props?.status !== 'disabled' &&
        this.phoneControl.disabled
      ) {
        this.phoneControl.enable({ emitEvent: false });
      }
    } catch (err) {
      this.contextError.set('JSON inválido: ' + (err as Error).message);
    }
  }

  protected resetEditorToStore() {
    this.contextEditor.set(JSON.stringify(this.phoneStore(), null, 2));
    this.contextError.set('');
  }

  protected onEditorInput(event: Event) {
    const value = (event.target as HTMLTextAreaElement | null)?.value ?? '';
    this.contextEditor.set(value);
  }

  private syncControlWithStore(store: PhoneStore) {
    if (this.phoneControl.value !== store.valueState.current) {
      this.phoneControl.setValue(store.valueState.current, {
        emitEvent: false,
        emitModelToViewChange: false,
      });
    }

    const shouldDisable =
      store.props.enabled === false || store.fieldProperties.disabled;
    if (shouldDisable && this.phoneControl.enabled) {
      this.phoneControl.disable({ emitEvent: false });
    } else if (!shouldDisable && store.props.status !== 'disabled') {
      this.phoneControl.enable({ emitEvent: false });
    }
  }
}
