import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import mermaid from 'mermaid';
import { LiveDocsMermaidDirective } from '../../mermaid/live-docs-mermaid.directive';

jest.mock('mermaid', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest.fn(),
  },
}));

type MermaidRenderResult = {
  svg: string;
  bindFunctions?: (element: Element) => void;
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

@Component({
  imports: [LiveDocsMermaidDirective],
  template: `
    <section
      data-testid="diagram"
      [appLiveDocsMermaid]="diagram()"
      [nodeLinks]="nodeLinks"
    ></section>
  `,
})
class MermaidHostComponent {
  readonly diagram = signal(
    'flowchart LR\n  facade["Facade"] --> action["Action"]',
  );
  nodeLinks = {};
}

describe('LiveDocsMermaidDirective', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [MermaidHostComponent],
    }).compileComponents();
  });

  it('keeps the latest render when previous mermaid requests resolve later', async () => {
    const firstRender = createDeferred<MermaidRenderResult>();
    const secondRender = createDeferred<MermaidRenderResult>();
    const renderMock = jest.mocked(mermaid.render);

    renderMock
      .mockReturnValueOnce(firstRender.promise)
      .mockReturnValueOnce(secondRender.promise);

    const fixture = TestBed.createComponent(MermaidHostComponent);
    fixture.detectChanges();

    fixture.componentInstance.diagram.set(
      'flowchart LR\n  action["Action"] --> effect["Effect"]',
    );
    fixture.detectChanges();

    secondRender.resolve({
      svg: '<svg data-render="second"></svg>',
    });
    await secondRender.promise;
    await Promise.resolve();

    const host = fixture.nativeElement.querySelector(
      '[data-testid="diagram"]',
    ) as HTMLElement;
    expect(host.innerHTML).toContain('data-render="second"');

    firstRender.resolve({
      svg: '<svg data-render="first"></svg>',
    });
    await firstRender.promise;
    await Promise.resolve();

    expect(host.innerHTML).toContain('data-render="second"');
    expect(host.innerHTML).not.toContain('data-render="first"');
  });
});
