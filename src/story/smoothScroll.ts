import Lenis from "lenis";

// One smooth-scroll instance for the whole page; the rail uses it to jump between chapters.
export let lenis: Lenis | null = null;

export function startSmoothScroll() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  lenis = new Lenis({ autoRaf: true, lerp: 0.09 });
  if (import.meta.env.DEV) (window as unknown as { lenis: Lenis }).lenis = lenis;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: "smooth" });
}
