// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function fixture(): HTMLElement {
  const host = document.createElement('favorites-stage');
  host.innerHTML = `
    <div role="tablist" aria-label="Favorite collections" data-favorite-tabs hidden>
      <button id="favorite-tab-film" role="tab" aria-selected="true"
        aria-controls="favorite-panel-film" tabindex="0" data-favorite-tab="film">Movies</button>
      <button id="favorite-tab-album" role="tab" aria-selected="false"
        aria-controls="favorite-panel-album" tabindex="-1" data-favorite-tab="album">Albums</button>
    </div>
    <section id="favorite-panel-film" role="tabpanel" data-favorite-panel="film">
      <button type="button" disabled data-favorite-trigger data-favorite-kind="film"
        data-favorite-rank="1" data-favorite-title="Taxi Driver"
        data-favorite-year="1976" data-favorite-creator="Martin Scorsese"
        data-favorite-creator-label="Director"
        data-favorite-cover-credit="Artwork by Guy Peellaert."
        data-favorite-cover-source="https://example.com/taxi">
        <picture>
          <source sizes="9rem" srcset="/taxi-360.avif 360w, /taxi-960.avif 960w">
          <img src="/taxi.jpg" sizes="9rem" alt="Taxi Driver poster">
        </picture>
      </button>
    </section>
    <section id="favorite-panel-album" role="tabpanel" data-favorite-panel="album">
      <button type="button" disabled data-favorite-trigger data-favorite-kind="album"
        data-favorite-rank="4" data-favorite-title="OK Computer"
        data-favorite-year="1997" data-favorite-creator="Radiohead"
        data-favorite-creator-label="Artist" data-favorite-review="A written note."
        data-favorite-cover-credit="Artwork by Stanley Donwood and Thom Yorke."
        data-favorite-cover-source="https://example.com/ok-computer">
        <picture><img src="/ok-computer.jpg" sizes="9rem" alt="OK Computer cover"></picture>
      </button>
    </section>
    <dialog data-favorite-dialog aria-labelledby="favorite-dialog-title">
      <button type="button" data-favorite-close>Close</button>
      <div data-favorite-dialog-art></div>
      <p data-favorite-dialog-rank></p>
      <h3 id="favorite-dialog-title" data-favorite-dialog-title></h3>
      <p data-favorite-dialog-original hidden></p>
      <p data-favorite-dialog-meta></p>
      <p data-favorite-dialog-review hidden></p>
      <p data-favorite-dialog-credit hidden></p>
      <a data-favorite-dialog-source hidden>Artwork source</a>
    </dialog>
  `;
  return host;
}

beforeEach(() => {
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

describe('favorites-stage', () => {
  it('enhances only after connection and selects Movies initially', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);

    expect(host.hasAttribute('data-enhanced')).toBe(true);
    expect(host.querySelector('[data-favorite-tabs]')?.hasAttribute('hidden')).toBe(false);
    expect(
      [...host.querySelectorAll<HTMLButtonElement>('[data-favorite-trigger]')].every(
        (trigger) => !trigger.disabled,
      ),
    ).toBe(true);
    expect(
      host.querySelector('[data-favorite-panel="film"]')?.hasAttribute('hidden'),
    ).toBe(false);
    expect(
      host.querySelector('[data-favorite-panel="album"]')?.hasAttribute('hidden'),
    ).toBe(true);
  });

  it('switches tabs with ArrowRight and moves focus', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const filmTab = host.querySelector<HTMLButtonElement>('[data-favorite-tab="film"]')!;
    const albumTab = host.querySelector<HTMLButtonElement>('[data-favorite-tab="album"]')!;

    filmTab.focus();
    filmTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(albumTab.getAttribute('aria-selected')).toBe('true');
    expect(albumTab.tabIndex).toBe(0);
    expect(document.activeElement).toBe(albumTab);
    expect(
      host.querySelector('[data-favorite-panel="album"]')?.hasAttribute('hidden'),
    ).toBe(false);
  });

  it('opens one focus card with cloned artwork and no empty review region', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;

    trigger.click();

    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.querySelector('[data-favorite-dialog-art] img')?.getAttribute('src')).toBe(
      '/taxi.jpg',
    );
    expect(dialog.querySelector('[data-favorite-dialog-title]')?.textContent).toBe('Taxi Driver');
    expect(dialog.querySelector('[data-favorite-dialog-rank]')?.textContent).toBe('01');
    expect(dialog.querySelector('[data-favorite-dialog-meta]')?.textContent).toBe(
      '1976 · Director: Martin Scorsese',
    );
    expect(
      dialog.querySelector('[data-favorite-dialog-review]')?.hasAttribute('hidden'),
    ).toBe(true);
    expect(
      [...dialog.querySelectorAll<HTMLElement>('[data-favorite-dialog-art] [sizes]')].every(
        (element) => element.getAttribute('sizes') === '(max-width: 48rem) 92vw, 30rem',
      ),
    ).toBe(true);
    expect(dialog.querySelector('[data-favorite-dialog-credit]')?.textContent).toBe(
      'Artwork by Guy Peellaert.',
    );
    expect(
      dialog.querySelector<HTMLAnchorElement>('[data-favorite-dialog-source]')?.href,
    ).toBe('https://example.com/taxi');
  });

  it('reveals a written review inside the enlarged card', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const albumTab = host.querySelector<HTMLButtonElement>('[data-favorite-tab="album"]')!;
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="album"]')!;

    albumTab.click();
    trigger.click();

    const review = host.querySelector<HTMLElement>('[data-favorite-dialog-review]')!;
    expect(review.hasAttribute('hidden')).toBe(false);
    expect(review.textContent).toBe('A written note.');
  });

  it('closes before switching categories and leaves focus on the new tab', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;
    const albumTab = host.querySelector<HTMLButtonElement>('[data-favorite-tab="album"]')!;
    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;

    trigger.click();
    albumTab.focus();
    albumTab.click();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(albumTab);
    expect(albumTab.getAttribute('aria-selected')).toBe('true');
  });

  it('closes from the backdrop and restores trigger focus', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;
    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;

    trigger.click();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('restores trigger focus when the native dialog close path runs', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;
    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;

    trigger.click();
    dialog.dispatchEvent(new Event('cancel'));
    dialog.close();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes from its close button without registering duplicate listeners', async () => {
    await import('./favorites-stage');
    const host = fixture();
    document.body.append(host);
    document.body.removeChild(host);
    document.body.append(host);
    const trigger = host.querySelector<HTMLButtonElement>('[data-favorite-kind="film"]')!;
    const close = host.querySelector<HTMLButtonElement>('[data-favorite-close]')!;
    const dialog = host.querySelector<HTMLDialogElement>('[data-favorite-dialog]')!;
    const closeSpy = vi.spyOn(dialog, 'close');

    trigger.click();
    close.click();

    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
});
