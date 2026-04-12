import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MyCoreChildDemo } from './my-core-child-demo.artifact';
import { MyCoreDocLang } from '../store/my-core.types';

@Component({
  selector: 'app-my-core-child-demo',
  standalone: true,
  templateUrl: './my-core-child-demo.component.html',
  styleUrl: './my-core-child-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCoreChildDemoComponent {
  readonly core = input.required<MyCoreChildDemo>();
  readonly lang = input<MyCoreDocLang>('pt-br');

  readonly state = computed(() => this.core().facade.state());
  readonly isPtBr = computed(() => this.lang() === 'pt-br');
  readonly copy = computed(() => ({
    title: this.isPtBr() ? 'Demonstração do core filho' : 'Child Core Demo',
    subtitle: this.isPtBr()
      ? 'Recebe uma action vinculada do pai e expõe uma projeção reduzida.'
      : 'Receives a linked parent action and exposes a reduced projection.',
    clear: this.isPtBr() ? 'Limpar estado do filho' : 'Clear child state',
    status: this.isPtBr() ? 'Status' : 'Status',
    eventCount: this.isPtBr() ? 'Contagem de eventos' : 'Event count',
    lastEvent: this.isPtBr() ? 'Último evento' : 'Last event',
    notes: this.isPtBr() ? 'Notas recentes' : 'Recent notes',
    empty: this.isPtBr()
      ? 'Nenhum evento vinculado foi recebido ainda.'
      : 'No linked events received yet.',
    none: this.isPtBr() ? 'nenhum' : 'none',
  }));

  clear(): void {
    this.core().actions.clear();
  }
}
