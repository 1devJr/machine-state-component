import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EngineSlotDirective } from '@machine-state-component/ui-state';
import { ProjectOverviewFacadeService } from './project-overview-facade.service';

@Component({
  selector: 'app-project-overview-core',
  standalone: true,
  imports: [EngineSlotDirective],
  providers: [ProjectOverviewFacadeService],
  templateUrl: './project-overview-core.component.html',
  styleUrl: './project-overview-core.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOverviewCoreComponent {
  readonly facade = inject(ProjectOverviewFacadeService);
  readonly composition = this.facade.composition;
  readonly engineFacade = this.facade.engineFacade;
  readonly lastNavigationTarget = this.facade.selections.lastNavigationTarget;
}
