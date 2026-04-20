import { EngineState } from '@machine-state-component/ui-state';

export type MyCoreChildDemoStatus = 'idle' | 'ready';

export interface MyCoreChildDemoState
  extends EngineState<MyCoreChildDemoStatus> {
  eventCount: number;
  lastEventType: string | null;
  notes: string[];
}

export function createMyCoreChildDemoInitialState(): MyCoreChildDemoState {
  return {
    status: 'idle',
    eventCount: 0,
    lastEventType: null,
    notes: [],
  };
}
