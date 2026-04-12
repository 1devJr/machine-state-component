import { Injectable, Signal, inject } from '@angular/core';
import {
  createComposedEngine,
  createFacadeBindings,
} from '@machine-state-component/ui-state';
import { Router } from '@angular/router';
import { createProjectOverviewArtifact } from './store/project-overview.artifact';
import { createProjectOverviewSelections } from './store/project-overview.selections';
import { ProjectOverviewState } from './store/project-overview.types';

type ProjectOverviewSelectionBindings = ReturnType<
  ReturnType<typeof createProjectOverviewSelections>
> & {
  status: Signal<ProjectOverviewState['status']>;
};

@Injectable()
export class ProjectOverviewFacadeService {
  readonly #router = inject(Router);

  readonly core = createComposedEngine(
    createProjectOverviewArtifact({
      goToTaskCreationPage: () =>
        this.#router.navigate(['/project-overview/new-task']),
    }),
  );
  readonly bindings = createFacadeBindings(this.core);
  readonly state = this.bindings.state;
  readonly actions = this.bindings.actions;
  readonly selections = this.bindings
    .selections as unknown as ProjectOverviewSelectionBindings;
  readonly composition = this.bindings.composition;
  readonly engineFacade = this.bindings.engineFacade;
}
