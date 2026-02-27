import { EngineDevToolsAPI, EngineDevToolsGlobal } from './devtools.types';

const instances = new Map<string, EngineDevToolsAPI>();

export function registerEngineDevToolsInstance(api: EngineDevToolsAPI): void {
  instances.set(api.instanceId, api);
}

export function unregisterEngineDevToolsInstance(instanceId: string): void {
  instances.delete(instanceId);
}

export function listEngineDevToolsInstances(): string[] {
  return Array.from(instances.keys());
}

export function getEngineDevToolsInstance(
  id: string,
): EngineDevToolsAPI | undefined {
  return instances.get(id);
}

const globalDevTools: EngineDevToolsGlobal = {
  list: () => Array.from(instances.keys()),
  get: (id: string) => instances.get(id),
};

export function setupGlobalEngineDevTools(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const target = window as unknown as { engineDevTools?: EngineDevToolsGlobal };
  if (!target.engineDevTools) {
    target.engineDevTools = globalDevTools;
  }
}
