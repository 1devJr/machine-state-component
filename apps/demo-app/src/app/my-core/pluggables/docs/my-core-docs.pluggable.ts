import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { definePluggableStoreArtifacts } from '@machine-state-component/ui-state';
import { PluggableBase } from '../../store/my-core.kernel';
import {
  MyCoreAdvancedFeatureCard,
  MyCoreDocsConfig,
  MyCoreFileRuleCard,
} from '../../store/my-core.types';

@Component({
  selector: 'app-my-core-docs-pluggable',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './my-core-docs.pluggable.html',
  styleUrl: './my-core-docs.pluggable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCoreDocsPluggableComponent extends PluggableBase<MyCoreDocsConfig> {
  static readonly storeArtifacts = definePluggableStoreArtifacts({});

  readonly isPtBr = computed(() => this.state()?.lang === 'pt-br');
  readonly learningMode = computed(() => this.state()?.learningMode ?? 'flow');

  readonly fileRules = computed<MyCoreFileRuleCard[]>(() => {
    const config = this.mergedConfig();
    return this.isPtBr() && config.fileRulesPtBr?.length
      ? config.fileRulesPtBr
      : config.fileRules;
  });

  readonly advancedFeatures = computed<MyCoreAdvancedFeatureCard[]>(() => {
    const config = this.mergedConfig();
    return this.isPtBr() && config.advancedFeaturesPtBr?.length
      ? config.advancedFeaturesPtBr
      : config.advancedFeatures;
  });

  readonly copy = computed(() => ({
    filesTitle: this.isPtBr() ? 'Arquivos e regras' : 'Files and rules',
    filesSubtitle: this.isPtBr()
      ? 'Leia estes quatro arquivos como a fonte principal de verdade do core.'
      : 'Read these four files as the primary source of truth for the core.',
    advancedTitle: this.isPtBr()
      ? 'Recursos avancados'
      : 'Advanced engine features',
    advancedSubtitle: this.isPtBr()
      ? 'Composicao, projection slices, Devtools e reutilizacao aparecem depois que o fluxo basico estiver claro.'
      : 'Composition, projection slices, Devtools and reuse come after the basic flow is clear.',
    purpose: this.isPtBr() ? 'O que entra aqui' : 'What belongs here',
    avoid: this.isPtBr() ? 'O que evitar' : 'What to avoid',
    symbols: this.isPtBr() ? 'Simbolos do exemplo' : 'Example symbols',
    composedSymbols: this.isPtBr()
      ? 'Selections de composicao'
      : 'Composition selections',
    tests: this.isPtBr() ? 'Como testar' : 'How to test',
    note: this.isPtBr() ? 'Por que isso importa' : 'Why this matters',
    codeExample: this.isPtBr() ? 'Exemplo de codigo' : 'Code example',
    openExample: this.isPtBr() ? 'Abrir exemplo' : 'Open example',
  }));

  protected override getDefaultConfig(): MyCoreDocsConfig {
    return {
      fileRules: [],
      advancedFeatures: [],
    };
  }
}
