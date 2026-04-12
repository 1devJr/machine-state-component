import { EngineState } from '@machine-state-component/ui-state';

export type LiveDocsChildDemoStatus = 'idle' | 'ready';

export interface LiveDocsChildDemoState
  extends EngineState<LiveDocsChildDemoStatus> {
  eventCount: number;
  lastEventType: string | null;
  notes: string[];
}

export function createLiveDocsChildDemoInitialState(): LiveDocsChildDemoState {
  return {
    status: 'idle',
    eventCount: 0,
    lastEventType: null,
    notes: [],
  };
}
