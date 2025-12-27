import { FormControl } from '@angular/forms';

export interface FieldMachineOptions {
  /** debounce para disparar validação; aplicado na transição dirty -> validating */
  validateDelay?: number;
  /** mensagem exibida durante estado de validação */
  validationLoadingMessage?: string;
  /** timeout opcional para fallback caso o status continue em PENDING */
  validationTimeoutMs?: number;
  /** FormControl fornecido pelo componente (obrigatório para simplificar a máquina) */
  control: FormControl;
}

export const DEFAULT_VALIDATE_DELAY = 250;
export const DEFAULT_LOADING_MESSAGE = 'Validating...';
export const DEFAULT_VALIDATION_TIMEOUT = 800;
