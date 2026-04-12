import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-overview-task-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="task-destination">
      <h2>Task creation route</h2>
      <p>
        The Project Overview core reused the same PrimaryActionButtonPluggable,
        but this time the core action redirected here.
      </p>
      <a routerLink="/project-overview">Back to Project Overview</a>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .task-destination {
      display: grid;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid #d1d5db;
      border-radius: 1rem;
      background: #fff;
    }

    .task-destination h2,
    .task-destination p {
      margin: 0;
    }

    .task-destination p {
      color: #4b5563;
      line-height: 1.55;
    }

    .task-destination a {
      color: #111827;
      font-weight: 600;
      text-decoration: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOverviewTaskPageComponent {}
