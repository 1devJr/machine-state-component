# Devtools da Engine

## Objetivo

Exibir actions, transitions, effects, selections e snapshot de store sem poluir componente com `console.log`.

## Como funciona

1. `DevtoolsManagerService` faz bind de uma facade.
2. `DevtoolsInspector` normaliza estado/eventos para visualizacao.
3. `DevtoolsOverlayService` injeta painel global no `body`.
4. Painel abre/fecha por toggle e pode permanecer aberto durante interacao da tela.

## Referencias de codigo

- Manager: `libs/ui-state/src/lib/engine/devtools/devtools-manager.service.ts`
- Inspector: `libs/ui-state/src/lib/engine/devtools/devtools-inspector.ts`
- Overlay: `libs/ui-state/src/lib/engine/devtools/devtools-overlay.component.ts`

## Integracao recomendada

1. Manter bind/toggle no facade do core.
2. Componente casca so chama `toggleDevtools()`.
3. Nao implementar devtools por feature; usar apenas o modulo da engine.

## Estado atual

- O modulo existe na engine e suporta multiplas instancias.
- O painel e unico/global, com dados segmentados por `core id`.
- Pode ser evoluido depois para janela separada, sem mudar o contrato de facade.
