const tagName = 'research-motion';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

class ResearchMotionElement extends HTMLElement {
  #observer?: IntersectionObserver;
  #frame = 0;

  connectedCallback(): void {
    if (this.#observer || this.hasAttribute('data-motion-entered')) return;
    if (typeof IntersectionObserver !== 'function') return;
    if (window.matchMedia(reducedMotionQuery).matches) return;

    this.setAttribute('data-motion-ready', '');
    this.#observer = new IntersectionObserver(
      (entries) => {
        if (this.hasAttribute('data-motion-entered')) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;

        this.#observer?.disconnect();
        this.#observer = undefined;
        this.#frame = window.requestAnimationFrame(() => {
          this.setAttribute('data-motion-entered', '');
          this.#frame = 0;
        });
      },
      { threshold: 0.24 },
    );
    this.#observer.observe(this);
  }

  disconnectedCallback(): void {
    this.#observer?.disconnect();
    this.#observer = undefined;
    if (this.#frame) window.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    if (!this.hasAttribute('data-motion-entered')) {
      this.removeAttribute('data-motion-ready');
    }
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, ResearchMotionElement);
}

export {};
