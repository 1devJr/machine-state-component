import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveDocsCodeViewerComponent } from './code/live-docs-code-viewer.component';
import { LiveDocsExampleComponent } from './example/live-docs-example.component';
import { LiveDocsFacadeService } from './example/facade/live-docs-facade.service';
import { LiveDocsMockService } from './example/services/live-docs.mock.service';
import {
  createLiveDocsHeaderCopy,
  createLiveDocsSections,
  LiveDocsCodeTab,
  LiveDocsSectionContent,
  LiveDocsSectionId,
} from './live-docs.content';
import { LiveDocsMermaidDirective } from './mermaid/live-docs-mermaid.directive';

type LiveDocsViewerTab = 'example' | 'source';

@Component({
  selector: 'app-live-docs-page',
  standalone: true,
  imports: [
    RouterLink,
    LiveDocsCodeViewerComponent,
    LiveDocsExampleComponent,
    LiveDocsMermaidDirective,
  ],
  providers: [LiveDocsMockService, LiveDocsFacadeService],
  templateUrl: './live-docs-page.component.html',
  styleUrl: './live-docs-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveDocsPageComponent {
  readonly facade = inject(LiveDocsFacadeService);

  readonly activeSectionId = signal<LiveDocsSectionId>('overview');
  readonly activeViewerTab = signal<LiveDocsViewerTab>('example');
  readonly activeSourceTabId = signal('actions');

  readonly copy = computed(() =>
    createLiveDocsHeaderCopy(this.facade.state().lang),
  );
  readonly sections = computed(() =>
    createLiveDocsSections(this.facade.state().lang),
  );
  readonly activeSection = computed<LiveDocsSectionContent>(() => {
    return (
      this.sections().find(
        (section) => section.id === this.activeSectionId(),
      ) ?? this.sections()[0]
    );
  });
  readonly sourceTabs = computed<LiveDocsCodeTab[]>(
    () => this.activeSection().sourceTabs,
  );
  readonly activeSourceTab = computed<LiveDocsCodeTab | undefined>(() =>
    this.sourceTabs().find((tab) => tab.id === this.activeSourceTabId()),
  );

  constructor() {
    effect(() => {
      const sourceTabs = this.sourceTabs();
      const current = this.activeSourceTabId();

      if (!sourceTabs.some((tab) => tab.id === current)) {
        this.activeSourceTabId.set(sourceTabs[0]?.id ?? '');
      }
    });
  }

  setSection(sectionId: LiveDocsSectionId): void {
    this.activeSectionId.set(sectionId);
    this.activeViewerTab.set('example');
    this.activeSourceTabId.set(
      this.sections().find((section) => section.id === sectionId)?.sourceTabs[0]
        ?.id ?? '',
    );
  }

  setViewerTab(tab: LiveDocsViewerTab): void {
    this.activeViewerTab.set(tab);
  }

  setSourceTab(tabId: string): void {
    this.activeSourceTabId.set(tabId);
  }

  handleDiagramNodeClick(sectionId: LiveDocsSectionId): void {
    this.setSection(sectionId);
  }

  toggleLang(): void {
    this.facade.setLang(this.facade.state().lang === 'pt-br' ? 'en' : 'pt-br');
  }

  reset(): void {
    this.facade.reset();
  }

  toggleDevtools(): void {
    this.facade.toggleDevtools();
  }
}
