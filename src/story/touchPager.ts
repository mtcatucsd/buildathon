// Touch paging for the pinned story chapters.
//
// Free-scrolling a pinned chapter on a phone has two problems: the first swipes appear to do nothing
// (the stage is pinned, so scrolling moves no pixels until the next beat fades in), and a hard flick can
// fly past several text beats before a thumb has cleared the screen. Native scroll-snap doesn't solve it
// (the browser, not the gesture, picks where a fling lands, so short swipes bounce back).
//
// Instead: every beat is a "stop" (the invisible .snap markers each Chapter renders), and one swipe
// always glides to the next or previous stop. The long paper page at the end (prizes, FAQ) is left to
// normal native scrolling. Laptops use Lenis instead and never load this.

const MIN_DIST = 24; // px of finger travel that counts as a swipe
const MIN_SPEED = 0.3; // px/ms: a short, quick flick also counts
const SLOP = 6; // px before we decide which way the gesture is going

let stops: number[] = [];
let pagedEnd = Infinity; // the paper page: normal scrolling from here on
let animating = false;
let startY = 0;
let lastY = 0;
let startT = 0;
let decided = false;
let mode: "idle" | "page" | "native" = "idle";

function measure() {
  const at = (el: Element) => Math.round(el.getBoundingClientRect().top + window.scrollY);
  const paper = document.getElementById("the-reward");
  pagedEnd = paper ? at(paper) : Infinity;
  stops = [...new Set([...[...document.querySelectorAll(".snap")].map(at), ...(paper ? [pagedEnd] : [])])].sort((a, b) => a - b);
}

function glideTo(to: number) {
  const from = window.scrollY;
  const dist = to - from;
  if (Math.abs(dist) < 2) return;
  const dur = Math.min(900, 380 + Math.abs(dist) * 0.28);
  const t0 = performance.now();
  animating = true;
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / dur);
    window.scrollTo(0, from + dist * ease(t));
    if (t < 1) requestAnimationFrame(tick);
    else animating = false;
  };
  requestAnimationFrame(tick);
}

function step(dir: 1 | -1) {
  measure();
  const y = window.scrollY;
  const target = dir === 1 ? stops.find((s) => s > y + 4) : [...stops].reverse().find((s) => s < y - 4);
  if (target !== undefined) glideTo(target);
}

export function startTouchPager() {
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      startY = lastY = t.clientY;
      startT = performance.now();
      decided = false;
      mode = animating ? "page" : "idle"; // while gliding, swallow the gesture so it can't fight the glide
      measure();
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      const y = e.touches[0].clientY;
      lastY = y;
      if (!decided && Math.abs(startY - y) > SLOP) {
        decided = true;
        const down = startY - y > 0; // finger moving up = reading on
        const sy = window.scrollY;
        // Paged: anywhere above the paper page, or swiping back up from its very top.
        const paged = sy < pagedEnd - 2 || (!down && sy <= pagedEnd + 2);
        mode = animating || paged ? "page" : "native";
      }
      if (mode === "page" && e.cancelable) e.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener(
    "touchend",
    () => {
      if (mode === "page" && !animating) {
        const dy = startY - lastY;
        const speed = Math.abs(dy) / Math.max(1, performance.now() - startT);
        if (Math.abs(dy) >= MIN_DIST || (Math.abs(dy) > SLOP && speed > MIN_SPEED)) step(dy > 0 ? 1 : -1);
      }
      mode = "idle";
    },
    { passive: true }
  );
}
