import { useEffect, type RefObject } from 'react';

/**
 * Global pointer spotlight: sets --mx / --my on whichever `.glass-panel`
 * (or `[data-spotlight]`) element the pointer is over. One listener for the
 * whole app keeps this cheap regardless of how many cards are on screen.
 */
export function useSpotlight() {
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.glass-panel, [data-spotlight]');
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
}

/**
 * Scroll-reveal for every `.glass-panel` inside the container. Panels that
 * enter the viewport together are staggered; panels added later (filtering,
 * new targets) animate in as well.
 */
export function useAutoReveal(containerRef: RefObject<HTMLElement | null>, key: unknown) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((en) => en.isIntersecting);
        visible
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
          .forEach((en, i) => {
            const el = en.target as HTMLElement;
            el.style.setProperty('--reveal-delay', `${Math.min(i, 10) * 55}ms`);
            el.classList.add('is-revealed');
            io.unobserve(el);
            // Clear the delay once revealed so hover transitions stay snappy.
            window.setTimeout(() => el.style.removeProperty('--reveal-delay'), 1200);
          });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    );

    const prepare = (el: Element) => {
      if (!(el instanceof HTMLElement) || el.dataset.reveal !== undefined) return;
      if (el.closest('.modal-content, .modal-backdrop') || el.hasAttribute('data-no-reveal')) return;
      el.dataset.reveal = '';
      io.observe(el);
    };

    root.querySelectorAll('.glass-panel, [data-reveal-item]').forEach(prepare);

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches('.glass-panel, [data-reveal-item]')) prepare(n);
          n.querySelectorAll?.('.glass-panel, [data-reveal-item]').forEach(prepare);
        });
      }
    });
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [containerRef, key]);
}
