// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type RectState = { top: number; bottom: number };
type RectSetter = (next: RectState) => void;

const rectSetters = new WeakMap<HTMLElement, RectSetter>();
let pendingFrame: FrameRequestCallback | undefined;
let nextFrameId = 0;
let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

function mediaQuery(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
}

function toDomRect({ top, bottom }: RectState): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    right: 100,
    bottom,
    left: 0,
    width: 100,
    height: bottom - top,
    toJSON: () => ({}),
  };
}

async function mount(initialRect: RectState): Promise<HTMLElement> {
  await import('./research-traversal');
  const host = document.createElement('research-traversal');
  let rect = initialRect;
  Object.defineProperty(host, 'getBoundingClientRect', {
    configurable: true,
    value: () => toDomRect(rect),
  });
  rectSetters.set(host, (next) => { rect = next; });
  document.body.append(host);
  return host;
}

function setRect(host: HTMLElement, next: RectState): void {
  const set = rectSetters.get(host);
  if (!set) throw new Error('Host was not mounted by this suite');
  set(next);
}

function flushFrame(): void {
  const callback = pendingFrame;
  pendingFrame = undefined;
  if (!callback) throw new Error('No animation frame is pending');
  callback(0);
}

describe('research traversal controller', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.replaceChildren();
    pendingFrame = undefined;
    nextFrameId = 0;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(false)));
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      pendingFrame = callback;
      nextFrameId += 1;
      return nextFrameId;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
      if (id === nextFrameId) pendingFrame = undefined;
    }));
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

it('writes progress from current geometry and reverses with upward scroll', async () => {
  const host = await mount({ top: 850, bottom: 1450 });
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('0%');

  setRect(host, { top: -350, bottom: 250 });
  window.dispatchEvent(new Event('scroll'));
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('100%');

  setRect(host, { top: 250, bottom: 850 });
  window.dispatchEvent(new Event('scroll'));
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('50%');
});

it('coalesces repeated scroll signals into one frame', async () => {
  const host = await mount({ top: 850, bottom: 1450 });
  flushFrame();
  vi.mocked(requestAnimationFrame).mockClear();
  window.dispatchEvent(new Event('scroll'));
  window.dispatchEvent(new Event('scroll'));
  window.dispatchEvent(new Event('scroll'));
  expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  host.remove();
});

it('keeps the static middle state under reduced motion', async () => {
  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(true)));
  const host = await mount({ top: 250, bottom: 850 });
  expect(host.hasAttribute('data-traversal-ready')).toBe(false);
  expect(host.style.getPropertyValue('--research-progress')).toBe('');
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});

it('removes listeners and cancels pending work on disconnect', async () => {
  const host = await mount({ top: 850, bottom: 1450 });
  host.remove();
  expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
});
});
