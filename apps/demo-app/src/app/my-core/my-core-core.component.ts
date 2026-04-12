import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { EngineSlotDirective } from '@machine-state-component/ui-state';
import { MyCoreChildDemoComponent } from './child-demo/my-core-child-demo.component';
import { MyCoreFacadeService } from './facade/my-core-facade.service';

@Component({
  selector: 'app-my-core-core',
  standalone: true,
  imports: [EngineSlotDirective, MyCoreChildDemoComponent],
  providers: [MyCoreFacadeService],
  templateUrl: './my-core-core.component.html',
  styleUrl: './my-core-core.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCoreCoreComponent {
  readonly facade = inject(MyCoreFacadeService);

  readonly state = this.facade.state;
  readonly composition = this.facade.composition;
  readonly runtimePanelLabel = computed(() =>
    this.facade.isPtBr() ? 'Runtime ao vivo' : 'Live runtime',
  );
  readonly learningModes = computed(() => [
    {
      id: 'flow' as const,
      label: this.facade.isPtBr() ? 'Fluxo do Core' : 'Core Flow',
    },
    {
      id: 'files' as const,
      label: this.facade.isPtBr() ? 'Arquivos e Regras' : 'Files and Rules',
    },
    {
      id: 'advanced' as const,
      label: this.facade.isPtBr() ? 'Recursos Avancados' : 'Advanced Features',
    },
  ]);
  readonly copy = computed(() => ({
    title: this.facade.isPtBr()
      ? 'Core de documentacao viva'
      : 'Live documentation core',
    subtitle: this.facade.isPtBr()
      ? 'Aprenda o fluxo principal primeiro. Depois leia os arquivos e so entao avance para composicao, projection slices, Devtools e reutilizacao.'
      : 'Learn the primary flow first. Then read the files and only then move to composition, projection slices, Devtools and reuse.',
    language: this.facade.isPtBr() ? 'Mudar para EN' : 'Switch to PT-BR',
    reset: this.facade.isPtBr() ? 'Resetar' : 'Reset',
    devtools: this.facade.isPtBr() ? 'Abrir Devtools' : 'Open Devtools',
    learningMode: this.facade.isPtBr()
      ? 'Modo de aprendizado'
      : 'Learning mode',
    advancedActions: this.facade.isPtBr()
      ? 'Acoes dos recursos avancados'
      : 'Advanced feature actions',
    scratch: this.facade.isPtBr()
      ? 'Alternar scratch slice'
      : 'Toggle scratch slice',
    child: this.state().childDemoVisible
      ? this.facade.isPtBr()
        ? 'Ocultar core filho'
        : 'Hide child core'
      : this.facade.isPtBr()
        ? 'Mostrar core filho'
        : 'Show child core',
    childTitle: this.facade.isPtBr()
      ? 'Exemplo de projection slice'
      : 'Projection-slice example',
    childSubtitle: this.facade.isPtBr()
      ? 'O child core fica escondido ate voce entrar nos recursos avancados e decidir inspeciona-lo.'
      : 'The child core stays hidden until you enter advanced features and choose to inspect it.',
  }));

  setLearningMode(mode: 'flow' | 'files' | 'advanced'): void {
    this.facade.setLearningMode(mode);
  }

  toggleLang(): void {
    this.facade.toggleLang();
  }

  reset(): void {
    this.facade.reset();
  }

  toggleDevtools(): void {
    this.facade.toggleDevtools();
  }

  toggleScratchSlice(): void {
    this.facade.toggleScratchSlice();
  }

  toggleChildDemo(): void {
    this.facade.toggleChildDemo();
  }
}
