import type { MotionValue } from "motion/react";
import AsciiScene, { region, type Cell, type Frame, type Shaded } from "./AsciiScene";

// A raised hand holding a torch, drawn like a Renaissance chalk study.
// The hand and handle are modelled as 3D primitives (capsules, rounded cones, an ellipsoid). Each cell
// gets a surface normal, is lit by the flame above, and the light becomes drawing marks: cream
// highlights, sanguine (red-chalk) midtones, hatched then cross-hatched shadows, and contour lines.
// The cup is a flat stencil; the flame is computed per cell. `power` (0 → 1) grows the flame.

const R = { SKY: 0, CUP: 1, CUP_RIM: 2, RING: 3 };

const CORE = "255,246,214";
const YELLOW = "255,210,122";
const ORANGE = "255,90,31";
const EMBER = "176,40,24";
const AMBER = "255,178,63";
const BRASS = "214,160,70";
const BRASS_DARK = "120,82,36";
// Sanguine ramp: shadow → mid → highlight.
const CHALK_DARK = "112,46,34";
const CHALK_MID = "214,128,92";
const CHALK_LIGHT = "250,222,196";

type V3 = [number, number, number];
type Mat = "skin" | "brass";
type Prim =
  | { kind: "capsule"; id: number; a: V3; b: V3; ra: number; rb: number; mat: Mat }
  | { kind: "ellipsoid"; id: number; c: V3; r: V3; mat: Mat };

// Hand in local units (x right, y up, z toward the viewer); origin at the centre of the fist.
const HAND: Prim[] = (() => {
  const p: Prim[] = [];
  let id = 1;
  // Torch handle: a slim cylinder through the fist, just behind the fingers.
  p.push({ kind: "capsule", id: id++, a: [0.015, -0.2, -0.03], b: [0.025, 0.22, -0.03], ra: 0.03, rb: 0.038, mat: "brass" });
  // Forearm: a tapering cone from the wrist down, plus a swell of muscle on the outer side.
  p.push({ kind: "capsule", id: id++, a: [0.035, -0.12, -0.05], b: [0.07, -0.95, -0.05], ra: 0.075, rb: 0.115, mat: "skin" });
  p.push({ kind: "capsule", id: id++, a: [-0.01, -0.22, -0.03], b: [0.02, -0.6, -0.04], ra: 0.06, rb: 0.085, mat: "skin" });
  // Back of the hand / palm.
  p.push({ kind: "ellipsoid", id: id++, c: [0.035, 0.0, -0.07], r: [0.115, 0.13, 0.07], mat: "skin" });
  // Four fingers, index (top) → little finger (bottom): a proximal segment from the knuckle forward,
  // then the middle segment curling across the front of the handle.
  const fingers: [number, number][] = [
    [0.085, 0.034],
    [0.028, 0.036],
    [-0.028, 0.034],
    [-0.078, 0.029],
  ];
  fingers.forEach(([y, r], i) => {
    const knuckleX = -0.095 + i * 0.006;
    p.push({ kind: "capsule", id: id++, a: [knuckleX, y + 0.004, -0.02], b: [-0.035, y - 0.004, 0.05], ra: r * 1.05, rb: r, mat: "skin" });
    p.push({ kind: "capsule", id: id++, a: [-0.035, y - 0.004, 0.05], b: [0.05 - i * 0.008, y - 0.014, 0.04], ra: r, rb: r * 0.88, mat: "skin" });
  });
  // Thumb: rises from the far side of the palm and folds over the index finger.
  p.push({ kind: "capsule", id: id++, a: [0.11, 0.0, -0.03], b: [0.07, 0.1, 0.035], ra: 0.042, rb: 0.034, mat: "skin" });
  p.push({ kind: "capsule", id: id++, a: [0.07, 0.1, 0.035], b: [-0.02, 0.125, 0.06], ra: 0.033, rb: 0.027, mat: "skin" });
  return p;
})();
const THUMB_TIP_ID = HAND[HAND.length - 1].id;

// Key light from the flame: above, slightly in front and to the right.
const LIGHT: V3 = (() => {
  const v: V3 = [0.25, 0.85, 0.47];
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
})();

type Hit = { id: number; z: number; n: V3; mat: Mat; t: number };

function hit(px: number, py: number, pr: Prim): Hit | null {
  if (pr.kind === "ellipsoid") {
    const dx = (px - pr.c[0]) / pr.r[0];
    const dy = (py - pr.c[1]) / pr.r[1];
    const d2 = dx * dx + dy * dy;
    if (d2 >= 1) return null;
    const dz = Math.sqrt(1 - d2);
    const n: V3 = [dx / pr.r[0], dy / pr.r[1], dz / pr.r[2]];
    const len = Math.hypot(...n);
    return { id: pr.id, z: pr.c[2] + dz * pr.r[2], n: [n[0] / len, n[1] / len, n[2] / len], mat: pr.mat, t: 0 };
  }
  // Capsule / rounded cone: nearest axis point in the view plane, then the sphere around it.
  const ax = pr.b[0] - pr.a[0];
  const ay = pr.b[1] - pr.a[1];
  const l2 = ax * ax + ay * ay || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - pr.a[0]) * ax + (py - pr.a[1]) * ay) / l2));
  const cx = pr.a[0] + ax * t;
  const cy = pr.a[1] + ay * t;
  const cz = pr.a[2] + (pr.b[2] - pr.a[2]) * t;
  const r = pr.ra + (pr.rb - pr.ra) * t;
  const dx = px - cx;
  const dy = py - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  const dz = Math.sqrt(r * r - d2);
  return { id: pr.id, z: cz + dz, n: [dx / r, dy / r, dz / r], mat: pr.mat, t };
}

// Local-space bounding boxes, so each cell only tests the primitives that can cover it.
const BOXES = HAND.map((pr) =>
  pr.kind === "ellipsoid"
    ? [pr.c[0] - pr.r[0], pr.c[1] - pr.r[1], pr.c[0] + pr.r[0], pr.c[1] + pr.r[1]]
    : [
        Math.min(pr.a[0], pr.b[0]) - Math.max(pr.ra, pr.rb),
        Math.min(pr.a[1], pr.b[1]) - Math.max(pr.ra, pr.rb),
        Math.max(pr.a[0], pr.b[0]) + Math.max(pr.ra, pr.rb),
        Math.max(pr.a[1], pr.b[1]) + Math.max(pr.ra, pr.rb),
      ]
);

type Geo = { cx: number; cupY: number; cupW: number; s: number; ox: number; oy: number; unit: number; tilt: number };

function paint(ctx: CanvasRenderingContext2D, w: number, h: number): Geo {
  const s = Math.min(w * 0.9, h * 0.95);
  const unit = s * 1.25; // px per local unit
  const tilt = (-7 * Math.PI) / 180;
  const ox = w * 0.5;
  const oy = h - s * 0.42; // fist centre
  const fill = (id: number) => (ctx.fillStyle = region(id));

  // Cup on top of the handle, in the same tilted frame (screen y points down).
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(tilt);
  const top = -0.22 * unit;
  const cupTop = top - 0.11 * unit;
  fill(R.RING);
  ctx.fillRect(-0.05 * unit, top + 0.01 * unit, 0.1 * unit, 0.018 * unit);
  fill(R.CUP);
  ctx.beginPath();
  ctx.moveTo(-0.045 * unit, top);
  ctx.quadraticCurveTo(-0.07 * unit, top - 0.06 * unit, -0.12 * unit, cupTop);
  ctx.lineTo(0.12 * unit, cupTop);
  ctx.quadraticCurveTo(0.07 * unit, top - 0.06 * unit, 0.045 * unit, top);
  ctx.fill();
  fill(R.CUP_RIM);
  ctx.fillRect(-0.125 * unit, cupTop - 0.015 * unit, 0.25 * unit, 0.022 * unit);
  ctx.restore();

  const ly = cupTop - 0.015 * unit;
  return { cx: ox - ly * Math.sin(tilt), cupY: oy + ly * Math.cos(tilt), cupW: 0.12 * unit, s, ox, oy, unit, tilt };
}

// The hand doesn't move, so its shading is computed once per layout and cached per cell.
type HandCell = { id: number; light: number; mat: Mat; edge: number; nail: boolean } | null;
let handCache: { key: string; cells: HandCell[] } = { key: "", cells: [] };

function handCells(f: Frame<Geo>) {
  const key = `${f.cols}x${f.rows}:${f.w}x${f.h}`;
  if (handCache.key === key) return handCache.cells;
  const { geo: g, cols, rows } = f;
  const cw = f.w / cols;
  const ch = f.h / rows;
  const cos = Math.cos(-g.tilt);
  const sin = Math.sin(-g.tilt);
  const ids = new Int16Array(cols * rows);
  const zs = new Float32Array(cols * rows);
  const cells: HandCell[] = new Array(cols * rows).fill(null);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Screen → local: undo the tilt, flip y, scale to units.
      const sx = (c + 0.5) * cw - g.ox;
      const sy = (r + 0.5) * ch - g.oy;
      const lx = (sx * cos - sy * sin) / g.unit;
      const ly = -(sx * sin + sy * cos) / g.unit;
      let best: Hit | null = null;
      for (let k = 0; k < HAND.length; k++) {
        const b = BOXES[k];
        if (lx < b[0] || ly < b[1] || lx > b[2] || ly > b[3]) continue;
        const hh = hit(lx, ly, HAND[k]);
        if (hh && (!best || hh.z > best.z)) best = hh;
      }
      if (!best) continue;
      const lambert = Math.max(0, best.n[0] * LIGHT[0] + best.n[1] * LIGHT[1] + best.n[2] * LIGHT[2]);
      const nail = best.id === THUMB_TIP_ID && best.t > 0.6 && best.n[2] > 0.7 && best.n[1] > -0.1;
      ids[r * cols + c] = best.id;
      zs[r * cols + c] = best.z;
      cells[r * cols + c] = { id: best.id, light: Math.min(1, 0.12 + lambert * 0.95), mat: best.mat, edge: 0, nail };
    }
  }
  // Contours: silhouette edges, and creases where a form tucks behind a nearer one.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = cells[r * cols + c];
      if (!k) continue;
      const i = r * cols + c;
      for (const [dc, dr] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const cc = c + dc;
        const rr = r + dr;
        if (cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
        const j = rr * cols + cc;
        if (!cells[j]) k.edge = Math.max(k.edge, 1);
        else if (ids[j] !== ids[i] && zs[j] > zs[i] + 0.004) k.edge = Math.max(k.edge, 2);
      }
    }
  }
  handCache = { key, cells };
  return cells;
}

const mix = (a: string, b: string, t: number) => {
  const A = a.split(",").map(Number);
  const B = b.split(",").map(Number);
  const k = Math.max(0, Math.min(1, t));
  return A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",");
};
function flameNoise(x: number, y: number, t: number) {
  const a = Math.sin(x * 9 + t * 3.1) * 0.5 + Math.sin(y * 7 - t * 5.3 + x * 3) * 0.5;
  return a * 0.6 + Math.sin(x * 23 - t * 7 + y * 11) * 0.25;
}
const n2 = (x: number, y: number) => {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function shade(c: Cell, f: Frame<Geo>): Shaded {
  const { geo: g, t, power } = f;
  const flameH = g.s * (0.16 + power * 0.56);
  const dx = (c.x - g.cx) / g.cupW;
  const up = (g.cupY - c.y) / flameH;
  const glowD = Math.hypot(c.x - g.cx, c.y - (g.cupY - flameH * 0.35));
  const glow = (0.25 + power * 0.75) * Math.exp(-glowD / (g.s * 0.22));
  const flicker = 0.92 + 0.08 * Math.sin(t * 11) * Math.sin(t * 7.3);

  if (c.region === R.CUP) {
    if (c.left === R.SKY || c.right === R.SKY) return [c.left === R.SKY ? "\\" : "/", BRASS, 0.95, "40,24,18"];
    return [c.seed > 0.5 ? "#" : "%", mix(BRASS_DARK, AMBER, 0.4 + glow * 0.5), 0.85, "40,24,18"];
  }
  if (c.region === R.CUP_RIM) return ["=", mix(BRASS, CORE, power * 0.5), 0.95, "60,36,18"];
  if (c.region === R.RING) return ["=", BRASS, 0.95, "50,30,18"];

  const hc = handCells(f)[c.row * f.cols + c.col];
  if (hc) {
    const L = Math.min(1, hc.light * flicker * (0.75 + power * 0.3));
    if (hc.mat === "brass") return [L > 0.85 ? "@" : L > 0.6 ? "|" : ":", mix(BRASS_DARK, CORE, L), 0.9, "24,16,14"];
    if (hc.nail) return ["=", CHALK_LIGHT, 0.75, "30,18,16"];
    if (hc.edge === 1) return ["(", mix(CHALK_MID, AMBER, L), 0.95, "14,10,14"];
    if (hc.edge === 2) return ["-", CHALK_DARK, 0.9, "14,10,14"];
    // Light → marks: dense warm highlights, sanguine midtones, hatched then cross-hatched shadows.
    let glyph: string;
    if (L > 0.86) glyph = "@";
    else if (L > 0.74) glyph = "%";
    else if (L > 0.62) glyph = "*";
    else if (L > 0.5) glyph = "+";
    else if (L > 0.38) glyph = (c.col + c.row) % 2 ? "/" : "'";
    else if (L > 0.26) glyph = "/";
    else if (L > 0.16) glyph = (c.col + c.row) % 2 ? "x" : "/";
    else glyph = "x";
    const rgb = L > 0.6 ? mix(CHALK_MID, CHALK_LIGHT, (L - 0.6) / 0.4) : mix(CHALK_DARK, CHALK_MID, L / 0.6);
    return [glyph, rgb, 0.45 + L * 0.55, "18,12,16"];
  }

  // Flame: a teardrop whose edge breaks into licking tongues near the top.
  if (up > -0.04 && up < 1.25) {
    const u = Math.max(0, up);
    const body = 1.55 * Math.pow(Math.max(0, 1 - u), 0.6) * (0.6 + 0.4 * Math.sin(Math.min(1, u * 3) * (Math.PI / 2)));
    const tongues = (Math.sin(dx * 2.6 + t * 4 + u * 5) * 0.5 + Math.sin(dx * 5.3 - t * 6.5) * 0.3) * (0.1 + u * 0.7);
    const lick = flameNoise(dx * 0.35, u * 1.6, t) * (0.15 + u * 0.55);
    const edge = body + tongues * 0.35 + lick - Math.abs(dx);
    if (edge > 0) {
      const heat = Math.min(1, edge * 0.75 * (1.2 - u) + (u < 0.2 ? 0.15 : 0));
      const glyph = heat > 0.8 ? "@" : heat > 0.6 ? "#" : heat > 0.42 ? "*" : heat > 0.26 ? "+" : heat > 0.12 ? "^" : "'";
      const rgb = heat > 0.72 ? mix(YELLOW, CORE, (heat - 0.72) / 0.28) : heat > 0.35 ? mix(ORANGE, YELLOW, (heat - 0.35) / 0.37) : mix(EMBER, ORANGE, heat / 0.35);
      return [glyph, rgb, 0.4 + heat * 0.6];
    }
  }
  // Embers drifting up.
  if (power > 0.2) {
    const lane = Math.floor(c.col / 2);
    const rise = (t * (0.5 + n2(lane, 1) * 0.6) + n2(lane, 2)) % 1;
    const ey = g.cupY - flameH * (0.6 + rise * 1.6);
    const ex = g.cx + (n2(lane, 3) - 0.5) * g.s * 0.5 * rise + Math.sin(t * 2 + lane) * 6;
    if (Math.abs(c.y - ey) < 5 && Math.abs(c.x - ex) < 4 && n2(lane, 4) < power * 0.6) return [".", AMBER, (1 - rise) * 0.9];
  }
  if (glow > 0.07) return [glow > 0.35 ? ":" : ".", mix(EMBER, AMBER, glow), glow * 0.8];
  return c.seed > 0.992 ? [".", "243,239,230", 0.2] : null;
}

export default function TorchScene({ power }: { power: MotionValue<number> }) {
  return (
    <AsciiScene
      label="A raised hand holding a torch, drawn like a Renaissance chalk study in ASCII, its flame growing into a blaze"
      paint={paint}
      shade={shade}
      power={power}
      cell={6}
      fps={24}
    />
  );
}
