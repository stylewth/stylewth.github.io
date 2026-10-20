// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type RectState = { top: number; bottom: number };
type RectSetter = (next: RectState) => void;

const rectSetters = new WeakMap<HTMLElement, RectSetter>();
let pendingFrame: FrameRequestCallback | undefined;
let nextFrameId = 0;
let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

function mediaQuery(matches: boolean): MediaQueryList {
  return Object.assign(new EventTarget(), {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  });
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
  const rabbit = document.createElement('div');
  rabbit.setAttribute('data-research-rabbit', '');
  let rect = initialRect;
  Object.defineProperty(rabbit, 'getBoundingClientRect', {
    configurable: true,
    value: () => toDomRect(rect),
  });
  rectSetters.set(host, (next) => { rect = next; });
  host.append(rabbit);
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
    vi.stubGlobal('IntersectionObserver', undefined);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
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
  const host = await mount({ top: 1000, bottom: 1200 });
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('0%');

  setRect(host, { top: -200, bottom: 0 });
  window.dispatchEvent(new Event('scroll'));
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('100%');

  setRect(host, { top: 400, bottom: 600 });
  window.dispatchEvent(new Event('scroll'));
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('50%');
});

it('coalesces repeated scroll signals into one frame', async () => {
  const host = await mount({ top: 1000, bottom: 1200 });
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
  const host = await mount({ top: 400, bottom: 600 });
  expect(host.hasAttribute('data-traversal-ready')).toBe(false);
  expect(host.style.getPropertyValue('--research-progress')).toBe('');
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});

it('removes listeners and cancels pending work on disconnect', async () => {
  const host = await mount({ top: 1000, bottom: 1200 });
  host.remove();
  expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
});

it('stops pending and future scroll work outside the scene, then resumes at the current position', async () => {
  let notifyIntersection: IntersectionObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { notifyIntersection = callback; }
    observe = vi.fn();
    disconnect = disconnect;
  });
  const host = await mount({ top: 400, bottom: 600 });
  const intersect = (isIntersecting: boolean) => notifyIntersection(
    [{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver,
  );
  intersect(true);
  flushFrame();
  window.dispatchEvent(new Event('scroll'));
  intersect(false);
  expect(pendingFrame).toBeUndefined();
  vi.mocked(requestAnimationFrame).mockClear();
  window.dispatchEvent(new Event('scroll'));
  window.dispatchEvent(new Event('resize'));
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  setRect(host, { top: 100, bottom: 300 });
  intersect(true);
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('75%');
  host.remove();
  expect(disconnect).toHaveBeenCalledOnce();
});

it('responds to live reduced-motion changes and restores the static composition', async () => {
  const preference = mediaQuery(false);
  vi.stubGlobal('matchMedia', vi.fn(() => preference));
  const host = await mount({ top: 400, bottom: 600 });
  flushFrame();
  window.dispatchEvent(new Event('scroll'));
  Object.defineProperty(preference, 'matches', { value: true, configurable: true });
  preference.dispatchEvent(new Event('change'));
  expect(pendingFrame).toBeUndefined();
  expect(host.hasAttribute('data-traversal-ready')).toBe(false);
  expect(host.style.getPropertyValue('--research-progress')).toBe('');
  vi.mocked(requestAnimationFrame).mockClear();
  window.dispatchEvent(new Event('scroll'));
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  Object.defineProperty(preference, 'matches', { value: false, configurable: true });
  preference.dispatchEvent(new Event('change'));
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('50%');
});

it('can enable motion after initially loading with reduced motion', async () => {
  const preference = mediaQuery(true);
  vi.stubGlobal('matchMedia', vi.fn(() => preference));
  const host = await mount({ top: 400, bottom: 600 });
  expect(pendingFrame).toBeUndefined();
  Object.defineProperty(preference, 'matches', { value: false, configurable: true });
  preference.dispatchEvent(new Event('change'));
  flushFrame();
  expect(host.hasAttribute('data-traversal-ready')).toBe(true);
});

it('pauses a hidden document and updates immediately when it becomes visible again', async () => {
  const hidden = vi.spyOn(document, 'hidden', 'get');
  const host = await mount({ top: 400, bottom: 600 });
  flushFrame();
  window.dispatchEvent(new Event('scroll'));
  hidden.mockReturnValue(true);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(pendingFrame).toBeUndefined();
  vi.mocked(requestAnimationFrame).mockClear();
  window.dispatchEvent(new Event('scroll'));
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  setRect(host, { top: 100, bottom: 300 });
  hidden.mockReturnValue(false);
  document.dispatchEvent(new Event('visibilitychange'));
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('75%');
});

it('removes preference and visibility listeners on disconnect and reconnects once', async () => {
  const preference = mediaQuery(false);
  vi.stubGlobal('matchMedia', vi.fn(() => preference));
  const host = await mount({ top: 400, bottom: 600 });
  flushFrame();
  host.remove();
  vi.mocked(requestAnimationFrame).mockClear();
  preference.dispatchEvent(new Event('change'));
  document.dispatchEvent(new Event('visibilitychange'));
  window.dispatchEvent(new Event('scroll'));
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  document.body.append(host);
  flushFrame();
  expect(host.style.getPropertyValue('--research-progress')).toBe('50%');
});
});
