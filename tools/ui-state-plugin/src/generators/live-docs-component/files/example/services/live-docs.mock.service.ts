import { Injectable } from '@angular/core';
import {
  LiveDocsLang,
  LiveDocsSaveMode,
  LiveDocsTask,
} from '../store/live-docs.types';

@Injectable()
export class LiveDocsMockService {
  #sequence = 100;

  async persistTask(
    title: string,
    mode: LiveDocsSaveMode,
    lang: LiveDocsLang,
  ): Promise<LiveDocsTask> {
    await this.wait(320);

    if (mode === 'error') {
      throw new Error(this.buildErrorMessage(lang));
    }

    this.#sequence += 1;

    return {
      id: `task-${this.#sequence}`,
      title,
      status: 'open',
    };
  }

  buildSuccessMessage(title: string, lang: LiveDocsLang): string {
    return lang === 'pt-br'
      ? `A tarefa "${title}" foi adicionada depois que o effect concluiu.`
      : `The task "${title}" was added after the effect completed.`;
  }

  buildErrorMessage(lang: LiveDocsLang): string {
    return lang === 'pt-br'
      ? 'O effect simulou uma falha e retornou uma action de erro.'
      : 'The effect simulated a failure and dispatched an error action.';
  }

  buildBlankDraftMessage(lang: LiveDocsLang): string {
    return lang === 'pt-br'
      ? 'Escreva um titulo antes de salvar a tarefa.'
      : 'Type a title before saving the task.';
  }

  async wait(durationMs = 220): Promise<void> {
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, durationMs);
    });
  }
}
