import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  forwardRef,
  computed,
  effect,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
  PhoneStore,
  PhoneStoreOverrides,
  createPhoneStore,
  mergePhoneStoreConfig,
} from '../store/phone-store';
import { createFieldMachine } from '../state-machine/field-machine/field-machine';

@Component({
  selector: 'ui-phone-field',
  standalone: true,
  templateUrl: './phone-field.html',
  styleUrl: './phone-field.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiPhoneField),
      multi: true,
    },
  ],
})
export class UiPhoneField
  implements OnChanges, OnDestroy, ControlValueAccessor
{
  @Input() storeOverrides?: PhoneStoreOverrides;
  @Input() initialMetadata?: PhoneStoreOverrides;

  @Output() valueChange = new EventEmitter<string>();
  @Output() storeChange = new EventEmitter<PhoneStore>();

  private readonly props = signal<PhoneStore['props']>(
    createPhoneStore().props,
  );
  private readonly data = signal<PhoneStore['data']>(createPhoneStore().data);
  private readonly request = signal<PhoneStore['request']>(
    createPhoneStore().request,
  );
  private readonly loadings = signal<PhoneStore['loadings']>(
    createPhoneStore().loadings,
  );
  private readonly messages = signal<PhoneStore['messages']>(
    createPhoneStore().messages,
  );
  private readonly storeErrors = signal<PhoneStore['errors']>(
    createPhoneStore().errors,
  );
  private readonly fieldProperties = signal<PhoneStore['fieldProperties']>(
    createPhoneStore().fieldProperties,
  );
  private readonly validators = signal<PhoneStore['validators']>(
    createPhoneStore().validators,
  );
  private readonly validationRules = signal<PhoneStore['validationRules']>(
    createPhoneStore().validationRules,
  );
  private readonly hintsControl = signal<PhoneStore['hintsControl']>(
    createPhoneStore().hintsControl,
  );
  private readonly infoControl = signal<PhoneStore['infoControl']>(
    createPhoneStore().infoControl,
  );
  private readonly valueState = signal<PhoneStore['valueState']>(
    createPhoneStore().valueState,
  );

  private readonly control = new FormControl<string>('', {
    nonNullable: true,
  });

  private readonly machineSig = signal(this.createMachine(createPhoneStore()));

  private readonly store = computed<PhoneStore>(() => ({
    props: this.props(),
    data: this.data(),
    request: this.request(),
    loadings: this.loadings(),
    messages: this.messages(),
    errors: this.storeErrors(),
    fieldProperties: this.fieldProperties(),
    validators: this.validators(),
    validationRules: this.validationRules(),
    hintsControl: this.hintsControl(),
    infoControl: this.infoControl(),
    valueState: this.valueState(),
  }));

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  private readonly syncEffect = effect(
    () => {
      const ctx = this.machineSig().context();
      this.applyContextSlices(ctx);
      this.storeChange.emit(ctx);
    },
    { allowSignalWrites: true },
  );

  constructor() {
    this.rebuildStore();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialMetadata'] || changes['storeOverrides']) {
      this.rebuildStore();
    }
  }

  private rebuildStore() {
    const merged = mergePhoneStoreConfig(
      this.initialMetadata,
      this.storeOverrides,
    );
    const next = createPhoneStore(merged);
    const currentMachine = this.machineSig();
    currentMachine.stop();
    const nextMachine = this.createMachine(next);
    this.machineSig.set(nextMachine);
    this.applyContextSlices(next);
    // garante que o host receba o contexto inicial após rebuild
    this.storeChange.emit(next);
  }

  protected readonly value = computed(() => this.valueState().current);
  protected readonly label = computed(() => this.fieldProperties().label);
  protected readonly visible = computed(() => this.props().visible ?? true);
  protected readonly disabled = computed(() => {
    const fp = this.fieldProperties();
    const props = this.props();
    return (
      fp.disabled === true ||
      props.enabled === false ||
      props.status === 'disabled'
    );
  });

  protected readonly placeholder = computed(() => {
    const loading = this.loadings().find(
      (l) => l.scope === 'field' && l.context === 'placeholder' && l.isLoading,
    );
    return loading?.message ?? this.fieldProperties().placeholder ?? '';
  });

  protected readonly hint = computed(() => {
    const loading = this.loadings().find(
      (l) => l.scope === 'field' && l.context === 'hint' && l.isLoading,
    );
    if (loading?.message) return loading.message;

    const hints = this.hintsControl();
    const fieldProps = this.fieldProperties();
    const charCountEnabled = hints?.charCount && fieldProps.maxLength;
    if (charCountEnabled) {
      const remaining =
        (fieldProps.maxLength ?? 0) - (this.valueState().current?.length ?? 0);
      return hints?.charCountMessage?.replace('X', `${remaining}`);
    }

    const firstHint = this.messages().hint[0]?.message;
    return firstHint ?? fieldProps.description ?? '';
  });

  protected readonly errors = computed(() => this.valueState().errors);

  protected onInput(event: Event) {
    const nextValue = (event.target as HTMLInputElement).value;
    this.applyValue(nextValue, { touched: this.valueState().touched || false });
    this.valueChange.emit(nextValue);
    this.onChange(nextValue);
  }

  protected onBlur() {
    const current = this.valueState().current;
    this.applyValue(current, { touched: true });
    this.onTouched();
  }

  private applyValue(nextValue: string, extraState?: { touched?: boolean }) {
    const touched = extraState?.touched ?? this.valueState().touched;
    this.machineSig().send({ type: 'CHANGE', value: nextValue });
    if (touched) {
      this.machineSig().send({ type: 'BLUR' });
    }
  }

  // ControlValueAccessor
  writeValue(value: string | null): void {
    if (value === null || value === undefined) {
      return;
    }
    // evita loops quando o FormControl externo escreve o mesmo valor
    if (this.valueState().current === value) {
      return;
    }
    this.machineSig().send({ type: 'CHANGE', value });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // ignore se o estado já coincide para evitar ciclo de SET_DISABLED
    if (this.control.disabled === isDisabled) return;
    this.machineSig().send({ type: 'SET_DISABLED', disabled: isDisabled });
  }

  ngOnDestroy(): void {
    this.syncEffect.destroy();
    this.machineSig().stop();
  }

  private applyContextSlices(ctx: PhoneStore) {
    this.props.set(ctx.props);
    this.data.set(ctx.data);
    this.request.set(ctx.request);
    this.loadings.set(ctx.loadings);
    this.messages.set(ctx.messages);
    this.storeErrors.set(ctx.errors);
    this.fieldProperties.set(ctx.fieldProperties);
    this.validators.set(ctx.validators);
    this.validationRules.set(ctx.validationRules);
    this.hintsControl.set(ctx.hintsControl);
    this.infoControl.set(ctx.infoControl);
    this.valueState.set(ctx.valueState);
  }

  private createMachine(store: PhoneStore) {
    return createFieldMachine<string, PhoneStore['fieldProperties']>(store, {
      control: this.control,
    });
  }
}
