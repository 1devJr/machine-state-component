export type EngineDevtoolsOverlaySide = 'left' | 'right';

export interface EngineDevtoolsOverlayListItem {
  title: string;
  subtitle?: string;
  meta?: string;
  details?: unknown;
}

export type EngineDevtoolsOverlaySection =
  | {
      id: string;
      title: string;
      kind: 'list';
      items: EngineDevtoolsOverlayListItem[];
    }
  | {
      id: string;
      title: string;
      kind: 'json';
      value: unknown;
    };

export interface EngineDevtoolsOverlayPayload {
  title: string;
  subtitle?: string;
  sections: EngineDevtoolsOverlaySection[];
}
