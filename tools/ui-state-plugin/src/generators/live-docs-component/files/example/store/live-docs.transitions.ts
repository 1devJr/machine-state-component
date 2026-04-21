import { defineKernelTransitions } from '@machine-state-component/ui-state';
import { liveDocsActions, liveDocsActionTypes } from './live-docs.actions';
import {
  createLiveDocsInitialState,
  LiveDocsFilter,
  LiveDocsLang,
  LiveDocsSaveMode,
  LiveDocsState,
} from './live-docs.types';

function t(lang: LiveDocsLang, en: string, ptBr: string): string {
  return lang === 'pt-br' ? ptBr : en;
}

function filterLabel(lang: LiveDocsLang, filter: LiveDocsFilter): string {
  if (lang === 'pt-br') {
    const labels: Record<LiveDocsFilter, string> = {
      all: 'todas',
      open: 'abertas',
      done: 'concluidas',
    };
    return labels[filter];
  }

  const labels: Record<LiveDocsFilter, string> = {
    all: 'all',
    open: 'open',
    done: 'done',
  };
  return labels[filter];
}

function saveModeLabel(lang: LiveDocsLang, mode: LiveDocsSaveMode): string {
  if (lang === 'pt-br') {
    return mode === 'success' ? 'sucesso' : 'erro';
  }

  return mode;
}

function countAction(
  state: LiveDocsState,
  actionType: string,
): Pick<LiveDocsState, 'lastUserActionType'> {
  const derivedActions = new Set<string>([
    liveDocsActionTypes.saveSucceeded,
    liveDocsActionTypes.saveFailed,
  ]);

  return {
    lastUserActionType: derivedActions.has(actionType)
      ? state.lastUserActionType
      : actionType,
  };
}

function applyEventMeta(
  state: LiveDocsState,
  actionType: string,
  label: string,
  changedFields: string[],
): Pick<
  LiveDocsState,
  'lastUserActionType' | 'lastTransitionLabel' | 'lastChangedFields'
> {
  return {
    ...countAction(state, actionType),
    lastTransitionLabel: label,
    lastChangedFields: changedFields,
  };
}

function taskChangedMessage(lang: LiveDocsLang): string {
  return t(
    lang,
    'The task status changed with a pure synchronous transition.',
    'O status da tarefa mudou com uma transition pura e sincronica.',
  );
}

export function createLiveDocsTransitions() {
  return defineKernelTransitions<LiveDocsState>()(
    liveDocsActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.changeDraftTitle, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            liveDocsActionTypes.changeDraftTitle,
            t(
              state.lang,
              'The draft title changed before any state mutation was persisted.',
              'O titulo do rascunho mudou antes de qualquer persistencia.',
            ),
            ['draftTitle', 'feedbackMessage', 'errorMessage'],
          ),
          status: state.status === 'saving' ? state.status : 'ready',
          draftTitle: event.title,
          feedbackMessage: t(
            state.lang,
            'Draft updated. The facade only described the intent; the transition wrote the state.',
            'Rascunho atualizado. A facade descreveu a intencao; a transition escreveu o estado.',
          ),
          errorMessage: null,
        }))
        .globalOn(actions.setFilter, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            liveDocsActionTypes.setFilter,
            t(
              state.lang,
              `The filter moved to ${filterLabel(state.lang, event.filter)}.`,
              `O filtro mudou para ${filterLabel(state.lang, event.filter)}.`,
            ),
            ['filter', 'feedbackMessage'],
          ),
          filter: event.filter,
          feedbackMessage: t(
            state.lang,
            'Selections will now derive a different task list from the same store.',
            'As selections agora vao derivar outra lista a partir da mesma store.',
          ),
        }))
        .globalOn(actions.setNextSaveMode, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            liveDocsActionTypes.setNextSaveMode,
            t(
              state.lang,
              `The next save mode is now ${saveModeLabel(state.lang, event.mode)}.`,
              `O proximo modo de salvamento agora e ${saveModeLabel(state.lang, event.mode)}.`,
            ),
            ['nextSaveMode', 'feedbackMessage'],
          ),
          nextSaveMode: event.mode,
          feedbackMessage: t(
            state.lang,
            `The shared pluggable keeps the same UI; only the next intent changed to ${saveModeLabel(state.lang, event.mode)}.`,
            `O pluggable compartilhado continua igual; so a proxima intencao mudou para ${saveModeLabel(state.lang, event.mode)}.`,
          ),
        }))
        .globalOn(actions.requestSave, (state) => ({
          ...state,
          ...applyEventMeta(
            state,
            liveDocsActionTypes.requestSave,
            t(
              state.lang,
              'The save transition moved the example into saving while the effect runs.',
              'A transition de salvamento colocou o exemplo em saving enquanto o effect roda.',
            ),
            ['status', 'feedbackMessage', 'errorMessage'],
          ),
          status: 'saving',
          feedbackMessage: t(
            state.lang,
            'The effect is now simulating an async persistence step.',
            'O effect agora esta simulando uma persistencia assincrona.',
          ),
          errorMessage: null,
        }))
        .globalOn(actions.saveSucceeded, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            liveDocsActionTypes.saveSucceeded,
            t(
              state.lang,
              'The follow-up transition completed the happy path and appended the new task.',
              'A transition derivada concluiu o caminho feliz e anexou a nova tarefa.',
            ),
            [
              'status',
              'tasks',
              'draftTitle',
              'lastSavedTaskTitle',
              'feedbackMessage',
            ],
          ),
          status: 'ready',
          draftTitle: '',
          tasks: [event.task, ...state.tasks],
          lastSavedTaskTitle: event.task.title,
          feedbackMessage: event.message,
          errorMessage: null,
        }))
        .globalOn(actions.saveFailed, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            liveDocsActionTypes.saveFailed,
            t(
              state.lang,
              'The error branch was still completed by a transition, not by the effect itself.',
              'O ramo de erro tambem foi concluido por uma transition, nao pelo effect diretamente.',
            ),
            ['status', 'errorMessage', 'feedbackMessage'],
          ),
          status: 'error',
          feedbackMessage: event.message,
          errorMessage: event.message,
        }))
        .globalOn(actions.toggleTask, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            liveDocsActionTypes.toggleTask,
            taskChangedMessage(state.lang),
            ['tasks', 'feedbackMessage'],
          ),
          status: 'ready',
          tasks: state.tasks.map((task) =>
            task.id === event.id && task.status !== 'deleted'
              ? {
                  ...task,
                  status: task.status === 'done' ? 'open' : 'done',
                }
              : task,
          ),
          feedbackMessage: t(
            state.lang,
            'No effect was needed here because the state change is local and predictable.',
            'Nenhum effect foi necessario aqui porque a mudanca e local e previsivel.',
          ),
          errorMessage: null,
        }))
        .globalOn(actions.deleteTask, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            liveDocsActionTypes.deleteTask,
            t(
              state.lang,
              'The delete branch marked the task as deleted without leaving the transition layer.',
              'O ramo de exclusao marcou a tarefa como excluida sem sair da camada de transitions.',
            ),
            ['tasks', 'feedbackMessage'],
          ),
          status: 'ready',
          tasks: state.tasks.map((task) =>
            task.id === event.id ? { ...task, status: 'deleted' } : task,
          ),
          feedbackMessage: t(
            state.lang,
            'A task was marked as deleted and the selections recalculated the visible list.',
            'Uma tarefa foi marcada como excluida e as selections recalcularam a lista visivel.',
          ),
          errorMessage: null,
        }))
        .globalOn(actions.setLang, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            liveDocsActionTypes.setLang,
            t(
              event.lang,
              'Documentation language switched to English.',
              'O idioma da documentacao voltou para PT-BR.',
            ),
            ['lang', 'feedbackMessage'],
          ),
          lang: event.lang,
          feedbackMessage: t(
            event.lang,
            'The same runtime is now being explained in English.',
            'O mesmo runtime agora esta sendo explicado em PT-BR.',
          ),
          errorMessage: null,
        }))
        .globalOn(actions.reset, (state) =>
          createLiveDocsInitialState(state.lang),
        )
        .done(),
  );
}
