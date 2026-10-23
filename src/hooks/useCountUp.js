import { useEffect, useRef, useState } from "react";

// Płynnie "dolicza" liczbę do nowej wartości
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = from.current;
    const delta = target - start;
    if (delta === 0) return;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(start + delta * eased);
      from.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
