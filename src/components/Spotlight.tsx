import { useEffect, useRef } from "react";

// A soft light that follows the pointer. It's a fixed-size disc moved with a transform, so
// the browser composites it instead of repainting a full-screen gradient on every move.
export default function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current!;
    let x = 0;
    let y = 0;
    let raf = 0;
    const apply = () => {
      raf = 0;
      el.style.transform = `translate3d(${x - 420}px, ${y - 420}px, 0)`;
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.style.opacity = "1";
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => (el.style.opacity = "0");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div ref={ref} className="spotlight" aria-hidden="true" />;
}
