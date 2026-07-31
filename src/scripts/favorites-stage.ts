type FavoriteKind = 'film' | 'album';

const tagName = 'favorites-stage';

function isFavoriteKind(value: string | undefined): value is FavoriteKind {
  return value === 'film' || value === 'album';
}

class FavoritesStageElement extends HTMLElement {
  #abortController?: AbortController;
  #dialog?: HTMLDialogElement;
  #lastTrigger?: HTMLButtonElement;
  #restoreFocusAfterClose = true;

  connectedCallback(): void {
    if (this.#abortController) return;

    this.#abortController = new AbortController();
    const signal = this.#abortController.signal;
    this.#dialog = this.querySelector<HTMLDialogElement>('[data-favorite-dialog]') ?? undefined;

    this.querySelectorAll<HTMLButtonElement>('[data-favorite-tab]').forEach((tab) => {
      tab.addEventListener('click', () => this.#selectCategory(tab.dataset.favoriteTab), { signal });
      tab.addEventListener('keydown', (event) => this.#handleTabKey(event), { signal });
    });

    this.querySelectorAll<HTMLButtonElement>('[data-favorite-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', () => this.#openFavorite(trigger), { signal });
    });

    this.querySelector<HTMLButtonElement>('[data-favorite-close]')?.addEventListener(
      'click',
      () => this.#dialog?.close(),
      { signal },
    );

    this.#dialog?.addEventListener(
      'click',
      (event) => {
        if (event.target === this.#dialog) this.#dialog.close();
      },
      { signal },
    );

    this.#dialog?.addEventListener(
      'close',
      () => {
        if (this.#restoreFocusAfterClose) this.#lastTrigger?.focus();
        this.#restoreFocusAfterClose = true;
      },
      { signal },
    );

    this.#selectCategory('film');
    this.setAttribute('data-enhanced', '');
    this.querySelector<HTMLElement>('[data-favorite-tabs]')?.removeAttribute('hidden');
    this.querySelectorAll<HTMLButtonElement>('[data-favorite-trigger]').forEach((trigger) => {
      trigger.disabled = false;
    });
  }

  disconnectedCallback(): void {
    this.#abortController?.abort();
    this.#abortController = undefined;
  }

  #selectCategory(value: string | undefined): void {
    if (!isFavoriteKind(value)) return;
    if (this.#dialog?.open) {
      this.#restoreFocusAfterClose = false;
      this.#dialog.close();
    }

    this.querySelectorAll<HTMLButtonElement>('[data-favorite-tab]').forEach((tab) => {
      const selected = tab.dataset.favoriteTab === value;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    this.querySelectorAll<HTMLElement>('[data-favorite-panel]').forEach((panel) => {
      panel.toggleAttribute('hidden', panel.dataset.favoritePanel !== value);
    });
  }

  #handleTabKey(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    const tabs = [...this.querySelectorAll<HTMLButtonElement>('[data-favorite-tab]')];
    const current = tabs.indexOf(event.currentTarget as HTMLButtonElement);
    if (current < 0) return;

    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(current + direction + tabs.length) % tabs.length];
    this.#selectCategory(next.dataset.favoriteTab);
    next.focus();
  }

  #openFavorite(trigger: HTMLButtonElement): void {
    if (!this.#dialog) return;
    this.#lastTrigger = trigger;
    this.#restoreFocusAfterClose = true;

    const art = this.#dialog.querySelector<HTMLElement>('[data-favorite-dialog-art]');
    const picture = trigger.querySelector('picture')?.cloneNode(true) as HTMLElement | undefined;
    if (art && picture) {
      picture.querySelectorAll<HTMLElement>('[sizes]').forEach((element) => {
        element.setAttribute('sizes', '(max-width: 48rem) 92vw, 30rem');
      });
      art.replaceChildren(picture);
    }

    const setText = (selector: string, value: string | undefined): void => {
      const element = this.#dialog?.querySelector<HTMLElement>(selector);
      if (!element) return;
      element.textContent = value ?? '';
    };

    const rank = String(trigger.dataset.favoriteRank ?? '').padStart(2, '0');
    setText('[data-favorite-dialog-rank]', rank);
    setText('[data-favorite-dialog-title]', trigger.dataset.favoriteTitle);
    setText(
      '[data-favorite-dialog-meta]',
      `${trigger.dataset.favoriteYear} · ${trigger.dataset.favoriteCreatorLabel}: ${trigger.dataset.favoriteCreator}`,
    );

    const original = this.#dialog.querySelector<HTMLElement>('[data-favorite-dialog-original]');
    const review = this.#dialog.querySelector<HTMLElement>('[data-favorite-dialog-review]');
    const credit = this.#dialog.querySelector<HTMLElement>('[data-favorite-dialog-credit]');
    for (const [element, value] of [
      [original, trigger.dataset.favoriteOriginalTitle],
      [review, trigger.dataset.favoriteReview],
      [credit, trigger.dataset.favoriteCoverCredit],
    ] as const) {
      if (!element) continue;
      element.textContent = value ?? '';
      element.toggleAttribute('hidden', !value);
    }

    const source = this.#dialog.querySelector<HTMLAnchorElement>('[data-favorite-dialog-source]');
    const sourceUrl = trigger.dataset.favoriteCoverSource;
    if (source && sourceUrl) {
      source.href = sourceUrl;
      source.removeAttribute('hidden');
    } else if (source) {
      source.removeAttribute('href');
      source.setAttribute('hidden', '');
    }

    this.#dialog.showModal();
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, FavoritesStageElement);
}

export {};
