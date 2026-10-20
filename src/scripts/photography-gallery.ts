const tagName = 'photography-gallery';

class PhotographyGalleryElement extends HTMLElement {
  #abortController?: AbortController;
  #dialog?: HTMLDialogElement;
  #currentTrigger?: HTMLAnchorElement;
  #openingTrigger?: HTMLAnchorElement;
  #visibleTriggers: HTMLAnchorElement[] = [];
  #activeIndex = -1;
  #loadGeneration = 0;
  #restoreFocusAfterClose = true;

  connectedCallback(): void {
    if (this.#abortController) return;
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;
    this.#dialog = this.querySelector<HTMLDialogElement>('[data-photo-dialog]') ?? undefined;

    this.querySelectorAll<HTMLElement>('[data-photo-filter]').forEach((filter) => {
      filter.addEventListener('click', (event) => {
        if (event instanceof MouseEvent
          && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
        if (filter instanceof HTMLAnchorElement) event.preventDefault();
        this.#setFilter(filter.dataset.photoFilter ?? 'all');
        window.scrollTo({ top: 0 });
      }, { signal });
    });

    this.querySelectorAll<HTMLAnchorElement>('[data-photo-trigger]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        this.#open(trigger);
      }, { signal });
    });

    this.querySelector<HTMLSelectElement>('[data-photo-select]')?.addEventListener(
      'change', (event) => {
        this.#setFilter((event.currentTarget as HTMLSelectElement).value);
        window.scrollTo({ top: 0 });
      },
      { signal },
    );

    this.querySelector<HTMLButtonElement>('[data-photo-close]')?.addEventListener(
      'click', () => this.#dialog?.close(), { signal },
    );
    this.querySelector<HTMLButtonElement>('[data-photo-previous]')?.addEventListener(
      'click', () => this.#navigate(-1), { signal },
    );
    this.querySelector<HTMLButtonElement>('[data-photo-next]')?.addEventListener(
      'click', () => this.#navigate(1), { signal },
    );
    this.querySelector<HTMLButtonElement>('[data-photo-retry]')?.addEventListener(
      'click', () => this.#loadCurrent(), { signal },
    );

    this.#dialog?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.#navigate(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.#navigate(1);
      }
    }, { signal });
    this.#dialog?.addEventListener('click', (event) => {
      if (event.target === this.#dialog) this.#dialog?.close();
    }, { signal });
    this.#dialog?.addEventListener('close', () => {
      if (this.#restoreFocusAfterClose) this.#openingTrigger?.focus({ preventScroll: true });
      this.#openingTrigger = undefined;
      this.#currentTrigger = undefined;
      this.#activeIndex = -1;
      this.#loadGeneration += 1;
      this.#dialog?.querySelector<HTMLElement>('[data-photo-viewer-art]')?.replaceChildren();
      this.#dialog?.querySelector<HTMLElement>('[data-photo-viewer-error]')?.setAttribute('hidden', '');
      this.#dialog?.querySelector<HTMLButtonElement>('[data-photo-retry]')?.setAttribute('hidden', '');
      this.#restoreFocusAfterClose = true;
    }, { signal });

    this.#setFilter('all');
    this.dataset.enhanced = '';
    this.querySelector<HTMLElement>('[data-photo-mobile-filter]')?.removeAttribute('hidden');
  }

  disconnectedCallback(): void {
    this.#abortController?.abort();
    this.#abortController = undefined;
    if (this.#dialog?.open) this.#dialog.close();
    this.#dialog?.querySelector<HTMLElement>('[data-photo-viewer-art]')?.replaceChildren();
    this.#loadGeneration += 1;
    this.#currentTrigger = undefined;
    this.#openingTrigger = undefined;
    this.#visibleTriggers = [];
    this.#activeIndex = -1;
    this.#restoreFocusAfterClose = true;
  }

  #setFilter(seriesId: string): void {
    this.querySelectorAll<HTMLElement>('[data-photo-card]').forEach((card) => {
      card.toggleAttribute('hidden', seriesId !== 'all' && card.dataset.photoSeries !== seriesId);
    });
    this.querySelectorAll<HTMLAnchorElement>('[data-photo-filter]').forEach((link) => {
      const active = link.dataset.photoFilter === seriesId;
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    this.querySelectorAll<HTMLButtonElement>('[data-photo-filter]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.photoFilter === seriesId));
    });
    const select = this.querySelector<HTMLSelectElement>('[data-photo-select]');
    if (select) select.value = seriesId;

    this.#visibleTriggers = [...this.querySelectorAll<HTMLAnchorElement>('[data-photo-trigger]')]
      .filter((trigger) => !trigger.closest<HTMLElement>('[data-photo-card]')?.hidden);
    const currentIndex = this.#visibleTriggers.indexOf(this.#currentTrigger!);
    if (this.#dialog?.open && currentIndex === -1) {
      this.#restoreFocusAfterClose = false;
      this.#dialog.close();
      this.#currentTrigger = undefined;
      this.#activeIndex = -1;
    } else if (currentIndex >= 0) {
      this.#activeIndex = currentIndex;
      this.#updateNavigation();
    }
  }

  #open(trigger: HTMLAnchorElement): void {
    if (!this.#dialog) return;
    this.#currentTrigger = trigger;
    this.#openingTrigger = trigger;
    this.#activeIndex = this.#visibleTriggers.indexOf(trigger);
    if (this.#activeIndex < 0) return;
    this.#restoreFocusAfterClose = true;
    this.#loadCurrent();
    this.#updateNavigation();
    if (!this.#dialog.open) this.#dialog.showModal();
  }

  #navigate(direction: -1 | 1): void {
    const nextIndex = this.#activeIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.#visibleTriggers.length) return;
    this.#activeIndex = nextIndex;
    this.#currentTrigger = this.#visibleTriggers[nextIndex];
    this.#loadCurrent();
    this.#updateNavigation();
  }

  #loadCurrent(): void {
    const trigger = this.#currentTrigger;
    if (!trigger || !this.#dialog) return;
    const generation = ++this.#loadGeneration;
    const art = this.#dialog.querySelector<HTMLElement>('[data-photo-viewer-art]');
    const title = this.#dialog.querySelector<HTMLElement>('[data-photo-viewer-title]');
    const position = this.#dialog.querySelector<HTMLElement>('[data-photo-viewer-position]');
    const error = this.#dialog.querySelector<HTMLElement>('[data-photo-viewer-error]');
    const retry = this.#dialog.querySelector<HTMLButtonElement>('[data-photo-retry]');
    const previewSrc = trigger.dataset.photoSrc;
    const fullSrc = trigger.dataset.photoFullSrc ?? trigger.href;
    if (!art || !previewSrc || !fullSrc) return;

    const count = this.#visibleTriggers.length;
    const number = String(this.#activeIndex + 1).padStart(2, '0');
    const total = String(count).padStart(2, '0');
    if (title) title.textContent = trigger.dataset.photoTitle ?? '';
    if (position) position.textContent = `${trigger.dataset.photoTitle ?? ''} · ${number} / ${total}`;
    error?.setAttribute('hidden', '');
    retry?.setAttribute('hidden', '');
    art.replaceChildren();

    const preview = document.createElement('img');
    preview.src = previewSrc;
    preview.alt = '';
    preview.setAttribute('aria-hidden', 'true');
    preview.dataset.photoPreview = '';
    art.append(preview);

    const image = document.createElement('img');
    image.alt = trigger.dataset.photoAlt ?? '';
    image.width = Number(trigger.dataset.photoWidth) || 1;
    image.height = Number(trigger.dataset.photoHeight) || 1;
    image.decoding = 'async';
    image.dataset.photoFullImage = '';
    image.addEventListener('load', () => {
      if (generation !== this.#loadGeneration) return;
      preview.remove();
      image.classList.add('is-loaded');
    }, { once: true });
    image.addEventListener('error', () => {
      if (generation !== this.#loadGeneration) return;
      art.replaceChildren();
      error?.removeAttribute('hidden');
      retry?.removeAttribute('hidden');
    }, { once: true });
    image.src = fullSrc;
    art.append(image);
  }

  #updateNavigation(): void {
    const previous = this.querySelector<HTMLButtonElement>('[data-photo-previous]');
    const next = this.querySelector<HTMLButtonElement>('[data-photo-next]');
    if (previous) previous.disabled = this.#activeIndex <= 0;
    if (next) next.disabled = this.#activeIndex < 0 || this.#activeIndex >= this.#visibleTriggers.length - 1;
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, PhotographyGalleryElement);
}

export {};
