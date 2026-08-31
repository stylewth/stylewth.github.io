import { calculateTraversalProgress, formatProgressPercent } from './research-traversal-progress';

const tagName = 'research-traversal';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

class ResearchTraversalElement extends HTMLElement {
  #frame = 0;

  #schedule = (): void => {
    if (this.#frame) return;
    this.#frame = window.requestAnimationFrame(() => {
      this.#frame = 0;
      const rabbit = this.querySelector<HTMLElement>('[data-research-rabbit]');
      if (!rabbit) throw new Error('Research traversal requires a marked rabbit subject');
      const rect = rabbit.getBoundingClientRect();
      const progress = calculateTraversalProgress({
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
      });
      this.style.setProperty('--research-progress', formatProgressPercent(progress));
      this.setAttribute('data-traversal-ready', '');
    });
  };

  connectedCallback(): void {
    if (window.matchMedia(reducedMotionQuery).matches) return;
    window.addEventListener('scroll', this.#schedule, { passive: true });
    window.addEventListener('resize', this.#schedule);
    this.#schedule();
  }

  disconnectedCallback(): void {
    window.removeEventListener('scroll', this.#schedule);
    window.removeEventListener('resize', this.#schedule);
    if (this.#frame) window.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.removeAttribute('data-traversal-ready');
    this.style.removeProperty('--research-progress');
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, ResearchTraversalElement);
}

export {};
