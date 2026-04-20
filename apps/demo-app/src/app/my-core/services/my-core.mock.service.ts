import { Injectable } from '@angular/core';
import { MyCoreDocLang } from '../store/my-core.types';

@Injectable({
  providedIn: 'root',
})
export class MyCoreMockService {
  wait(durationMs = 220): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, durationMs);
    });
  }

  buildCompletionMessage(label: string, lang: MyCoreDocLang): string {
    if (lang === 'pt-br') {
      return `"${label}" foi concluída. O efeito assíncrono despachou uma ação subsequente após a transição.`;
    }

    return `"${label}" completed. The async effect dispatched a follow-up action after the transition.`;
  }

  buildErrorMessage(severity: 'soft' | 'hard', lang: MyCoreDocLang): string {
    if (lang === 'pt-br') {
      if (severity === 'hard') {
        return 'O ramo de erro foi executado: a transição alterou o status primeiro e, depois, o efeito anexou esta explicação detalhada.';
      }

      return 'O ramo de erro leve foi executado: nenhuma escrita adicional aconteceu fora das transições.';
    }

    if (severity === 'hard') {
      return 'The error branch ran: transition changed status first, then the effect appended this detailed explanation.';
    }

    return 'The soft error branch ran: no additional state write happened outside transitions.';
  }
}
