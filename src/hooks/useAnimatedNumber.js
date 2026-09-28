import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Smoothly tweens a number when it changes (respects reduced motion). */
export function useAnimatedNumber(value, duration = 0.8) {
  const [display, setDisplay] = useState(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return undefined;
    }
    const controls = animate(display, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduce]);

  return display;
}
