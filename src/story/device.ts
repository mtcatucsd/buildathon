// Rough device class, read once. Phones get the same art as laptops: the same compositions and the same
// level of detail. The glyph grid scales with the screen, so a scene has about as many characters across
// its subject as on a laptop (a phone's art is physically smaller, so its glyphs are too).
const w = typeof window !== "undefined" ? window.innerWidth : 1440;
const small = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || w < 760);

export const device = {
  small,
  reducedMotion: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  // Render at the screen's true density (phones are up to 3×) so glyphs stay razor-sharp.
  dpr: typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, small ? 3 : 2) : 1,
  // 24 frames a second reads as smooth for drifting ASCII and spares a phone's battery.
  fps: small ? 24 : 30,
  cellScale:
    Math.max(0.7, Math.min(1, w / 900)) *
    // Dev only: ?cs=0.6 multiplies the glyph size, for side-by-side detail comparisons.
    (import.meta.env.DEV && typeof location !== "undefined" ? Number(new URLSearchParams(location.search).get("cs") ?? 1) : 1),
};
