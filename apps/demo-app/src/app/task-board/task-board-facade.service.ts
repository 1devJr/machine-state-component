import { Injectable } from '@angular/core';
import {
  createComposedEngine,
  createFacadeBindings,
} from '@machine-state-component/ui-state';
import { taskBoardArtifact } from './store/task-board.artifact';

@Injectable()
export class TaskBoardFacadeService {
  readonly core = createComposedEngine(taskBoardArtifact);
  readonly bindings = createFacadeBindings(this.core);
  readonly state = this.bindings.state;
  readonly actions = this.bindings.actions;
  readonly selections = this.bindings.selections;
  readonly composition = this.bindings.composition;
  readonly engineFacade = this.bindings.engineFacade;
}
