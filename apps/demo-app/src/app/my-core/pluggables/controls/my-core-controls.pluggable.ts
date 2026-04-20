import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { definePluggableStoreArtifacts } from '@machine-state-component/ui-state';
import { myCoreActions } from '../../store/my-core.actions';
import { PluggableBase } from '../../store/my-core.kernel';
import { MyCoreControlsConfig } from '../../store/my-core.types';

@Component({
  selector: 'app-my-core-controls-pluggable',
  standalone: true,
  templateUrl: './my-core-controls.pluggable.html',
  styleUrl: './my-core-controls.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCoreControlsPluggableComponent extends PluggableBase<MyCoreControlsConfig> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({});

  readonly isPtBr = computed(() => this.state()?.lang === 'pt-br');
  readonly copy = computed(() => ({
    title: this.isPtBr() ? 'Playground do fluxo' : this.mergedConfig().title,
    subtitle: this.isPtBr()
      ? 'Dispare um fluxo por vez para acompanhar a cadeia action -> transition -> effect -> state -> selection.'
      : this.mergedConfig().subtitle,
    successLabel: this.isPtBr()
      ? 'Executar fluxo de sucesso'
      : this.mergedConfig().successLabel,
    errorLabel: this.isPtBr()
      ? 'Executar fluxo de erro'
      : this.mergedConfig().errorLabel,
    resetLabel: this.isPtBr()
      ? 'Resetar o core'
      : this.mergedConfig().resetLabel,
    hint: this.isPtBr()
      ? 'Comece pelo sucesso, depois compare com o erro. A linha viva no painel de runtime mostra a diferenca.'
      : 'Start with success, then compare it with the error branch. The live line in the runtime panel shows the difference.',
  }));

  protected override getDefaultConfig(): MyCoreControlsConfig {
    return {
      title: 'Interactive playground',
      subtitle:
        'Dispatch one action and inspect the result before moving to the next concept.',
      successLabel: 'Run success flow',
      errorLabel: 'Run error flow',
      resetLabel: 'Reset',
    };
  }

  runSuccess(): void {
    this.dispatch(
      myCoreActions.runDemoAction(
        this.isPtBr() ? 'Fluxo de sucesso' : 'Success flow',
      ),
    );
  }

  runError(): void {
    this.dispatch(myCoreActions.simulateError('hard'));
  }

  reset(): void {
    this.dispatch(myCoreActions.reset());
  }
}
