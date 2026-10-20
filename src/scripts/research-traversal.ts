import { calculateTraversalProgress, formatProgressPercent } from './research-traversal-progress';

const tagName = 'research-traversal';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

class ResearchTraversalElement extends HTMLElement {
  #frame = 0;
  #lastProgress = '';
  #rabbit?: HTMLElement;
  #motionPreference?: MediaQueryList;
  #observer?: IntersectionObserver;
  #inView = true;
  #active = false;

  #schedule = (): void => {
    if (!this.#active || this.#frame) return;
    this.#frame = window.requestAnimationFrame(() => {
      this.#frame = 0;
      if (!this.#active || !this.#rabbit) return;
      const rect = this.#rabbit.getBoundingClientRect();
      if (rect.height <= 0 || window.innerHeight <= 0) return;
      const progress = calculateTraversalProgress({
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
      });
      const formatted = formatProgressPercent(progress);
      if (formatted === this.#lastProgress) return;
      this.#lastProgress = formatted;
      this.style.setProperty('--research-progress', formatted);
      if (!this.hasAttribute('data-traversal-ready')) this.setAttribute('data-traversal-ready', '');
    });
  };

  #stop(): void {
    this.#active = false;
    window.removeEventListener('scroll', this.#schedule);
    window.removeEventListener('resize', this.#schedule);
    if (this.#frame) window.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  #reset(): void {
    this.#lastProgress = '';
    this.removeAttribute('data-traversal-ready');
    this.style.removeProperty('--research-progress');
  }

  #syncActivity = (): void => {
    const reducedMotion = this.#motionPreference?.matches;
    if (reducedMotion) this.#reset();
    if (!this.isConnected || !this.#inView || document.hidden || reducedMotion) {
      this.#stop();
      return;
    }
    if (this.#active) return;
    this.#active = true;
    window.addEventListener('scroll', this.#schedule, { passive: true });
    window.addEventListener('resize', this.#schedule);
    this.#schedule();
  };

  connectedCallback(): void {
    if (this.#motionPreference) return;
    this.#rabbit = this.querySelector<HTMLElement>('[data-research-rabbit]') ?? undefined;
    if (!this.#rabbit) throw new Error('Research traversal requires a marked rabbit subject');
    this.#motionPreference = window.matchMedia(reducedMotionQuery);
    this.#motionPreference.addEventListener('change', this.#syncActivity);
    document.addEventListener('visibilitychange', this.#syncActivity);

    this.#inView = typeof IntersectionObserver === 'undefined';
    if (!this.#inView) {
      this.#observer = new IntersectionObserver(([entry]) => {
        this.#inView = entry.isIntersecting;
        this.#syncActivity();
      });
      // Observe the fixed scene, since the subject itself crosses clipped glass layers.
      this.#observer.observe(this.querySelector('[data-research-stage]') ?? this);
    }
    this.#syncActivity();
  }

  disconnectedCallback(): void {
    this.#stop();
    this.#observer?.disconnect();
    this.#observer = undefined;
    this.#motionPreference?.removeEventListener('change', this.#syncActivity);
    this.#motionPreference = undefined;
    document.removeEventListener('visibilitychange', this.#syncActivity);
    this.#rabbit = undefined;
    this.#reset();
  }
}

if (!customElements.get(tagName)) {
  customElements.define(tagName, ResearchTraversalElement);
}

export {};
