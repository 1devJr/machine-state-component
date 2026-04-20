import { EngineState } from '@machine-state-component/ui-state';

export type MyCoreStatus = 'idle' | 'loading' | 'ready' | 'error';
export type MyCoreLearningMode = 'flow' | 'files' | 'advanced';
export type MyCoreDocLang = 'pt-br' | 'en';

export interface MyCoreTimelineEntry {
  id: number;
  type: string;
  summary: string;
}

export interface MyCoreActionCountEntry {
  type: string;
  count: number;
}

export interface MyCoreFileRuleCard {
  id: string;
  fileName: string;
  title: string;
  purpose: string;
  belongs: string[];
  avoid: string[];
  symbols: string[];
  composedSymbols?: string[];
  testIdeas: string[];
  note?: string;
}

export interface MyCoreAdvancedFeatureLink {
  label: string;
  to: string;
}

export interface MyCoreAdvancedFeatureCard {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  codeExample?: string;
  links?: MyCoreAdvancedFeatureLink[];
  note?: string;
}

export interface MyCoreControlsConfig {
  title: string;
  subtitle: string;
  successLabel: string;
  errorLabel: string;
  resetLabel: string;
}

export interface MyCoreFlowSummary {
  action: string;
  transition: string;
  effect: string;
  changedFields: string[];
  message: string;
}

export interface MyCoreDiagnosticsConfig {
  getEventTimeline: () => readonly MyCoreTimelineEntry[];
  getStateSnapshot: () => Record<string, unknown>;
  getSelectionSnapshot: () => Record<string, unknown>;
  getSliceKeys: () => readonly string[];
  getEffects: () => ReadonlyArray<{
    id: string;
    event: string;
    priority: number;
  }>;
  getFlowSummary: () => MyCoreFlowSummary;
}

export interface MyCoreDocsConfig {
  fileRules: MyCoreFileRuleCard[];
  fileRulesPtBr?: MyCoreFileRuleCard[];
  advancedFeatures: MyCoreAdvancedFeatureCard[];
  advancedFeaturesPtBr?: MyCoreAdvancedFeatureCard[];
}

export interface MyCoreRuntimeBridge {
  toggleScratchSlice: () => void;
}

export interface MyCoreServices {
  [key: string]: unknown;
  demoApi: {
    wait: (durationMs?: number) => Promise<void>;
    buildCompletionMessage: (label: string, lang: MyCoreDocLang) => string;
    buildErrorMessage: (
      severity: 'soft' | 'hard',
      lang: MyCoreDocLang,
    ) => string;
  };
  runtimeBridge: MyCoreRuntimeBridge;
}

export interface MyCoreState extends EngineState<MyCoreStatus> {
  lang: MyCoreDocLang;
  learningMode: MyCoreLearningMode;
  showRawRuntimeData: boolean;
  lastUserActionType: string | null;
  lastDispatchedType: string | null;
  lastTransitionLabel: string;
  lastChangedFields: string[];
  actionCountByType: Record<string, number>;
  diagnosticMessage: string;
  childDemoVisible: boolean;
  scratchSliceMounted: boolean;
}

export function getMyCoreInitialDiagnosticMessage(lang: MyCoreDocLang): string {
  return lang === 'pt-br'
    ? 'Dispare uma acao e acompanhe como transition, effect e selections reagem em sequencia.'
    : 'Dispatch an action and watch how transition, effect and selections react in sequence.';
}

export function createMyCoreInitialState(
  lang: MyCoreDocLang = 'pt-br',
): MyCoreState {
  return {
    status: 'idle',
    lang,
    learningMode: 'flow',
    showRawRuntimeData: false,
    lastUserActionType: null,
    lastDispatchedType: null,
    lastTransitionLabel:
      lang === 'pt-br' ? 'Estado inicial do core.' : 'Initial core state.',
    lastChangedFields: [],
    actionCountByType: {},
    diagnosticMessage: getMyCoreInitialDiagnosticMessage(lang),
    childDemoVisible: false,
    scratchSliceMounted: false,
  };
}
