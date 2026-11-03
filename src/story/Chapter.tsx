import { createContext, useContext, useRef, type ReactNode } from "react";
import { useScroll, type MotionValue } from "motion/react";

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
  // Scroll length in viewport heights. Longer = slower, more cinematic.
  length?: number;
  className?: string;
  children: ReactNode;
};

export default function Chapter({ id, length = 3, className = "", children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section ref={ref} id={id} className={`chapter ${className}`} style={{ height: `${length * 100}vh` }} data-chapter>
      <div className="chapter-stage">
        <ProgressContext.Provider value={scrollYProgress}>{children}</ProgressContext.Provider>
      </div>
    </section>
  );
}
