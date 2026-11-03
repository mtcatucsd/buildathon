// Rough device class, read once.
// Phones have ~¼ of a laptop's pixels, so they can use laptop-sized (or finer) ASCII cells and still
// draw fewer cells per frame than a laptop does. They only get a slightly lower frame rate.
const small = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760);

export const device = {
  small,
  reducedMotion: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  // Phones render at their true density (up to 3×) so glyphs stay razor-sharp; their canvases are small
  // enough that this stays cheap. Laptops cap at 2×.
  dpr: typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, small ? 3 : 2) : 1,
  fps: small ? 24 : 30,
  // Scenes are shown smaller on phones, so cells shrink with them to keep the same level of detail.
  cellScale: small ? 0.72 : 1,
};
