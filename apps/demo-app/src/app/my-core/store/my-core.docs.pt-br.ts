import { MyCoreAdvancedFeatureCard, MyCoreFileRuleCard } from './my-core.types';

export const myCoreFileRulesPtBr: MyCoreFileRuleCard[] = [
  {
    id: 'actions',
    fileName: 'actions.ts',
    title: 'Catalogo tipado de actions',
    purpose:
      'Declarar os eventos que o core entende e torna-los descobriveis via IntelliSense.',
    belongs: [
      'Nomes das actions e criadores de payload.',
      'A menor API publica para iniciar um comportamento.',
      'Identificadores que o resto do core vai referenciar.',
    ],
    avoid: [
      'Regras de negocio.',
      'Escritas diretas de estado.',
      'Chamadas assincronas ou navegacao.',
    ],
    symbols: [
      'setLearningMode',
      'runDemoAction',
      'simulateError',
      'toggleScratchSlice',
      'toggleLang',
      'reset',
    ],
    testIdeas: [
      'Garantir que o payload esteja correto.',
      'Conferir que os action types nao mudem sem querer.',
    ],
  },
  {
    id: 'transitions',
    fileName: 'transitions.ts',
    title: 'Transitions controlam as escritas',
    purpose:
      'Centralizar toda mutacao de estado atras de transitions explicitas para manter o fluxo legivel.',
    belongs: [
      'Mudancas de status.',
      'Flags como learningMode, showRawRuntimeData e childDemoVisible.',
      'Metadados derivados como lastTransitionLabel e lastChangedFields.',
    ],
    avoid: [
      'Chamadas HTTP e timers.',
      'Navegacao.',
      'Trabalho imperativo entre componentes.',
    ],
    symbols: [
      'setLearningMode',
      'runDemoAction',
      'demoCompleted',
      'simulateError',
      'toggleRawRuntimeData',
      'toggleChildDemo',
      'reset',
    ],
    testIdeas: [
      'Validar a evolucao exata do estado para cada action.',
      'Conferir que o reset preserva o idioma ativo e reinicia o restante.',
    ],
  },
  {
    id: 'effects',
    fileName: 'effects.ts',
    title: 'Effects isolam side effects',
    purpose:
      'Tratar trabalho assincrono e orquestracao de runtime sem mutar o estado diretamente.',
    belongs: [
      'Conclusao assincrona do fluxo feliz.',
      'Enriquecimento da mensagem de erro.',
      'Runtime bridge do scratch slice.',
    ],
    avoid: [
      'Mutacao direta de estado.',
      'Decisoes puramente de UI.',
      'Duplicar a logica das transitions.',
    ],
    symbols: [
      'my-core-run-demo-effect',
      'my-core-simulate-error-effect',
      'my-core-scratch-slice-effect',
    ],
    testIdeas: [
      'Mockar servicos e validar os dispatches derivados.',
      'Garantir que a runtime bridge so seja chamada pelos effects.',
    ],
  },
  {
    id: 'selections',
    fileName: 'selections.ts + artifact.ts',
    title: 'Selections sao read models',
    purpose:
      'Expor valores somente leitura para a UI e separar o que e leitura do kernel do que depende da composicao.',
    belongs: [
      'Selections de kernel para status, learningMode e contadores.',
      'Selections compostas para slices montados e projection slices.',
      'Formatacao de valores para o painel de runtime.',
    ],
    avoid: [
      'Escrita de estado.',
      'Comportamento assincrono.',
      'Esconder leituras de composicao importantes sem explicar que vivem no artifact.',
    ],
    symbols: [
      'currentStatus',
      'lastActionType',
      'actionCountEntries',
      'learningMode',
      'showRawRuntimeData',
    ],
    composedSymbols: [
      'registeredSliceKeys',
      'hasChildProjection',
      'childProjectionSummary',
    ],
    testIdeas: [
      'Tratar selections como read models deterministicos.',
      'Testar kernel selections e composed selections separadamente.',
    ],
    note: 'Esta e uma regra importante do template: kernel selections ficam em selections.ts, enquanto selections que dependem de slot slices ou projection slices vivem no artifact.',
  },
];

export const myCoreAdvancedFeaturesPtBr: MyCoreAdvancedFeatureCard[] = [
  {
    id: 'slices',
    title: 'Slices dinamicos',
    summary:
      'Slot slices e runtime slices deixam o pai compor o estado aos poucos, sem possuir todos os campos desde o inicio.',
    bullets: [
      'controls, diagnostics e docs montam seus proprios slot slices.',
      'scratchpad e montado e desmontado por uma runtime bridge.',
      'O painel de runtime mostra os slices ativos para tornar a composicao visivel.',
    ],
    codeExample:
      "withSlot('controls', ControlsPluggableComponent, config, { sliceInitialState: ... })",
  },
  {
    id: 'child-core',
    title: 'Core filho + projection slice',
    summary:
      'Um child core mantem seu estado isolado e compartilha apenas uma projecao reduzida com o pai.',
    bullets: [
      'O pai conecta runDemoAction com a action recordParentEvent do child.',
      'O child atualiza seu proprio estado interno.',
      'O pai le apenas childDemoProjection, nunca o estado completo do child.',
    ],
    codeExample:
      "withChildCore('childDemo', childDemo.connectionPort).connectChild('childDemo', ...)",
  },
  {
    id: 'devtools',
    title: 'Engine Devtools',
    summary:
      'O overlay do Devtools e o microscopio de runtime para effects, actions, transitions, selections e snapshots da store.',
    bullets: [
      'Use quando o resumo do painel de runtime nao for suficiente.',
      'O overlay mostra o comportamento real da engine, nao uma copia da pagina didatica.',
      'Isso preserva a simplicidade do core e ainda prova que a ferramenta existe.',
    ],
    note: 'Abra o overlay pelo cabecalho para inspecionar o mesmo fluxo com uma visao mais profunda do runtime.',
  },
  {
    id: 'reuse',
    title: 'Reutilizacao de pluggables',
    summary:
      'O mesmo PrimaryActionButtonPluggable e usado em dois cores diferentes, mas cada core liga uma action diferente.',
    bullets: [
      'Task Board usa o mesmo botao para abrir uma modal local.',
      'Project Overview usa o mesmo botao para redirecionar para outra rota.',
      'O componente de UI nao muda; muda apenas a action ligada pelo core.',
    ],
    links: [
      {
        label: 'Abrir exemplo Task Board',
        to: '/task-board',
      },
      {
        label: 'Abrir exemplo Project Overview',
        to: '/project-overview',
      },
    ],
    note: 'A regra pratica e esta: pluggables devem continuar finos e reutilizaveis, enquanto o core decide a orquestracao.',
  },
];
