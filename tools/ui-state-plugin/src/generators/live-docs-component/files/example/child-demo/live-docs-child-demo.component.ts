import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { LiveDocsLang } from '../store/live-docs.types';
import { LiveDocsChildDemo } from './live-docs-child-demo.artifact';

@Component({
  selector: 'app-live-docs-child-demo',
  standalone: true,
  templateUrl: './live-docs-child-demo.component.html',
  styleUrl: './live-docs-child-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveDocsChildDemoComponent {
  readonly core = input.required<LiveDocsChildDemo>();
  readonly lang = input<LiveDocsLang>('pt-br');

  readonly state = computed(() => this.core().facade.state());
  readonly isPtBr = computed(() => this.lang() === 'pt-br');
  readonly copy = computed(() => ({
    title: this.isPtBr() ? 'Child core de historico' : 'History child core',
    subtitle: this.isPtBr()
      ? 'Recebe uma action ligada pelo pai e devolve uma projection slice resumida.'
      : 'It receives a linked parent action and returns a compact projection slice.',
    clear: this.isPtBr() ? 'Limpar filho' : 'Clear child core',
    status: 'Status',
    eventCount: this.isPtBr() ? 'Eventos recebidos' : 'Received events',
    lastEvent: this.isPtBr() ? 'Ultimo evento' : 'Last event',
    notes: this.isPtBr() ? 'Notas recentes' : 'Recent notes',
    empty: this.isPtBr()
      ? 'Nenhuma action do pai chegou aqui ainda.'
      : 'No parent action has been mirrored here yet.',
    none: this.isPtBr() ? 'nenhum' : 'none',
  }));

  clear(): void {
    this.core().actions.clear();
  }
}
