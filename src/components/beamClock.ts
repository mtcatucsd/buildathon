// Shared lighthouse clock: everything that reacts to the beam reads the same angle,
// so the visible cone and the ASCII reveal stay in sync.
export const BEAM_PERIOD = 9000; // ms for one full left→right→left sweep
export const BEAM_SWING = 62; // degrees either side of straight down
export const BEAM_WIDTH = 13; // half-width of the lit cone, degrees

let frozen: number | null = null;

// The flyer freezes the beam at a fixed angle so screenshots are deterministic.
export function freezeBeam(angle: number | null) {
  frozen = angle;
}

export function beamAngle(now = performance.now()) {
  if (frozen !== null) return frozen;
  return Math.sin((now / BEAM_PERIOD) * Math.PI * 2) * BEAM_SWING;
}

// Lamp position in viewport coordinates; Beam.tsx owns the element that defines it.
export const lamp = { x: 0, y: 0 };

// 0..1 brightness of a viewport point under the beam (soft edge).
export function beamLight(px: number, py: number, angle: number) {
  const dx = px - lamp.x;
  const dy = py - lamp.y;
  if (dy <= 0) return 0;
  const a = (Math.atan2(dx, dy) * 180) / Math.PI; // 0 = straight down, +right
  const off = Math.abs(-a - angle);
  return Math.max(0, Math.min(1, (BEAM_WIDTH - off) / (BEAM_WIDTH * 0.45)));
}
