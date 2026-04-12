import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { EngineSlotDirective } from '@machine-state-component/ui-state';
import { LiveDocsChildDemoComponent } from './child-demo/live-docs-child-demo.component';
import { LiveDocsFacadeService } from './facade/live-docs-facade.service';
import { LiveDocsTask, LiveDocsTaskStatus } from './store/live-docs.types';

export type LiveDocsSectionId =
  | 'overview'
  | 'actions'
  | 'transitions'
  | 'effects'
  | 'selections'
  | 'facade'
  | 'pluggables'
  | 'composition'
  | 'testing'
  | 'devtools';

interface LiveDocsTimelineMarkerTone {
  id: string;
  color: string;
  ptBr: string;
  en: string;
}

const LIVE_DOCS_TIMELINE_MARKER_TONES: LiveDocsTimelineMarkerTone[] = [
  {
    id: 'graphite',
    color: '#111827',
    ptBr: 'Grafite',
    en: 'Graphite',
  },
  {
    id: 'cobalt',
    color: '#2563eb',
    ptBr: 'Cobalto',
    en: 'Cobalt',
  },
  {
    id: 'emerald',
    color: '#059669',
    ptBr: 'Esmeralda',
    en: 'Emerald',
  },
  {
    id: 'amber',
    color: '#d97706',
    ptBr: 'Ambara',
    en: 'Amber',
  },
  {
    id: 'berry',
    color: '#be185d',
    ptBr: 'Framboesa',
    en: 'Berry',
  },
];

type LiveDocsTimelineKind = 'action' | 'transition' | 'effect' | 'selection';

@Component({
  selector: 'app-live-docs-example',
  standalone: true,
  imports: [EngineSlotDirective, LiveDocsChildDemoComponent],
  templateUrl: './live-docs-example.component.html',
  styleUrl: './live-docs-example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveDocsExampleComponent {
  readonly section = input<LiveDocsSectionId>('overview');
  readonly facade = inject(LiveDocsFacadeService);
  readonly timelineMarkerPaletteEntryId = signal<string | null>(null);
  readonly timelineMarkers = signal<Record<string, string>>({});

  readonly state = this.facade.state;
  readonly selections = this.facade.selections;
  readonly runtime = this.facade.runtimeSummary;
  readonly timeline = this.facade.eventTimeline;
  readonly isPtBr = computed(() => this.state().lang === 'pt-br');
  readonly filteredTimeline = computed(() => {
    const section = this.section();
    const timeline = this.timeline();
    const kindMap: Partial<Record<LiveDocsSectionId, LiveDocsTimelineKind>> = {
      actions: 'action',
      transitions: 'transition',
      effects: 'effect',
      selections: 'selection',
    };
    const selectedKind = kindMap[section];

    if (!selectedKind) {
      return timeline;
    }

    return timeline.filter((entry) => entry.kind === selectedKind);
  });
  readonly showComposition = computed(() => this.section() === 'composition');
  readonly showDevtoolsHint = computed(() => this.section() === 'devtools');
  readonly showPluggableShowcase = computed(
    () => this.section() === 'pluggables',
  );
  readonly timelineMarkerOptions = computed(() =>
    LIVE_DOCS_TIMELINE_MARKER_TONES.map((tone) => ({
      ...tone,
      label: this.isPtBr() ? tone.ptBr : tone.en,
    })),
  );
  readonly copy = computed(() => ({
    title: this.isPtBr() ? 'Task Manager Example' : 'Task Manager Example',
    subtitle: this.isPtBr()
      ? 'Um exemplo pequeno, mas completo: facade, actions, transitions, effects, selections, pluggable e child core.'
      : 'A small but complete example: facade, actions, transitions, effects, selections, pluggable and child core.',
    draftLabel: this.isPtBr() ? 'Nova tarefa' : 'New task',
    draftPlaceholder: this.isPtBr()
      ? 'Ex.: explicar o artifact da engine'
      : 'Example: explain the engine artifact',
    saveLabel:
      this.state().status === 'saving'
        ? this.isPtBr()
          ? 'Salvando...'
          : 'Saving...'
        : this.isPtBr()
          ? 'Salvar tarefa'
          : 'Save task',
    filters: {
      all: this.isPtBr() ? 'Todas' : 'All',
      open: this.isPtBr() ? 'Abertas' : 'Open',
      done: this.isPtBr() ? 'Concluidas' : 'Done',
    },
    timeline: this.isPtBr() ? 'Timeline do runtime' : 'Runtime timeline',
    timelineEmpty: this.isPtBr()
      ? 'Ainda nao ha eventos deste tipo no historico.'
      : 'There are no events of this type in the history yet.',
    runtime: this.isPtBr() ? 'Resumo do runtime' : 'Runtime summary',
    tasks: this.isPtBr()
      ? 'Lista derivada pelas selections'
      : 'Selection-derived task list',
    status: 'Status',
    lastAction: this.isPtBr() ? 'Ultima action' : 'Last action',
    lastTransition: this.isPtBr() ? 'Ultima transition' : 'Last transition',
    filter: this.isPtBr() ? 'Filtro atual' : 'Current filter',
    feedback: this.isPtBr() ? 'Mensagem do fluxo' : 'Flow message',
    projection: this.isPtBr()
      ? 'Projection slice do filho'
      : 'Child projection slice',
    empty: this.isPtBr()
      ? 'Nenhuma tarefa corresponde ao filtro atual.'
      : 'No task matches the current filter.',
    noAction: this.isPtBr() ? 'nenhuma ainda' : 'none yet',
    statusLabels: {
      open: this.isPtBr() ? 'Em aberto' : 'Open',
      done: this.isPtBr() ? 'Concluida' : 'Done',
      deleted: this.isPtBr() ? 'Excluida' : 'Deleted',
    } satisfies Record<LiveDocsTaskStatus, string>,
    delete: this.isPtBr() ? 'Excluir' : 'Delete',
    deletedCount: this.isPtBr() ? 'Excluidas' : 'Deleted',
    actionKind: this.isPtBr() ? 'action' : 'action',
    transitionKind: this.isPtBr() ? 'transition' : 'transition',
    effectKind: this.isPtBr() ? 'effect' : 'effect',
    selectionKind: this.isPtBr() ? 'selection' : 'selection',
    timelineScope: {
      overview: this.isPtBr()
        ? 'Mostrando o fluxo completo.'
        : 'Showing the full flow.',
      actions: this.isPtBr()
        ? 'Mostrando somente actions.'
        : 'Showing only actions.',
      transitions: this.isPtBr()
        ? 'Mostrando somente transitions.'
        : 'Showing only transitions.',
      effects: this.isPtBr()
        ? 'Mostrando somente effects.'
        : 'Showing only effects.',
      selections: this.isPtBr()
        ? 'Mostrando somente selections.'
        : 'Showing only selections.',
      facade: this.isPtBr()
        ? 'Mostrando o fluxo completo.'
        : 'Showing the full flow.',
      pluggables: this.isPtBr()
        ? 'Mostrando o fluxo completo.'
        : 'Showing the full flow.',
      composition: this.isPtBr()
        ? 'Mostrando o fluxo completo.'
        : 'Showing the full flow.',
      testing: this.isPtBr()
        ? 'Mostrando o fluxo completo.'
        : 'Showing the full flow.',
      devtools: this.isPtBr()
        ? 'Mostrando o fluxo completo.'
        : 'Showing the full flow.',
    } satisfies Record<LiveDocsSectionId, string>,
    addMarker: this.isPtBr() ? 'Criar marcador' : 'Create marker',
    changeMarker: this.isPtBr() ? 'Alterar marcador' : 'Change marker',
    clearMarker: this.isPtBr() ? 'Remover marcador' : 'Remove marker',
    markerPickerTitle: this.isPtBr()
      ? 'Escolha a cor do marcador'
      : 'Choose the marker color',
    compositionTitle: this.isPtBr()
      ? 'Mini exemplo de composicao'
      : 'Composition mini example',
    compositionText: this.isPtBr()
      ? 'Quando o pai dispara `requestSave`, o child core recebe uma action ligada e o pai guarda apenas uma projection slice resumida.'
      : 'When the parent dispatches `requestSave`, the child core receives a linked action and the parent keeps only a compact projection slice.',
    devtoolsHint: this.isPtBr()
      ? 'Abra o overlay para ver o mesmo fluxo com historico completo, snapshots e effects reais.'
      : 'Open the overlay to inspect the same flow with full history, snapshots and real effects.',
    panels: {
      interactionTitle: this.isPtBr()
        ? '1. Interaja com a interface'
        : '1. Interact with the interface',
      interactionText: this.isPtBr()
        ? 'Escreva uma tarefa e dispare actions reais a partir da UI.'
        : 'Type a task and dispatch real actions from the UI.',
      derivedTitle: this.isPtBr()
        ? '2. Veja o que a store entrega'
        : '2. Read what the store returns',
      derivedText: this.isPtBr()
        ? 'Observe a lista derivada pelas selections e o resumo do runtime lado a lado.'
        : 'Inspect the selection-derived list and the runtime summary side by side.',
      timelineTitle: this.isPtBr()
        ? '3. Leia o historico do runtime'
        : '3. Read the runtime history',
      timelineText: this.isPtBr()
        ? 'A timeline mostra a ordem em que os eventos realmente chegaram na engine.'
        : 'The timeline shows the order in which events actually reached the engine.',
    },
  }));

  updateDraft(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.facade.updateDraftTitle(input.value);
  }

  saveTask(event?: Event, draftTitle?: string): void {
    event?.preventDefault();
    this.facade.saveTask(draftTitle);
  }

  deleteTask(id: string): void {
    this.facade.deleteTask(id);
  }

  isTaskDone(task: LiveDocsTask): boolean {
    return task.status === 'done';
  }

  isTaskDeleted(task: LiveDocsTask): boolean {
    return task.status === 'deleted';
  }

  taskStatusLabel(status: LiveDocsTaskStatus): string {
    return this.copy().statusLabels[status];
  }

  timelineKindLabel(kind: string): string {
    const labels = {
      action: this.copy().actionKind,
      transition: this.copy().transitionKind,
      effect: this.copy().effectKind,
      selection: this.copy().selectionKind,
    } as const;

    return labels[kind as keyof typeof labels] ?? kind;
  }

  toggleTimelineMarkerPalette(entryId: string): void {
    this.timelineMarkerPaletteEntryId.update((currentEntryId) =>
      currentEntryId === entryId ? null : entryId,
    );
  }

  isTimelineMarkerPaletteOpen(entryId: string): boolean {
    return this.timelineMarkerPaletteEntryId() === entryId;
  }

  hasTimelineMarker(entryId: string): boolean {
    return this.timelineMarkers()[entryId] !== undefined;
  }

  setTimelineMarker(entryId: string, toneId: string): void {
    this.timelineMarkers.update((markers) => ({
      ...markers,
      [entryId]: toneId,
    }));
    this.timelineMarkerPaletteEntryId.set(null);
  }

  clearTimelineMarker(entryId: string): void {
    this.timelineMarkers.update((markers) => {
      const nextMarkers = { ...markers };
      delete nextMarkers[entryId];
      return nextMarkers;
    });
    this.timelineMarkerPaletteEntryId.set(null);
  }

  timelineMarkerColor(entryId: string): string {
    const toneId = this.timelineMarkers()[entryId];
    return this.#findTimelineMarkerTone(toneId)?.color ?? '#cbd5e1';
  }

  timelineMarkerLabel(toneId: string): string {
    const tone = this.#findTimelineMarkerTone(toneId);
    if (!tone) {
      return '';
    }

    return this.isPtBr() ? tone.ptBr : tone.en;
  }

  #findTimelineMarkerTone(
    toneId: string | undefined,
  ): LiveDocsTimelineMarkerTone | undefined {
    return LIVE_DOCS_TIMELINE_MARKER_TONES.find((tone) => tone.id === toneId);
  }
}
