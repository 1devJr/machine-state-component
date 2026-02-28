import type { CompositionWithConnections } from '../pluggables/pluggable.types';
import type { AnyCoreKernel, CreateCoreArtifactInput } from '../types/core';
import { createComposedEngine } from './composed-engine';
import { createCoreArtifact } from './core-artifact';

export function createChildComposedEngine<
  TKernel extends AnyCoreKernel,
  TComposition extends CompositionWithConnections,
>(kernel: TKernel, input: CreateCoreArtifactInput<TKernel, TComposition>) {
  return createComposedEngine(createCoreArtifact(kernel, input));
}
