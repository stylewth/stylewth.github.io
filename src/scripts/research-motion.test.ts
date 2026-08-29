// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let intersectionCallback: IntersectionObserverCallback | undefined;
let observe: ReturnType<typeof vi.fn>;
let disconnect: ReturnType<typeof vi.fn>;

function mediaQuery(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

async function mount(): Promise<HTMLElement> {
  await import('./research-motion');
  const host = document.createElement('research-motion');
  document.body.append(host);
  return host;
}

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';
  intersectionCallback = undefined;
  observe = vi.fn();
  disconnect = vi.fn();
  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(false)));
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(function (callback: IntersectionObserverCallback) {
      intersectionCallback = callback;
      return { observe, disconnect };
    }),
  );
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('research-motion', () => {
  it('prepares, observes, and enters once after the first intersection', async () => {
    const host = await mount();

    expect(host.hasAttribute('data-motion-ready')).toBe(true);
    expect(host.hasAttribute('data-motion-entered')).toBe(false);
    expect(observe).toHaveBeenCalledWith(host);

    intersectionCallback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(host.hasAttribute('data-motion-entered')).toBe(false);

    intersectionCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(host.hasAttribute('data-motion-entered')).toBe(true);
    expect(disconnect).toHaveBeenCalledTimes(1);

    intersectionCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('keeps the final static state when reduced motion is requested', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(true)));
    const host = await mount();

    expect(host.hasAttribute('data-motion-ready')).toBe(false);
    expect(IntersectionObserver).not.toHaveBeenCalled();
  });

  it('keeps the final static state when IntersectionObserver is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const host = await mount();

    expect(host.hasAttribute('data-motion-ready')).toBe(false);
  });

  it('disconnects cleanly before entry and can observe after reconnection', async () => {
    const host = await mount();
    host.remove();

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(host.hasAttribute('data-motion-ready')).toBe(false);

    document.body.append(host);
    expect(observe).toHaveBeenCalledTimes(2);
  });
});
