// Touch paging for the pinned story chapters.
//
// Free-scrolling a pinned chapter on a phone has two problems: the first swipes appear to do nothing
// (the stage is pinned, so scrolling moves no pixels until the next beat fades in), and a hard flick can
// fly past several text beats before a thumb has cleared the screen. Native scroll-snap doesn't solve it
// (the browser, not the gesture, picks where a fling lands, so short swipes bounce back).
//
// Instead: every beat is a "stop" (the invisible .snap markers each Chapter renders), and one swipe
// always moves to the next or previous stop. To feel like native scrolling rather than a slideshow:
//  · The page follows the finger 1:1 while it's down (only as far as the neighbouring stops, so a drag
//    can't skip a beat), and on release glides the rest of the way.
//  · The glide eases out from the finger's speed and is short (≈250–450ms).
//  · A new swipe during a glide is never ignored: it takes over from where the page is and moves on from
//    the stop the glide was heading to, so quick swipes chain beat after beat.
// The long paper page at the end (prizes, FAQ) is left to normal native scrolling. Laptops use Lenis
// instead and never load this.

const MIN_DIST = 24; // px of finger travel that counts as a swipe
const MIN_SPEED = 0.3; // px/ms: a short, quick flick also counts
const SLOP = 6; // px before we decide which way the gesture is going

let stops: number[] = [];
let pagedEnd = Infinity; // the paper page: normal scrolling from here on

let raf = 0;
let glideTarget: number | null = null; // the stop a running glide is heading to

let startY = 0;
let lastY = 0;
let startT = 0;
let startScroll = 0;
let anchor = 0; // the stop this gesture moves on from
let lo = 0; // how far the finger may drag the page (the stops either side of the anchor)
let hi = 0;
let decided = false;
let interrupted = false; // this touch stopped a glide part-way
let mode: "idle" | "page" | "native" = "idle";
let samples: { y: number; t: number }[] = []; // recent finger positions, for release speed

function measure() {
  const at = (el: Element) => Math.round(el.getBoundingClientRect().top + window.scrollY);
  const paper = document.getElementById("the-reward");
  pagedEnd = paper ? at(paper) : Infinity;
  stops = [...new Set([...[...document.querySelectorAll(".snap")].map(at), ...(paper ? [pagedEnd] : [])])].sort((a, b) => a - b);
}

const nearest = (y: number) => stops.reduce((best, s) => (Math.abs(s - y) < Math.abs(best - y) ? s : best), stops[0] ?? 0);
const after = (y: number) => stops.find((s) => s > y + 2);
const before = (y: number) => [...stops].reverse().find((s) => s < y - 2);

function stopGlide() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  glideTarget = null;
}

// Ease out from the release speed: fast flicks finish quickly, gentle drags settle softly.
function glideTo(to: number, speed = 0) {
  stopGlide();
  const from = window.scrollY;
  const dist = to - from;
  if (Math.abs(dist) < 1) return;
  const byDistance = 240 + Math.sqrt(Math.abs(dist)) * 7;
  const bySpeed = speed > 0.2 ? (Math.abs(dist) / speed) * 2.2 : Infinity; // keep up with the finger's momentum
  const dur = Math.max(220, Math.min(460, byDistance, bySpeed));
  const t0 = performance.now();
  glideTarget = to;
  const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic: starts at speed, no slow wind-up
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / dur);
    window.scrollTo(0, from + dist * ease(t));
    if (t < 1) raf = requestAnimationFrame(tick);
    else {
      raf = 0;
      glideTarget = null;
    }
  };
  raf = requestAnimationFrame(tick);
}

function releaseSpeed() {
  // Finger speed over the last ~100ms, in px/ms (positive = reading on).
  const last = samples[samples.length - 1];
  const first = samples.find((s) => last.t - s.t <= 100) ?? samples[0];
  return last && first && last.t > first.t ? (first.y - last.y) / (last.t - first.t) : 0;
}

export function startTouchPager() {
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // index.css sets `scroll-behavior: smooth` on <html> (Lenis overrides it on laptops, but Lenis doesn't
  // run here). Left on, every scrollTo below would start the browser's own smooth-scroll animation,
  // restarted each frame: the page lags behind the finger and each glide stalls before it moves.
  document.documentElement.style.scrollBehavior = "auto";

  measure();
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("load", measure, { passive: true });

  document.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      startY = lastY = t.clientY;
      startT = performance.now();
      samples = [{ y: startY, t: startT }];
      decided = false;
      // The menu sheet scrolls on its own: leave touches inside it alone.
      mode = (e.target as Element | null)?.closest?.(".menu") ? "native" : "idle";
      if (mode === "native") {
        decided = true;
        return;
      }
      // A glide in progress: take over from where the page is, and move on from where it was heading.
      const heading = glideTarget;
      interrupted = heading !== null;
      stopGlide();
      if (heading === null) measure(); // layout only changes between gestures, so skip it mid-swipe
      startScroll = window.scrollY;
      anchor = heading ?? nearest(startScroll);
      lo = before(anchor) ?? anchor;
      hi = after(anchor) ?? anchor;
      // Mid-glide, the page may sit past the anchor's neighbour range on the near side: allow that too.
      lo = Math.min(lo, startScroll);
      hi = Math.max(hi, startScroll);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      const y = e.touches[0].clientY;
      lastY = y;
      samples.push({ y, t: performance.now() });
      if (samples.length > 8) samples.shift();
      if (!decided && Math.abs(startY - y) > SLOP) {
        decided = true;
        const down = startY - y > 0; // finger moving up = reading on
        const sy = window.scrollY;
        // Paged: anywhere above the paper page, or swiping back up from its very top.
        const paged = sy < pagedEnd - 2 || (!down && sy <= pagedEnd + 2);
        mode = paged ? "page" : "native";
      }
      if (mode !== "page") return;
      if (e.cancelable) e.preventDefault();
      // Follow the finger, but never past the neighbouring stops.
      const to = Math.max(lo, Math.min(hi, startScroll + (startY - y)));
      window.scrollTo(0, to);
    },
    { passive: false }
  );

  const end = () => {
    if (mode === "page") {
      const dy = startY - lastY;
      const speed = releaseSpeed();
      const avg = Math.abs(dy) / Math.max(1, performance.now() - startT);
      const swiped = Math.abs(dy) >= MIN_DIST || (Math.abs(dy) > SLOP && Math.max(avg, Math.abs(speed)) > MIN_SPEED);
      const target = swiped ? (dy > 0 ? after(anchor) : before(anchor)) ?? anchor : anchor;
      glideTo(target, Math.abs(speed));
    } else if (interrupted) {
      glideTo(anchor); // a tap during a glide: finish the glide instead of leaving the page between stops
    }
    interrupted = false;
    mode = "idle";
  };
  document.addEventListener("touchend", end, { passive: true });
  document.addEventListener("touchcancel", end, { passive: true });
}