import { useEffect, useRef } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

// A copy of `source` that follows it at a limited speed (`maxPerSec`, in progress units per second),
// easing in as it arrives. Slow scrolling is unaffected: the copy keeps up, and the lag is imperceptible.
// A hard flick can't make the story skip ahead: the copy plays through at its own pace, so every text
// beat gets its turn on screen. Phones only: laptops scrub 1:1.
export function useSlewed(source: MotionValue<number>, maxPerSec: number, enabled: boolean): MotionValue<number> {
  const out = useMotionValue(source.get());
  const raf = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let last = 0;
    const tick = (now: number) => {
      raf.current = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = source.get();
      const cur = out.get();
      const d = target - cur;
      if (Math.abs(d) < 0.0005) {
        out.set(target);
        last = 0;
        return; // arrived: stop the loop until the source moves again
      }
      // Ease toward the target, but never faster than the cap.
      const eased = Math.abs(d) * (1 - Math.exp(-9 * dt));
      out.set(cur + Math.sign(d) * Math.min(eased, maxPerSec * dt));
      raf.current = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    kick();
    const off = source.on("change", kick);
    return () => {
      off();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [source, out, maxPerSec, enabled]);

  return enabled ? out : source;
}
