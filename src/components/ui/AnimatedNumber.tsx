import React, { useEffect, useRef } from 'react';
import { animate, useInView } from 'motion/react';

interface Props {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/** Counts up from 0 to `value` the first time it scrolls into view, then tweens between later values. */
export const AnimatedNumber: React.FC<Props> = ({ value, format = (n) => Math.round(n).toString(), duration = 1.4, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const current = useRef(0);

  useEffect(() => {
    if (!inView || !ref.current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      ref.current.textContent = format(value);
      current.current = value;
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        current.current = v;
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, format]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
};
