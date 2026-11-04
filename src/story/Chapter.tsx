import { createContext, useContext, useRef, type ReactNode } from "react";
import { useScroll, type MotionValue } from "motion/react";
import { device } from "./device";

// Phones scroll natively (with momentum), so a pinned scene there is this fraction of its laptop length:
// one or two flicks carry you through a scene instead of a long drag.
const PHONE_LENGTH = 0.55;

// A chapter is a tall section whose content stays pinned while you scroll through it.
// Its scroll progress (0 → 1) drives every animation inside.
const ProgressContext = createContext<MotionValue<number> | null>(null);

export function useChapterProgress() {
  const p = useContext(ProgressContext);
  if (!p) throw new Error("useChapterProgress must be used inside <Chapter>");
  return p;
}

type Props = {
  id: string;
  // Scroll length in viewport heights. Longer = slower, more cinematic. 1 = not pinned at all.
  length?: number;
  className?: string;
  // Progress values (0–1) where touch screens come to rest: one per beat, so each swipe lands on exactly
  // one beat and none are skipped. Laptops ignore these and scrub continuously.
  snaps?: number[];
  // Which scroll range maps to progress 0 → 1. The hero uses "start → leaves the screen".
  offset?: NonNullable<Parameters<typeof useScroll>[0]>["offset"];
  children: ReactNode;
};

export default function Chapter({ id, length: fullLength = 3, className = "", snaps = [0], offset, children }: Props) {
  const length = device.small && fullLength > 1 ? 1 + (fullLength - 1) * PHONE_LENGTH : fullLength;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: offset ?? ["start start", "end end"] });
  const travel = (length - 1) * 100; // vh the pinned stage travels

  return (
    <section ref={ref} id={id} className={`chapter ${className}`} style={{ height: `${length * 100}vh` }} data-chapter>
      <div className="chapter-stage">
        <ProgressContext.Provider value={scrollYProgress}>{children}</ProgressContext.Provider>
      </div>
      {snaps.map((p) => (
        <span key={p} className="snap" style={{ top: `${travel * p}vh` }} aria-hidden="true" />
      ))}
    </section>
  );
}