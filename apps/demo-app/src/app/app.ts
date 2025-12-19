import { Component } from '@angular/core';
import { UiStatePanel } from '@machine-state-component/ui-state';

@Component({
  imports: [UiStatePanel],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
