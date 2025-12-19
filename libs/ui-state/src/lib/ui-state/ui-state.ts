import { UpperCasePipe } from '@angular/common';
import { Component, Signal, computed, signal } from '@angular/core';
import { ZardUiImports } from '@zardui/angular';

type StateStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error'
  | 'confirming'
  | 'mutating';

type MachineState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; tasks: Task[] }
  | { status: 'error'; message: string }
  | { status: 'confirming'; task: Task }
  | { status: 'mutating'; task: Task };

export interface Task {
  id: number;
  title: string;
  owner: string;
  priority: 'low' | 'medium' | 'high';
}

function delay<T>(value: T, ms = 750) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
}

@Component({
  selector: 'ui-state-panel',
  standalone: true,
  imports: [UpperCasePipe, ...ZardUiImports],
  templateUrl: './ui-state.html',
  styleUrl: './ui-state.scss',
})
export class UiStatePanel {
  protected readonly machine = signal<MachineState>({ status: 'idle' });

  protected readonly current: Signal<StateStatus> = computed(
    () => this.machine().status,
  );

  protected readonly hint: Signal<string> = computed(() => {
    const state = this.machine();
    if (state.status === 'loading') return 'Carregando tarefas simuladas...';
    if (state.status === 'ready')
      return `${state.tasks.length} tarefas carregadas.`;
    if (state.status === 'error') return state.message;
    if (state.status === 'confirming')
      return `Confirme a ação para "${state.task.title}".`;
    if (state.status === 'mutating')
      return `Executando ação para "${state.task.title}"...`;
    return 'Clique em "Carregar" para iniciar.';
  });

  protected readonly tasks: Signal<Task[]> = computed(() => {
    const state = this.machine();
    return state.status === 'ready' ? state.tasks : [];
  });

  protected readonly pendingTask: Signal<Task | null> = computed(() => {
    const state = this.machine();
    if (state.status === 'confirming' || state.status === 'mutating') {
      return state.task;
    }
    return null;
  });

  async load() {
    if (this.current() === 'loading') return;
    this.machine.set({ status: 'loading' });
    try {
      const tasks = await delay<Task[]>([
        { id: 1, title: 'Revisar contrato', owner: 'Ana', priority: 'high' },
        {
          id: 2,
          title: 'Enviar relatório semanal',
          owner: 'Rafael',
          priority: 'medium',
        },
        {
          id: 3,
          title: 'Sincronizar pipeline CI',
          owner: 'Camila',
          priority: 'low',
        },
      ]);
      this.machine.set({ status: 'ready', tasks });
    } catch {
      this.machine.set({
        status: 'error',
        message: 'Falha ao carregar tarefas.',
      });
    }
  }

  get taskList(): Task[] {
    return this.tasks();
  }

  get pending(): Task | null {
    return this.pendingTask();
  }

  retry() {
    this.machine.set({ status: 'idle' });
    this.load();
  }

  confirm(task: Task) {
    this.machine.set({ status: 'confirming', task });
  }

  async approve(task: Task) {
    this.machine.set({ status: 'mutating', task });
    await delay(true, 600);
    const next = this.tasks().filter((t) => t.id !== task.id);
    this.machine.set({ status: 'ready', tasks: next });
  }

  reset() {
    this.machine.set({ status: 'idle' });
  }

  protected priorityTone(priority: Task['priority']) {
    if (priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    return 'neutral';
  }
}
