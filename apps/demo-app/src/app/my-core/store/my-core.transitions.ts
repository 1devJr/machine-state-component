import { defineKernelTransitions } from '@machine-state-component/ui-state';
import { myCoreActions, myCoreActionTypes } from './my-core.actions';
import {
  createMyCoreInitialState,
  MyCoreDocLang,
  MyCoreLearningMode,
  MyCoreState,
} from './my-core.types';

function t(lang: MyCoreDocLang, en: string, ptBr: string): string {
  return lang === 'pt-br' ? ptBr : en;
}

function nextLang(current: MyCoreDocLang): MyCoreDocLang {
  return current === 'pt-br' ? 'en' : 'pt-br';
}

function countAction(
  state: MyCoreState,
  actionType: string,
): Record<string, number> {
  return {
    ...state.actionCountByType,
    [actionType]: (state.actionCountByType[actionType] ?? 0) + 1,
  };
}

function isUserAction(actionType: string): boolean {
  return ![
    myCoreActionTypes.demoCompleted,
    myCoreActionTypes.setDiagnosticMessage,
  ].includes(actionType as never);
}

function applyEventMeta(
  state: MyCoreState,
  actionType: string,
  label: string,
  changedFields: string[],
): Pick<
  MyCoreState,
  | 'lastUserActionType'
  | 'lastDispatchedType'
  | 'lastTransitionLabel'
  | 'lastChangedFields'
  | 'actionCountByType'
> {
  return {
    lastUserActionType: isUserAction(actionType)
      ? actionType
      : state.lastUserActionType,
    lastDispatchedType: actionType,
    lastTransitionLabel: label,
    lastChangedFields: changedFields,
    actionCountByType: countAction(state, actionType),
  };
}

function learningModeLabel(
  lang: MyCoreDocLang,
  mode: MyCoreLearningMode,
): string {
  if (lang === 'pt-br') {
    const map: Record<MyCoreLearningMode, string> = {
      flow: 'Fluxo do Core',
      files: 'Arquivos e Regras',
      advanced: 'Recursos Avancados',
    };
    return map[mode];
  }

  const map: Record<MyCoreLearningMode, string> = {
    flow: 'Core Flow',
    files: 'Files and Rules',
    advanced: 'Advanced Features',
  };
  return map[mode];
}

export function createMyCoreTransitions() {
  return defineKernelTransitions<MyCoreState>()(
    myCoreActions,
    ({ chain, actions }) =>
      chain()
        .globalOn(actions.setLearningMode, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            myCoreActionTypes.setLearningMode,
            t(
              state.lang,
              `Changed the learning mode to ${learningModeLabel(state.lang, event.mode)}.`,
              `Mudou o modo de aprendizado para ${learningModeLabel(state.lang, event.mode)}.`,
            ),
            ['learningMode'],
          ),
          learningMode: event.mode,
        }))
        .globalOn(actions.runDemoAction, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            myCoreActionTypes.runDemoAction,
            t(
              state.lang,
              'The success transition put the core into loading.',
              'A transicao de sucesso colocou o core em loading.',
            ),
            ['status', 'diagnosticMessage'],
          ),
          status: 'loading',
          diagnosticMessage: t(
            state.lang,
            `Queued "${event.label}" and now waiting for the async effect.`,
            `Enfileirou "${event.label}" e agora esta aguardando o effect assincrono.`,
          ),
        }))
        .globalOn(actions.demoCompleted, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            myCoreActionTypes.demoCompleted,
            t(
              state.lang,
              'The follow-up transition completed the happy path.',
              'A transicao derivada concluiu o caminho feliz.',
            ),
            ['status', 'diagnosticMessage'],
          ),
          status: 'ready',
          diagnosticMessage: event.message,
        }))
        .globalOn(actions.simulateError, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            myCoreActionTypes.simulateError,
            t(
              state.lang,
              'The error transition moved the core into error.',
              'A transicao de erro moveu o core para error.',
            ),
            ['status', 'diagnosticMessage'],
          ),
          status: 'error',
          diagnosticMessage: t(
            state.lang,
            `Triggered the ${event.severity} error branch.`,
            `Disparou o ramo de erro ${event.severity}.`,
          ),
        }))
        .globalOn(actions.toggleScratchSlice, (state) => ({
          ...state,
          ...applyEventMeta(
            state,
            myCoreActionTypes.toggleScratchSlice,
            t(
              state.lang,
              'Toggled a runtime-managed scratch slice.',
              'Alternou um scratch slice gerenciado em runtime.',
            ),
            ['scratchSliceMounted'],
          ),
          scratchSliceMounted: !state.scratchSliceMounted,
        }))
        .globalOn(actions.toggleChildDemo, (state) => ({
          ...state,
          ...applyEventMeta(
            state,
            myCoreActionTypes.toggleChildDemo,
            t(
              state.lang,
              'Toggled the child-core example visibility.',
              'Alternou a visibilidade do exemplo de core filho.',
            ),
            ['childDemoVisible'],
          ),
          childDemoVisible: !state.childDemoVisible,
        }))
        .globalOn(actions.toggleRawRuntimeData, (state) => ({
          ...state,
          ...applyEventMeta(
            state,
            myCoreActionTypes.toggleRawRuntimeData,
            t(
              state.lang,
              'Toggled the raw runtime data section.',
              'Alternou a secao de dados brutos do runtime.',
            ),
            ['showRawRuntimeData'],
          ),
          showRawRuntimeData: !state.showRawRuntimeData,
        }))
        .globalOn(actions.setDiagnosticMessage, (state, event) => ({
          ...state,
          ...applyEventMeta(
            state,
            myCoreActionTypes.setDiagnosticMessage,
            t(
              state.lang,
              'A follow-up effect enriched the diagnostic message.',
              'Um effect subsequente enriqueceu a mensagem de diagnostico.',
            ),
            ['diagnosticMessage'],
          ),
          diagnosticMessage: event.message,
        }))
        .globalOn(actions.toggleLang, (state) => {
          const lang = nextLang(state.lang);

          return {
            ...state,
            ...applyEventMeta(
              state,
              myCoreActionTypes.toggleLang,
              t(
                lang,
                'Documentation language switched to English.',
                'O idioma da documentacao mudou para PT-BR.',
              ),
              ['lang', 'diagnosticMessage'],
            ),
            lang,
            diagnosticMessage: t(
              lang,
              'Language changed. The same runtime is now being explained in English.',
              'Idioma alterado. O mesmo runtime agora esta sendo explicado em PT-BR.',
            ),
          };
        })
        .globalOn(actions.reset, (state) =>
          createMyCoreInitialState(state.lang),
        )
        .done(),
  );
}
