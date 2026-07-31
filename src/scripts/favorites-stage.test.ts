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
        data-favorite-provider-label="TMDB"
        data-favorite-source="https://www.themoviedb.org/movie/103">
        <img src="https://image.tmdb.org/t/p/w500/taxi.jpg"
          srcset="https://image.tmdb.org/t/p/w342/taxi.jpg 342w, https://image.tmdb.org/t/p/w500/taxi.jpg 500w, https://image.tmdb.org/t/p/w780/taxi.jpg 780w"
          sizes="9rem" width="500" height="750" alt="Taxi Driver poster"
          loading="lazy" referrerpolicy="no-referrer">
      </button>
    </section>
    <section id="favorite-panel-album" role="tabpanel" data-favorite-panel="album">
      <button type="button" disabled data-favorite-trigger data-favorite-kind="album"
        data-favorite-rank="4" data-favorite-title="OK Computer"
        data-favorite-year="1997" data-favorite-creator="Radiohead"
        data-favorite-creator-label="Artist" data-favorite-review="A written note."
        data-favorite-provider-label="Spotify"
        data-favorite-source="https://open.spotify.com/album/7dxKtc08dYeRVHt3p9CZJn">
        <img src="https://i.scdn.co/image/ok-computer" sizes="9rem" width="300"
          height="300" alt="OK Computer cover" loading="lazy" referrerpolicy="no-referrer">
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
    const dialogImage = dialog.querySelector<HTMLImageElement>('[data-favorite-dialog-art] img')!;
    expect(dialogImage.getAttribute('src')).toBe(
      'https://image.tmdb.org/t/p/w500/taxi.jpg',
    );
    expect(dialogImage.getAttribute('srcset')).toBe(
      'https://image.tmdb.org/t/p/w342/taxi.jpg 342w, https://image.tmdb.org/t/p/w500/taxi.jpg 500w, https://image.tmdb.org/t/p/w780/taxi.jpg 780w',
    );
    expect(dialogImage.getAttribute('sizes')).toBe('(max-width: 48rem) 92vw, 30rem');
    expect(dialogImage.getAttribute('width')).toBe('500');
    expect(dialogImage.getAttribute('height')).toBe('750');
    expect(dialogImage.getAttribute('alt')).toBe('Taxi Driver poster');
    expect(dialogImage.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(dialog.querySelector('[data-favorite-dialog-art] picture')).toBeNull();
    expect(dialog.querySelector('[data-favorite-dialog-title]')?.textContent).toBe('Taxi Driver');
    expect(dialog.querySelector('[data-favorite-dialog-rank]')?.textContent).toBe('01');
    expect(dialog.querySelector('[data-favorite-dialog-meta]')?.textContent).toBe(
      '1976 · Director: Martin Scorsese',
    );
    expect(
      dialog.querySelector('[data-favorite-dialog-review]')?.hasAttribute('hidden'),
    ).toBe(true);
    const source = dialog.querySelector<HTMLAnchorElement>('[data-favorite-dialog-source]')!;
    expect(source.href).toBe('https://www.themoviedb.org/movie/103');
    expect(source.textContent).toBe('TMDB');
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
