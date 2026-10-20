// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function fixture(): HTMLElement {
  const host = document.createElement('photography-gallery');
  host.innerHTML = `
    <nav data-photo-filters aria-label="专题">
      <a href="#photos" data-photo-filter="all" aria-current="page">全部</a>
      <a href="#photos" data-photo-filter="scale">远方与尺度</a>
      <a href="#photos" data-photo-filter="encounters">擦肩与回望</a>
    </nav>
    <label data-photo-mobile-filter hidden>专题
      <select data-photo-select><option value="all">全部作品</option>
        <option value="scale">远方与尺度</option>
        <option value="encounters">擦肩与回望</option>
      </select>
    </label>
    <ol data-photo-list>
      <li data-photo-card data-photo-id="photo-001" data-photo-series="scale">
        <a href="/images/photography/photo-001/full.jpg" data-photo-trigger
          data-photo-title="晨光中的火山" data-photo-position="01"
          data-photo-src="/images/photography/photo-001/1000.webp"
          data-photo-full-src="/images/photography/photo-001/full.jpg"
          data-photo-width="1600" data-photo-height="900" data-photo-alt="雾中的火山">
          <img src="/images/photography/photo-001/1000.webp" width="1600" height="900" alt="雾中的火山">
        </a>
      </li>
      <li data-photo-card data-photo-id="photo-002" data-photo-series="encounters">
        <a href="/images/photography/photo-002/full.jpg" data-photo-trigger
          data-photo-title="来时路" data-photo-position="02"
          data-photo-src="/images/photography/photo-002/1000.webp"
          data-photo-full-src="/images/photography/photo-002/full.jpg"
          data-photo-width="900" data-photo-height="1400" data-photo-alt="门洞中的两人">
          <img src="/images/photography/photo-002/1000.webp" width="900" height="1400" alt="门洞中的两人">
        </a>
      </li>
      <li data-photo-card data-photo-id="photo-003" data-photo-series="scale">
        <a href="/images/photography/photo-003/full.jpg" data-photo-trigger
          data-photo-title="白崖与灯塔" data-photo-position="03"
          data-photo-src="/images/photography/photo-003/1000.webp"
          data-photo-full-src="/images/photography/photo-003/full.jpg"
          data-photo-width="1600" data-photo-height="1000" data-photo-alt="白崖与海中灯塔">
          <img src="/images/photography/photo-003/1000.webp" width="1600" height="1000" alt="白崖与海中灯塔">
        </a>
      </li>
      <li data-photo-card data-photo-id="photo-004" data-photo-series="encounters">
        <a href="/images/photography/photo-004/full.jpg" data-photo-trigger
          data-photo-title="同一拍" data-photo-position="04"
          data-photo-src="/images/photography/photo-004/1000.webp"
          data-photo-full-src="/images/photography/photo-004/full.jpg"
          data-photo-width="1200" data-photo-height="900" data-photo-alt="并行骑行的人">
          <img src="/images/photography/photo-004/1000.webp" width="1200" height="900" alt="并行骑行的人">
        </a>
      </li>
    </ol>
    <dialog data-photo-dialog aria-labelledby="photo-dialog-title">
      <button type="button" data-photo-close>关闭</button>
      <button type="button" data-photo-previous>上一张</button>
      <div data-photo-viewer-art></div>
      <p data-photo-viewer-error hidden>图片加载失败</p>
      <button type="button" data-photo-retry hidden>重试</button>
      <button type="button" data-photo-next>下一张</button>
      <p data-photo-viewer-position></p>
      <h2 id="photo-dialog-title" data-photo-viewer-title></h2>
    </dialog>
  `;
  return host;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  document.body.innerHTML = '';
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('photography-gallery', () => {
  it('does not reset page scroll during initial enhancement', async () => {
    await import('./photography-gallery');
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const host = fixture();

    document.body.append(host);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('filters the single ordered list and restores every card with All', async () => {
    await import('./photography-gallery');
    const host = fixture();
    document.body.append(host);

    host.querySelector<HTMLAnchorElement>('[data-photo-filter="scale"]')!.click();
    expect([...host.querySelectorAll<HTMLElement>('[data-photo-card]:not([hidden])')]
      .map((card) => card.dataset.photoId)).toEqual(['photo-001', 'photo-003']);

    host.querySelector<HTMLAnchorElement>('[data-photo-filter="all"]')!.click();
    expect([...host.querySelectorAll<HTMLElement>('[data-photo-card]:not([hidden])')]
      .map((card) => card.dataset.photoId)).toEqual([
      'photo-001', 'photo-002', 'photo-003', 'photo-004',
    ]);
  });

  it('resets page scroll after a desktop series link click', async () => {
    await import('./photography-gallery');
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const host = fixture();
    document.body.append(host);

    host.querySelector<HTMLAnchorElement>('[data-photo-filter="scale"]')!.click();

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('navigates only within the filtered set and disables both ends', async () => {
    await import('./photography-gallery');
    const host = fixture();
    document.body.append(host);
    host.querySelector<HTMLButtonElement>('[data-photo-filter="scale"]')!.click();
    const triggers = host.querySelectorAll<HTMLAnchorElement>('[data-photo-trigger]');
    const dialog = host.querySelector<HTMLDialogElement>('[data-photo-dialog]')!;
    const previous = host.querySelector<HTMLButtonElement>('[data-photo-previous]')!;
    const next = host.querySelector<HTMLButtonElement>('[data-photo-next]')!;

    triggers[0].click();
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    next.click();
    expect(host.querySelector('[data-photo-viewer-title]')?.textContent).toBe('白崖与灯塔');
    expect(host.querySelector('[data-photo-viewer-position]')?.textContent).toContain('02 / 02');
    expect(next.disabled).toBe(true);
    previous.click();
    expect(host.querySelector('[data-photo-viewer-title]')?.textContent).toBe('晨光中的火山');
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('loads the full image only when opened and clears stale art while loading the next', async () => {
    await import('./photography-gallery');
    const host = fixture();
    document.body.append(host);
    const triggers = host.querySelectorAll<HTMLAnchorElement>('[data-photo-trigger]');
    const art = host.querySelector<HTMLElement>('[data-photo-viewer-art]')!;

    expect(art.querySelector('img')).toBeNull();
    triggers[0].click();
    expect(art.querySelector('[data-photo-full-image]')?.getAttribute('src')).toBe(
      '/images/photography/photo-001/full.jpg',
    );
    host.querySelector<HTMLButtonElement>('[data-photo-next]')!.click();
    expect(art.querySelector('[data-photo-full-image]')?.getAttribute('src')).toBe(
      '/images/photography/photo-002/full.jpg',
    );
    expect(art.querySelector('[data-photo-full-image]')?.getAttribute('src')).not.toBe(
      '/images/photography/photo-001/full.jpg',
    );
  });

  it('shows a retry action after a full-image error and retries the current photo', async () => {
    await import('./photography-gallery');
    const host = fixture();
    document.body.append(host);
    host.querySelector<HTMLAnchorElement>('[data-photo-trigger]')!.click();
    const image = host.querySelector<HTMLImageElement>('[data-photo-full-image]')!;
    image.dispatchEvent(new Event('error'));

    expect(host.querySelector('[data-photo-viewer-error]')?.hasAttribute('hidden')).toBe(false);
    const previousImage = host.querySelector('[data-photo-full-image]');
    host.querySelector<HTMLButtonElement>('[data-photo-retry]')!.click();
    expect(host.querySelector('[data-photo-viewer-error]')?.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('[data-photo-full-image]')).not.toBe(previousImage);
    expect(host.querySelector('[data-photo-full-image]')?.getAttribute('src')).toBe(
      '/images/photography/photo-001/full.jpg',
    );
  });

  it('restores focus to the opening photo after closing the native dialog', async () => {
    await import('./photography-gallery');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLAnchorElement>('[data-photo-trigger]')!;
    trigger.focus();
    trigger.click();
    host.querySelector<HTMLButtonElement>('[data-photo-close]')!.click();

    expect(host.querySelector<HTMLDialogElement>('[data-photo-dialog]')?.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('restores the original opener after arrow navigation and Escape', async () => {
    await import('./photography-gallery');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLAnchorElement>('[data-photo-trigger]')!;
    const dialog = host.querySelector<HTMLDialogElement>('[data-photo-dialog]')!;
    trigger.click();
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(host.querySelector('[data-photo-viewer-title]')?.textContent).toBe('晨光中的火山');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(host.querySelector('[data-photo-viewer-title]')?.textContent).toBe('来时路');
    dialog.dispatchEvent(new KeyboardEvent('cancel', { bubbles: false, cancelable: true }));
    dialog.close();
    expect(document.activeElement).toBe(trigger);
  });

  it('uses the mobile selector and does not intercept modified direct-image links', async () => {
    await import('./photography-gallery');
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const host = fixture();
    document.body.append(host);
    const mobileFilter = host.querySelector<HTMLElement>('[data-photo-mobile-filter]')!;
    expect(mobileFilter.hasAttribute('hidden')).toBe(false);
    const select = host.querySelector<HTMLSelectElement>('[data-photo-select]')!;
    select.value = 'encounters';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
    expect([...host.querySelectorAll<HTMLElement>('[data-photo-card]:not([hidden])')]
      .map((card) => card.dataset.photoId)).toEqual(['photo-002', 'photo-004']);

    const trigger = host.querySelector<HTMLAnchorElement>('[data-photo-trigger]')!;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    trigger.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);

    const filter = host.querySelector<HTMLAnchorElement>('[data-photo-filter="scale"]')!;
    const filterEvent = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    filter.dispatchEvent(filterEvent);
    expect(filterEvent.defaultPrevented).toBe(false);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
