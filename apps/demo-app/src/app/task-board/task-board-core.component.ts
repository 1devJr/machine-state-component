import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EngineSlotDirective } from '@machine-state-component/ui-state';
import { TaskBoardFacadeService } from './task-board-facade.service';

@Component({
  selector: 'app-task-board-core',
  standalone: true,
  imports: [EngineSlotDirective],
  providers: [TaskBoardFacadeService],
  templateUrl: './task-board-core.component.html',
  styleUrl: './task-board-core.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardCoreComponent {
  readonly facade = inject(TaskBoardFacadeService);
}
