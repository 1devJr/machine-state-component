import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  PLATFORM_ID,
} from '@angular/core';
import mermaid from 'mermaid';
import { LiveDocsSectionId } from '../live-docs.content';

let mermaidInitialized = false;
let mermaidSequence = 0;

@Directive({
  selector: '[appLiveDocsMermaid]',
  standalone: true,
})
export class LiveDocsMermaidDirective implements OnDestroy {
  readonly diagram = input.required<string>({ alias: 'appLiveDocsMermaid' });
  readonly nodeLinks = input<Partial<Record<string, LiveDocsSectionId>>>({});
  readonly nodeClick = output<LiveDocsSectionId>();

  readonly #element = inject(ElementRef<HTMLElement>);
  readonly #platformId = inject(PLATFORM_ID);
  #globalCallbackName: string | null = null;

  constructor() {
    effect(() => {
      void this.#render(this.diagram(), this.nodeLinks());
    });
  }

  ngOnDestroy(): void {
    this.#clearGlobalCallback();
  }

  async #render(
    diagram: string,
    nodeLinks: Partial<Record<string, LiveDocsSectionId>>,
  ): Promise<void> {
    const host = this.#element.nativeElement;

    if (!isPlatformBrowser(this.#platformId)) {
      host.textContent = diagram;
      host.setAttribute('data-fallback', 'true');
      return;
    }

    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        fontFamily: 'IBM Plex Sans, Segoe UI, sans-serif',
        themeVariables: {
          primaryColor: '#eff6ff',
          primaryBorderColor: '#2563eb',
          primaryTextColor: '#0f172a',
          lineColor: '#2563eb',
          secondaryColor: '#fff7ed',
          tertiaryColor: '#f8fafc',
          nodeBorder: '#2563eb',
        },
      });
      mermaidInitialized = true;
    }

    try {
      const callbackName = this.#registerGlobalCallback(nodeLinks);
      const { svg, bindFunctions } = await mermaid.render(
        `live-docs-mermaid-${++mermaidSequence}`,
        this.#withNodeClicks(diagram, nodeLinks, callbackName),
      );

      host.innerHTML = svg;
      bindFunctions?.(host);
      this.#decorateClickableNodes(host, nodeLinks);
      host.removeAttribute('data-fallback');
    } catch {
      host.textContent = diagram;
      host.setAttribute('data-fallback', 'true');
    }
  }

  #withNodeClicks(
    diagram: string,
    nodeLinks: Partial<Record<string, LiveDocsSectionId>>,
    callbackName: string | null,
  ): string {
    if (!callbackName || Object.keys(nodeLinks).length === 0) {
      return diagram;
    }

    const clickLines = Object.keys(nodeLinks).map(
      (nodeId) => `click ${nodeId} ${callbackName}`,
    );

    return `${diagram}\n${clickLines.join('\n')}`;
  }

  #registerGlobalCallback(
    nodeLinks: Partial<Record<string, LiveDocsSectionId>>,
  ): string | null {
    this.#clearGlobalCallback();

    if (
      !isPlatformBrowser(this.#platformId) ||
      Object.keys(nodeLinks).length === 0
    ) {
      return null;
    }

    const callbackName = `liveDocsMermaidNodeClick${++mermaidSequence}`;
    const globalScope = globalThis as Record<string, unknown>;

    globalScope[callbackName] = (nodeId: string) => {
      const targetSection = nodeLinks[nodeId];

      if (targetSection) {
        this.nodeClick.emit(targetSection);
      }
    };

    this.#globalCallbackName = callbackName;
    return callbackName;
  }

  #clearGlobalCallback(): void {
    if (!this.#globalCallbackName) {
      return;
    }

    const globalScope = globalThis as Record<string, unknown>;
    delete globalScope[this.#globalCallbackName];
    this.#globalCallbackName = null;
  }

  #decorateClickableNodes(
    host: HTMLElement,
    nodeLinks: Partial<Record<string, LiveDocsSectionId>>,
  ): void {
    if (Object.keys(nodeLinks).length === 0) {
      return;
    }

    for (const node of Array.from(
      host.querySelectorAll<SVGGElement>('g.clickable'),
    )) {
      node.style.cursor = 'pointer';
      node.style.transition = 'filter 160ms ease';

      node.addEventListener('mouseenter', () => {
        node.style.filter = 'drop-shadow(0 8px 18px rgba(37, 99, 235, 0.18))';
      });

      node.addEventListener('mouseleave', () => {
        node.style.filter = '';
      });
    }
  }
}
