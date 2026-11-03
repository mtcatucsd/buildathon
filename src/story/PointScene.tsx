import type { MotionValue } from "motion/react";
import AsciiScene, { type Cell, type Frame, type Shaded } from "./AsciiScene";

// The closing image: a hand pointing straight out of the screen at the viewer, drawn like a Renaissance chalk study.
// The hand is built from 3D primitives (capsules, an ellipsoid); every cell gets a surface normal and the
// light becomes drawing marks: cream highlights, sanguine midtones, hatched and cross-hatched shadows,
// contour lines and creases. `power` (0 → 1) pushes the hand toward the viewer as you scroll.

// Sanguine (red chalk) ramp: shadow → mid → highlight; the cuff is in white chalk.
const CHALK_DARK = "112,46,34";
const CHALK_MID = "214,128,92";
const CHALK_LIGHT = "250,222,196";
const CLOTH_DARK = "70,64,80";
const CLOTH_LIGHT = "236,230,220";
const LAMP = "255,178,63";

type V3 = [number, number, number];
type Mat = "skin" | "cloth" | "sleeve";
type Prim =
  | { kind: "capsule"; id: number; a: V3; b: V3; ra: number; rb: number; mat: Mat }
  | { kind: "ellipsoid"; id: number; c: V3; r: V3; mat: Mat };

// Hand in local units (x right, y up, z toward the viewer), seen in perspective. The index finger
// points straight out of the screen at the viewer; behind it the curled fingers, the thumb pressed
// alongside, the knuckles, and the sleeve receding into depth.
const HAND: Prim[] = (() => {
  const p: Prim[] = [];
  let id = 1;
  // Dark coat sleeve, white shirt cuff and wrist, receding back toward the lower left.
  p.push({ kind: "capsule", id: id++, a: [-0.5, -0.7, -0.65], b: [-0.3, -0.42, -0.4], ra: 0.19, rb: 0.17, mat: "sleeve" });
  p.push({ kind: "capsule", id: id++, a: [-0.3, -0.42, -0.4], b: [-0.17, -0.22, -0.22], ra: 0.13, rb: 0.12, mat: "cloth" });
  p.push({ kind: "capsule", id: id++, a: [-0.17, -0.22, -0.22], b: [-0.02, -0.06, -0.06], ra: 0.105, rb: 0.098, mat: "skin" });
  // Back of the hand, tipped toward the viewer.
  p.push({ kind: "ellipsoid", id: id++, c: [0.03, 0.0, -0.03], r: [0.15, 0.12, 0.085], mat: "skin" });
  // Knuckles along the top.
  for (const [x, y, z, r] of [
    [-0.075, 0.075, 0.04, 0.036],
    [-0.01, 0.085, 0.03, 0.035],
    [0.055, 0.075, 0.01, 0.033],
    [0.11, 0.05, -0.01, 0.028],
  ] as const)
    p.push({ kind: "capsule", id: id++, a: [x, y, z], b: [x, y - 0.005, z], ra: r, rb: r, mat: "skin" });
  // Middle, ring and little fingers, curled into the palm: down and toward us, then back under.
  for (const [x, r] of [
    [-0.01, 0.038],
    [0.055, 0.035],
    [0.11, 0.03],
  ] as const) {
    p.push({ kind: "capsule", id: id++, a: [x, 0.06, 0.05], b: [x - 0.005, -0.04, 0.12], ra: r, rb: r * 0.95, mat: "skin" });
    p.push({ kind: "capsule", id: id++, a: [x - 0.005, -0.04, 0.12], b: [x + 0.005, -0.1, 0.05], ra: r * 0.95, rb: r * 0.85, mat: "skin" });
  }
  // Thumb, pressed along the curled middle finger.
  p.push({ kind: "capsule", id: id++, a: [-0.15, -0.01, -0.03], b: [-0.11, -0.07, 0.09], ra: 0.048, rb: 0.04, mat: "skin" });
  p.push({ kind: "capsule", id: id++, a: [-0.11, -0.07, 0.09], b: [-0.03, -0.09, 0.15], ra: 0.04, rb: 0.033, mat: "skin" });
  // The index finger, pointing straight at the viewer (and a touch down): knuckle → tip.
  // Aimed almost straight at the viewer's eye (a touch down and left), so the shaft stays short
  // and the tip swells: the foreshortened point of a recruiting poster.
  const K: V3 = [-0.03, 0.08, 0.06];
  const aim: V3 = [-0.035, -0.05, 0.82];
  const along = (z: number): V3 => {
    const s = (z - K[2]) / (aim[2] - K[2]);
    return [K[0] + (aim[0] - K[0]) * s, K[1] + (aim[1] - K[1]) * s, z];
  };
  p.push({ kind: "capsule", id: id++, a: K, b: along(0.22), ra: 0.048, rb: 0.045, mat: "skin" });
  p.push({ kind: "capsule", id: id++, a: along(0.22), b: along(0.36), ra: 0.045, rb: 0.042, mat: "skin" });
  p.push({ kind: "capsule", id: id++, a: along(0.36), b: along(0.48), ra: 0.042, rb: 0.04, mat: "skin" });
  return p;
})();
const TIP_ID = HAND[HAND.length - 1].id;
const INDEX_IDS = new Set(HAND.slice(-3).map((p) => p.id));

// Key light from the upper left and in front, like a north-lit studio.
const LIGHT: V3 = (() => {
  const v: V3 = [-0.45, 0.6, 0.66];
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
})();

// Perspective: things nearer the viewer (larger z) appear bigger. The eye sits at z = EYE.
const EYE = 0.82;

// Every capsule becomes a chain of spheres; perspective is applied per sphere, which is what makes
// a finger pointing straight out read as foreshortened.
type Sphere = { id: number; c: V3; r: number; mat: Mat; t: number };
function spheres(push: number): { list: Sphere[]; ellipsoids: Extract<Prim, { kind: "ellipsoid" }>[] } {
  const list: Sphere[] = [];
  const ellipsoids: Extract<Prim, { kind: "ellipsoid" }>[] = [];
  const dz = push * 0.12; // the whole hand moves toward the viewer as you scroll
  for (const pr of HAND) {
    if (pr.kind === "ellipsoid") {
      ellipsoids.push({ ...pr, c: [pr.c[0], pr.c[1], pr.c[2] + dz] });
      continue;
    }
    const len = Math.hypot(pr.b[0] - pr.a[0], pr.b[1] - pr.a[1], pr.b[2] - pr.a[2]);
    const steps = Math.max(1, Math.min(40, Math.ceil(len / (Math.min(pr.ra, pr.rb) * 0.35))));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      list.push({
        id: pr.id,
        c: [pr.a[0] + (pr.b[0] - pr.a[0]) * t, pr.a[1] + (pr.b[1] - pr.a[1]) * t, pr.a[2] + (pr.b[2] - pr.a[2]) * t + dz],
        r: pr.ra + (pr.rb - pr.ra) * t,
        mat: pr.mat,
        t,
      });
    }
  }
  return { list, ellipsoids };
}

type Hit = { id: number; z: number; n: V3; mat: Mat; t: number };

// px, py: screen position in local units (already divided by the base scale).
function hitSphere(px: number, py: number, s: Sphere): Hit | null {
  const k = EYE / (EYE - s.c[2]);
  const dx = px - s.c[0] * k;
  const dy = py - s.c[1] * k;
  const rr = s.r * k;
  const d2 = dx * dx + dy * dy;
  if (d2 >= rr * rr) return null;
  const dz = Math.sqrt(rr * rr - d2);
  return { id: s.id, z: s.c[2] + dz / k, n: [dx / rr, dy / rr, dz / rr], mat: s.mat, t: s.t };
}
function hitEllipsoid(px: number, py: number, e: Extract<Prim, { kind: "ellipsoid" }>): Hit | null {
  const k = EYE / (EYE - e.c[2]);
  const dx = (px - e.c[0] * k) / (e.r[0] * k);
  const dy = (py - e.c[1] * k) / (e.r[1] * k);
  const d2 = dx * dx + dy * dy;
  if (d2 >= 1) return null;
  const dz = Math.sqrt(1 - d2);
  const n: V3 = [dx / e.r[0], dy / e.r[1], dz / e.r[2]];
  const len = Math.hypot(...n);
  return { id: e.id, z: e.c[2] + dz * e.r[2], n: [n[0] / len, n[1] / len, n[2] / len], mat: e.mat, t: 0 };
}

type Geo = { ox: number; oy: number; unit: number };

function paint(_ctx: CanvasRenderingContext2D, w: number, h: number): Geo {
  const unit = Math.min(w * 1.25, h * 1.05);
  return { ox: w * 0.55, oy: h * 0.46, unit: unit * 0.78 };
}

// Shading is cached per layout and per (quantised) push, since the hand only moves with scroll.
type HandCell = { id: number; light: number; mat: Mat; edge: number; nail: boolean; joint: boolean } | null;
let handCache: { key: string; cells: HandCell[] } = { key: "", cells: [] };

function handCells(f: Frame<Geo>) {
  const push = Math.round(f.power * 6) / 6;
  const key = `${f.cols}x${f.rows}:${f.w}x${f.h}:${push}`;
  if (handCache.key === key) return handCache.cells;
  const { geo: g, cols, rows } = f;
  const cw = f.w / cols;
  const ch = f.h / rows;
  const { list, ellipsoids } = spheres(push);
  const ids = new Int16Array(cols * rows);
  const zs = new Float32Array(cols * rows);
  const cells: HandCell[] = new Array(cols * rows).fill(null);
  // Z-buffer rasterisation: each sphere only visits the cells under its projected disc,
  // instead of every cell testing every sphere.
  const best: (Hit | null)[] = new Array(cols * rows).fill(null);
  const consider = (r: number, c: number, hh: Hit | null) => {
    if (!hh) return;
    const i = r * cols + c;
    const b = best[i];
    if (!b || hh.z > b.z) best[i] = hh;
  };
  const visit = (cx: number, cy: number, rr: number, test: (lx: number, ly: number) => Hit | null) => {
    // cx, cy, rr in local units → cell bounds.
    const c0 = Math.max(0, Math.floor((g.ox + (cx - rr) * g.unit) / cw));
    const c1 = Math.min(cols - 1, Math.ceil((g.ox + (cx + rr) * g.unit) / cw));
    const r0 = Math.max(0, Math.floor((g.oy - (cy + rr) * g.unit) / ch));
    const r1 = Math.min(rows - 1, Math.ceil((g.oy - (cy - rr) * g.unit) / ch));
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) consider(r, c, test(((c + 0.5) * cw - g.ox) / g.unit, -((r + 0.5) * ch - g.oy) / g.unit));
  };
  for (const sp of list) {
    const k = EYE / (EYE - sp.c[2]);
    visit(sp.c[0] * k, sp.c[1] * k, sp.r * k, (lx, ly) => hitSphere(lx, ly, sp));
  }
  for (const e of ellipsoids) {
    const k = EYE / (EYE - e.c[2]);
    visit(e.c[0] * k, e.c[1] * k, Math.max(e.r[0], e.r[1]) * k, (lx, ly) => hitEllipsoid(lx, ly, e));
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hb = best[r * cols + c];
      if (!hb) continue;
      const lambert = Math.max(0, hb.n[0] * LIGHT[0] + hb.n[1] * LIGHT[1] + hb.n[2] * LIGHT[2]);
      // Fingernail on top of the pointing fingertip.
      const nail = hb.id === TIP_ID && hb.t > 0.5 && hb.n[1] > 0.35 && hb.n[0] < 0.3 && hb.n[2] > 0.25;
      // Joint creases where a finger segment begins.
      const joint = hb.mat === "skin" && hb.t > 0.01 && hb.t < 0.07 && (INDEX_IDS.has(hb.id) || hb.id > 8);
      // Depth cue: nearer forms are brighter, so the fingertip leads and the arm falls back.
      const near = Math.max(0, Math.min(1, (hb.z + 0.3) / 0.78));
      const light = Math.min(1, (0.06 + Math.pow(lambert, 1.2) * 0.88 + Math.max(0, hb.n[2]) * 0.08) * (hb.mat === "skin" ? 0.5 + near * 0.7 : 0.2 + near * 0.9));
      ids[r * cols + c] = hb.id;
      zs[r * cols + c] = hb.z;
      cells[r * cols + c] = { id: hb.id, light, mat: hb.mat, edge: 0, nail, joint };
    }
  }
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
        else if (ids[j] !== ids[i] && zs[j] > zs[i] + 0.008) k.edge = Math.max(k.edge, 2);
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

function shade(c: Cell, f: Frame<Geo>): Shaded {
  const hc = handCells(f)[c.row * f.cols + c.col];
  if (!hc) return c.seed > 0.994 ? [".", "243,239,230", 0.18] : null;
  const L = hc.light;
  if (hc.mat === "sleeve") {
    // Dark coat: broad diagonal strokes, a lit edge along the top.
    // Kept faint so it reads as a suggestion and the hand stays the focus.
    if (hc.edge === 1) return ["/", mix("60,56,80", CLOTH_LIGHT, L * 0.3), 0.35];
    return (c.col + c.row) % 3 === 0 ? ["/", mix("44,40,64", "120,114,140", L), 0.15 + L * 0.2] : null;
  }
  if (hc.mat === "cloth") {
    // White-chalk drapery: long folds as vertical-ish strokes.
    if (hc.edge === 1) return ["(", mix(CLOTH_DARK, CLOTH_LIGHT, 0.6), 0.6];
    const fold = Math.sin(c.col * 0.9 + c.row * 0.5) > 0.3;
    const glyph = L > 0.6 ? (fold ? ")" : "=") : L > 0.35 ? "/" : ".";
    return [glyph, mix(CLOTH_DARK, CLOTH_LIGHT, L), 0.25 + L * 0.45];
  }
  if (hc.nail) return ["=", CHALK_LIGHT, 0.85, "34,20,18"];
  if (hc.edge === 1) return ["(", mix(CHALK_MID, LAMP, L * 0.6), 0.95, "14,10,14"];
  if (hc.edge === 2) return ["-", CHALK_DARK, 0.95, "14,10,14"];
  if (hc.joint) return [":", CHALK_DARK, 0.8, "20,12,14"];
  // Light → marks: dense warm highlights, sanguine midtones, hatched then cross-hatched shadows.
  let glyph: string;
  if (L > 0.93) glyph = "@";
  else if (L > 0.82) glyph = "%";
  else if (L > 0.68) glyph = "*";
  else if (L > 0.52) glyph = "+";
  else if (L > 0.38) glyph = (c.col + c.row) % 2 ? "/" : "'";
  else if (L > 0.26) glyph = "/";
  else if (L > 0.16) glyph = (c.col + c.row) % 2 ? "x" : "/";
  else glyph = "x";
  const rgb = L > 0.6 ? mix(CHALK_MID, CHALK_LIGHT, (L - 0.6) / 0.4) : mix(CHALK_DARK, CHALK_MID, L / 0.6);
  return [glyph, rgb, 0.45 + L * 0.55, "18,12,16"];
}

export default function PointScene({ power }: { power: MotionValue<number> }) {
  return (
    <AsciiScene
      label="A hand drawn like a Renaissance chalk study, pointing straight out of the screen at you"
      paint={paint}
      shade={shade}
      power={power}
      cell={5}
      still
    />
  );
}
