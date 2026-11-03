// Rough device class, read once. Phones get coarser ASCII grids, lower canvas resolution and fewer frames.
const small = typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760);

export const device = {
  small,
  reducedMotion: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  dpr: typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2) : 1,
  fps: small ? 24 : 30,
  cellScale: small ? 1.2 : 1,
};
