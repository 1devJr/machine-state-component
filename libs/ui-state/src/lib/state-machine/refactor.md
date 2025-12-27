# Plano de refatoração — state-machine

## Objetivo

Simplificar e tornar mais previsível a `field-machine`, reforçando testabilidade, clareza das transições e acoplamento mínimo com `FormControl` externo.

## Contexto atual

- Estados: `idle → dirty → validating → valid/invalid`; eventos `CHANGE`, `BLUR`, `SET_DISABLED`, `VALIDATION_RESULT`.
- Depende de `FormControl` passado pelo componente (sincroniza valor, disabled, validação).
- Helpers internos: `collectErrors`, `awaitValidation`, actions para touched/dirty/loading/disabled/resultado.

## Problemas percebidos

- Lógica de sincronização com `FormControl` duplicada nas transições (setValue/disable).
- `awaitValidation` depende apenas de `statusChanges`; se não emitir, pode travar.
- Gestão de loading/hint na validação é verbosa e acoplada ao shape de `loadings`.
- Sem testes dedicados para a máquina (só uso implícito).

## Propostas de mudança

1. **Helpers puros para reduzir duplicação**
   - `syncControlValue(control, value)` para `setValueAction` reutilizar.
   - `toggleControl(control, disabled)` para `SET_DISABLED`.
   - `updateLoadingHint(isLoading, message)` encapsulando mutação de `loadings`.
2. **Validação mais robusta**
   - `awaitValidation` com fallback de timeout curto (`validationTimeoutMs` opcional) para evitar ficar preso em `PENDING`.
   - `collectErrors` garantindo array flatten e ordem determinística.
3. **API de opções**
   - `control` obrigatório (já é). Defaults: `validateDelay=250ms`, `validationLoadingMessage='Validating...'`, `validationTimeoutMs=800ms` (novo opcional).
4. **Testes (Vitest)**
   - Cobrir transições: `CHANGE` → debounce → `validating` → `valid/invalid`.
   - `SET_DISABLED` preserva valor/dirty/touched e reflete no `FormControl`.
   - Fallback de validação com timeout e coleta de erros.
5. **DX e docs**
   - JSDoc sucinto em options/helpers e diagrama curto de estados (mermaid) no topo do arquivo.

## Impacto esperado

- Contrato externo preservado (continua exigindo `FormControl` fornecido pelo componente).
- Menos repetição e estados de loading mais claros.
- Menor risco de travar em `validating`.

## Riscos/mitigações

- Mudança de timing de validação: manter debounce configurável e adicionar testes de tempo.
- Timeout pode ocultar pendência real: registrar erro no contexto ao estourar timeout.

## Próximos passos sugeridos

- Implementar helpers + timeout.
- Ajustar máquina para usar helpers.
- Adicionar `validationTimeoutMs` nas options com default seguro.
- Criar specs em `field-machine.spec.ts` cobrindo fluxos principais.
