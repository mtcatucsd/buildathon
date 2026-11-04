import type { MotionValue } from "motion/react";
import AsciiScene, { region, type Cell, type Frame, type Shaded } from "./AsciiScene";
import { rng } from "./rng";
import { stageFrame } from "./stageFrame";

// Beyond the Bubble: a team working inside a glass bubble, ideas bouncing off the inside of the glass.
// Three judges wait outside: two from Manara West (left) and one from MTC (right), each tagged.
// `power`: 0–0.38 intact (iridescent glass, rim light, window reflection) · 0.38–0.6 cracks spread
// · 0.6–1 the bubble shatters, the ideas fly out to the judges and conversation lines connect them.
// People and furniture are a stencil; the glass, cracks and shards are computed per cell.

const R = { SKY: 0, FLOOR: 1, TABLE: 2, LAPTOP: 3, SCREEN: 4, PERSON: 5, FACE: 6, JUDGE: 7, CLIPBOARD: 8, JHEAD: 9 };
// Skin tones and shirt colours, varied per person.
const SKIN = ["222,170,128", "190,128,90", "146,96,66", "206,150,110"];
const SHIRTS = ["255,90,31", "86,140,210", "110,176,120"];

const CREAM = "243,239,230";
const LAMP = "255,178,63";
const EMBER = "255,90,31";
const STATIC = "138,132,148";
const VIOLET = "150,120,230";
const CYAN = "110,200,230";
const INK = "16,13,20";
const SHADOW = "26,22,32";
// Judge organisations, in their brand colours.
const ORGS = {
  manara: { rgb: "183,80,186" },
  mtc: { rgb: "239,194,91" },
} as const;
type Org = keyof typeof ORGS;
const IDEAS = "{}<>/?!*+#";
// Statue gold: shadow → body → highlight.
const GOLD_LO = "150,104,34";
const GOLD = "226,170,64";
const GOLD_HI = "255,232,160";

type Shard = { ax: number; ay: number; dir: [number, number]; spin: number; speed: number };
type Geo = {
  cx: number;
  cy: number;
  r: number;
  judges: { x: number; y: number; head: number; floor: number; org: Org }[];
  ps: number;
  team: { x: number; y: number };
  cracks: [number, number][][]; // polylines in bubble units (−1..1)
  shards: Shard[];
};

function person(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, faceId: number, bodyId: number, i = 0) {
  ctx.fillStyle = region(bodyId, i);
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.95, s * 0.75, s * 0.6, 0, Math.PI, 0); // shoulders
  ctx.fill();
  ctx.fillRect(x - s * 0.75, y + s * 0.95, s * 1.5, s * 0.4);
  ctx.fillRect(x - s * 0.14, y + s * 0.3, s * 0.28, s * 0.35); // neck
  ctx.fillStyle = region(faceId, i);
  ctx.beginPath();
  ctx.ellipse(x, y, s * 0.36, s * 0.44, 0, 0, Math.PI * 2); // head
  ctx.fill();
}

function standing(ctx: CanvasRenderingContext2D, x: number, floor: number, s: number, i: number) {
  ctx.fillStyle = region(R.JUDGE, i);
  const head = floor - s * 3.4;
  ctx.fillRect(x - s * 0.13, head + s * 0.25, s * 0.26, s * 0.55); // neck
  ctx.beginPath();
  ctx.moveTo(x - s * 0.62, head + s * 0.75);
  ctx.quadraticCurveTo(x, head + s * 0.45, x + s * 0.62, head + s * 0.75);
  ctx.lineTo(x + s * 0.52, head + s * 2.2);
  ctx.lineTo(x - s * 0.52, head + s * 2.2);
  ctx.fill();
  ctx.fillRect(x - s * 0.46, head + s * 2.2, s * 0.36, floor - head - s * 2.2); // legs
  ctx.fillRect(x + s * 0.1, head + s * 2.2, s * 0.36, floor - head - s * 2.2);
  ctx.fillStyle = region(R.JHEAD, i);
  ctx.beginPath();
  ctx.ellipse(x, head, s * 0.32, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = region(R.CLIPBOARD, i);
  ctx.fillRect(x - s * 0.15, head + s * 1.1, s * 0.6, s * 0.75);
}

// Shared layout. Wide boxes: bubble centred, two Manara judges on the
// left, the MTC judge on the right. Tall boxes (phones): a bigger bubble up top, judges in a row below.
export function layout(w: number, h: number) {
  const portrait = w / h < 1.15;
  // Tall boxes: compose within the upper subject area; the floor carries on below it.
  const fr = stageFrame(w, h);
  const ah = fr.tall ? fr.h : h;
  const at = fr.tall ? fr.top : 0;
  // Portrait budget (as a share of the free height above the text card): bubble ~62%, judges ~21%, and the
  // last ~10% left clear so the judges' feet never touch the card.
  const r = portrait ? Math.min(w * 0.44, ah * 0.31) : Math.min(w * 0.24, h * 0.34);
  const cx = w / 2;
  const cy = portrait ? at + r + ah * 0.02 : h * 0.47;
  const floor = cy + r * 0.98;
  const ps = r * 0.17;
  const js = ps * (portrait ? 1.15 : 1.0);
  const judgeFloor = portrait ? at + ah * 0.9 : floor;
  const spots: [number, Org][] = portrait
    ? [
        [-0.95, "manara"],
        [0, "mtc"],
        [0.95, "manara"],
      ]
    : [
        [-1.85, "manara"],
        [-1.38, "manara"],
        [1.6, "mtc"],
      ];
  const judges = spots.map(([k, org]) => ({ x: cx + r * k, y: judgeFloor - js * 3.4, head: judgeFloor - js * 3.4, floor: judgeFloor, org }));
  return { portrait, cx, cy, r, floor, ps, js, judges };
}

function paint(ctx: CanvasRenderingContext2D, w: number, h: number): Geo {
  const { cx, cy, r, floor, ps, js, judges } = layout(w, h);
  const rand = rng(5);

  ctx.fillStyle = region(R.FLOOR);
  ctx.fillRect(0, floor, w, h - floor);

  // The team: three people behind a table, laptops open in front of them.
  const tableY = cy + r * 0.45;
  [-1, 0, 1].forEach((k, i) => person(ctx, cx + k * ps * 2.3, tableY - ps * 1.15 + Math.abs(k) * ps * 0.15, ps, R.FACE, R.PERSON, i));
  ctx.fillStyle = region(R.TABLE);
  ctx.fillRect(cx - r * 0.62, tableY, r * 1.24, ps * 0.32);
  ctx.fillRect(cx - r * 0.55, tableY + ps * 0.32, ps * 0.22, floor - tableY - ps * 0.32);
  ctx.fillRect(cx + r * 0.55 - ps * 0.22, tableY + ps * 0.32, ps * 0.22, floor - tableY - ps * 0.32);
  [-1, 0, 1].forEach((k) => {
    const lx = cx + k * ps * 2.3;
    ctx.fillStyle = region(R.LAPTOP);
    ctx.beginPath();
    ctx.moveTo(lx - ps * 0.7, tableY);
    ctx.lineTo(lx - ps * 0.6, tableY - ps * 0.85);
    ctx.lineTo(lx + ps * 0.6, tableY - ps * 0.85);
    ctx.lineTo(lx + ps * 0.7, tableY);
    ctx.fill();
    ctx.fillStyle = region(R.SCREEN); // glowing logo spot on the lid
    ctx.beginPath();
    ctx.arc(lx, tableY - ps * 0.45, ps * 0.12, 0, Math.PI * 2);
    ctx.fill();
  });

  // Three judges outside: two from Manara West, one from MTC.
  judges.forEach((j, i) => standing(ctx, j.x, j.floor, js, i));

  // Cracks: branching polylines from an impact point, in bubble units.
  const cracks: [number, number][][] = [];
  const impact: [number, number] = [0.42, -0.45];
  for (let k = 0; k < 9; k++) {
    let x = impact[0];
    let y = impact[1];
    let a = (k / 9) * Math.PI * 2 + rand() * 0.4;
    const line: [number, number][] = [[x, y]];
    for (let st = 0; st < 9; st++) {
      a += (rand() - 0.5) * 0.8;
      x += Math.cos(a) * 0.14;
      y += Math.sin(a) * 0.14;
      if (x * x + y * y > 1) break;
      line.push([x, y]);
      if (rand() > 0.72) {
        // A short side branch.
        const b = a + (rand() > 0.5 ? 0.9 : -0.9);
        cracks.push([[x, y], [x + Math.cos(b) * 0.16, y + Math.sin(b) * 0.16]]);
      }
    }
    cracks.push(line);
  }

  // Shards: Voronoi cells around seeds spread across the sphere, each flying outward from the impact.
  const shards: Shard[] = [];
  for (let i = 0; i < 22; i++) {
    const ang = rand() * Math.PI * 2;
    const rad = Math.sqrt(rand()) * 0.95;
    const ax = Math.cos(ang) * rad;
    const ay = Math.sin(ang) * rad;
    const d = Math.hypot(ax - impact[0] * 0.3, ay - impact[1] * 0.3) || 1;
    shards.push({ ax, ay, dir: [(ax - impact[0] * 0.3) / d, (ay - impact[1] * 0.3) / d], spin: (rand() - 0.5) * 2, speed: 0.7 + rand() * 0.9 });
  }

  return { cx, cy, r, judges, ps: js, team: { x: cx, y: tableY - ps * 1.15 }, cracks, shards };
}

const mix = (a: string, b: string, t: number) => {
  const A = a.split(",").map(Number);
  const B = b.split(",").map(Number);
  const k = Math.max(0, Math.min(1, t));
  return A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",");
};

// Thin-film (soap bubble) colour: cycles lamplight → ember → violet → cyan with angle and thickness.
function film(v: number) {
  const stops = [LAMP, EMBER, VIOLET, CYAN, LAMP];
  const x = (((v % 1) + 1) % 1) * 4;
  const i = Math.floor(x);
  return mix(stops[i], stops[i + 1], x - i);
}

// Glass at bubble-space point (u, v) (unit sphere), or null.
function glass(u: number, v: number, t: number, shatter: number): Shaded {
  const d2 = u * u + v * v;
  if (d2 > 1) return null;
  const nz = Math.sqrt(1 - d2);
  const fres = Math.pow(1 - nz, 2.2);
  // Window reflection: two panes, upper-left.
  const inWin = u > -0.66 && u < -0.24 && v > -0.66 && v < -0.3 && Math.abs(u + 0.45) > 0.025 && Math.abs(v + 0.48) > 0.025;
  if (inWin) return ["#", CREAM, 0.55 * (1 - shatter * 0.3)];
  if (Math.hypot(u - 0.48, v - 0.55) < 0.06) return ["o", CREAM, 0.5];
  const rgb = film(Math.atan2(v, u) / (Math.PI * 2) + fres * 1.6 + t * 0.05);
  if (fres > 0.42) {
    const a = Math.atan2(v, u);
    // Specular rim: a bright arc along the upper left where the light catches the glass.
    if (a < -1.75 && a > -2.9 && fres > 0.6) return [Math.abs(Math.cos(a)) > 0.7 ? "(" : "-", CREAM, 0.95];
    const glyph = Math.abs(Math.cos(a)) > 0.92 ? "|" : Math.abs(Math.sin(a)) > 0.92 ? "-" : Math.cos(a) * Math.sin(a) > 0 ? "\\" : "/";
    return [glyph, rgb, 0.55 + fres * 0.45];
  }
  if (fres > 0.18) return [":", rgb, 0.18 + fres * 0.6];
  return null; // clear glass: let the interior show through
}

// Shard ownership: which shard owns each point of the unit disc, precomputed on a 96×96 grid
// (instead of a nearest-seed search for every cell, every frame). Also the distance to that seed.
const VG = 96;
let voronoi: { shards: Shard[]; owner: Uint8Array; dist: Float32Array } | null = null;
function owner(shards: Shard[]) {
  if (voronoi && voronoi.shards === shards) return voronoi;
  const own = new Uint8Array(VG * VG);
  const dist = new Float32Array(VG * VG);
  for (let y = 0; y < VG; y++)
    for (let x = 0; x < VG; x++) {
      const u = (x + 0.5) / VG * 2 - 1;
      const v = (y + 0.5) / VG * 2 - 1;
      let nearest = 0;
      let nd = Infinity;
      for (let j = 0; j < shards.length; j++) {
        const dd = (u - shards[j].ax) ** 2 + (v - shards[j].ay) ** 2;
        if (dd < nd) ((nd = dd), (nearest = j));
      }
      own[y * VG + x] = nearest;
      dist[y * VG + x] = nd;
    }
  voronoi = { shards, owner: own, dist };
  return voronoi;
}

// Conversation arcs rasterised once per frame into a per-cell map (value: 1 = travelling dot, 0.55 = trail).
let talkCache = { t: -1, cols: 0, map: new Float32Array(0) };
function talkMap(f: Frame<Geo>, talk: number) {
  if (talkCache.t === f.t && talkCache.cols === f.cols) return talkCache.map;
  const { geo: g, t, cols, rows } = f;
  const map = new Float32Array(cols * rows);
  const cw = f.w / cols;
  const ch = f.h / rows;
  for (const [ji, j] of g.judges.entries()) {
    const sx = g.team.x;
    const sy = g.team.y - g.r * 0.15;
    const ex = j.x;
    const ey = j.head - g.ps * 0.9; // end just above the head, not on it
    const mx = (sx + ex) / 2;
    const my = Math.min(sy, ey) - g.r * (0.45 + ji * 0.12);
    const pos = (t * 0.5 + ji / 3) % 1;
    for (let k = 0; k <= 80 * talk; k++) {
      const s = k / 80;
      const x = (1 - s) * (1 - s) * sx + 2 * (1 - s) * s * mx + s * s * ex;
      const y = (1 - s) * (1 - s) * sy + 2 * (1 - s) * s * my + s * s * ey;
      const col = Math.floor(x / cw);
      const row = Math.floor(y / ch);
      if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
      const v = Math.abs(pos - s) < 0.04 ? 1 : 0.55;
      if (v > map[row * cols + col]) map[row * cols + col] = v;
    }
  }
  talkCache = { t: f.t, cols, map };
  return talkCache.map;
}

// Ideas: glyphs bouncing around inside the bubble; when it shatters they fly out to the judges.
// Rasterised once per frame into a per-cell map (value: index of the idea glyph + 1).
let ideaCache = { t: -1, cols: 0, map: new Uint8Array(0) };
function ideaMap(f: Frame<Geo>, shatter: number) {
  if (ideaCache.t === f.t && ideaCache.cols === f.cols) return ideaCache.map;
  const { geo: g, t, cols, rows } = f;
  const map = new Uint8Array(cols * rows);
  const cw = f.w / cols;
  const ch = f.h / rows;
  for (let i = 0; i < 18; i++) {
    // Inside: a Lissajous drift that stays within the glass, above the table.
    const a = 0.45 + (i % 5) * 0.13;
    const b = 0.37 + (i % 7) * 0.11;
    const iu = Math.sin(t * a + i * 1.7) * 0.68;
    const iv = -0.18 + Math.cos(t * b + i * 2.3) * 0.45;
    let x = g.cx + iu * g.r;
    let y = g.cy + iv * g.r;
    if (shatter > 0) {
      // Out: each idea heads for one of the judges, arriving as the bubble finishes breaking.
      const j = g.judges[i % g.judges.length];
      const k = Math.min(1, shatter * (1.1 + (i % 4) * 0.15));
      const e = k * k * (3 - 2 * k);
      x += (j.x - x) * e;
      y += (j.head - g.ps * 0.9 - y) * e - Math.sin(e * Math.PI) * g.r * 0.35;
      if (k >= 1) continue; // delivered
    }
    const col = Math.floor(x / cw);
    const row = Math.floor(y / ch);
    if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
    map[row * cols + col] = (i % IDEAS.length) + 1;
  }
  ideaCache = { t: f.t, cols, map };
  return map;
}

let crackCache = { key: "", map: new Float32Array(0) };
function crackMap(f: Frame<Geo>, crack: number) {
  const key = `${f.cols}x${f.rows}:${crack.toFixed(3)}`;
  if (crackCache.key === key) return crackCache.map;
  const { geo: g, cols, rows } = f;
  const map = new Float32Array(cols * rows);
  const cw = f.w / cols;
  const ch = f.h / rows;
  for (const line of g.cracks) {
    const segs = line.length - 1;
    const show = crack * segs;
    for (let s = 0; s < segs && s < show; s++) {
      const [x0, y0] = line[s];
      const [x1, y1] = line[s + 1];
      const part = Math.min(1, show - s);
      const steps = 12;
      for (let k = 0; k <= steps * part; k++) {
        const u = k / steps;
        const x = g.cx + (x0 + (x1 - x0) * u) * g.r;
        const y = g.cy + (y0 + (y1 - y0) * u) * g.r;
        const col = Math.floor(x / cw);
        const row = Math.floor(y / ch);
        if (col >= 0 && row >= 0 && col < cols && row < rows) map[row * cols + col] = 1;
      }
    }
  }
  crackCache = { key, map };
  return map;
}

function shade(c: Cell, f: Frame<Geo>): Shaded {
  const { geo: g, t, power } = f;
  const crack = Math.max(0, Math.min(1, (power - 0.38) / 0.22));
  const shatter = Math.max(0, Math.min(1, (power - 0.6) / 0.3));
  const talk = Math.max(0, Math.min(1, (power - 0.72) / 0.25));
  const u = (c.x - g.cx) / g.r;
  const v = (c.y - g.cy) / g.r;

  // Ideas in flight (drawn over the glass).
  const idea = ideaMap(f, shatter)[c.row * f.cols + c.col];
  if (idea) return [IDEAS[idea - 1], shatter > 0 ? CREAM : LAMP, 0.95];

  // Speech bubbles above each judge once the talk reaches them.
  const cw = f.w / f.cols;
  const ch = f.h / f.rows;
  for (const [ji, j] of g.judges.entries()) {
    if (talk > 0.85) {
      const text = ["( ? )", "( ! )", "( + )"][ji];
      const sy = Math.round((c.y - (j.head - g.ps * 1.6)) / ch);
      const sx = Math.round((c.x - j.x) / cw + 2);
      if (sy === 0 && sx >= 0 && sx < 5) return [text[sx], CREAM, 0.95];
    }
  }

  // The bubble (glass, cracks, shards) never paints over the judges: they stand outside it.
  const isFigure = c.region === R.JUDGE || c.region === R.JHEAD || c.region === R.CLIPBOARD;
  // Gone completely once it has broken: no rim, no shards left lingering.
  const shardFade = Math.max(0, 1 - shatter * 1.2);

  // Glass and shards.
  if (isFigure) {
    // (nothing: fall through to the figures below)
  } else if (shatter <= 0) {
    if (crack > 0 && crackMap(f, crack)[c.row * f.cols + c.col]) {
      const glint = Math.sin(c.col * 1.7 + c.row * 0.9 - t * 4) > 0.8;
      return [glint ? "*" : "xX/\\"[Math.floor(c.seed * 4)], glint ? CREAM : mix(CREAM, LAMP, 0.3), 0.95];
    }
    const gl = glass(u, v, t, 0);
    if (gl) return gl;
  } else if (shardFade > 0.02) {
    // Each shard is a Voronoi cell of the sphere, translated outward and fading to nothing.
    const vo = owner(g.shards);
    for (let i = 0; i < g.shards.length; i++) {
      const sh = g.shards[i];
      const fly = shatter * sh.speed * 0.55;
      const su = u - sh.dir[0] * fly;
      const sv = v - sh.dir[1] * fly;
      if (su * su + sv * sv > 1) continue;
      const gx = Math.min(VG - 1, Math.max(0, Math.floor(((su + 1) / 2) * VG)));
      const gy = Math.min(VG - 1, Math.max(0, Math.floor(((sv + 1) / 2) * VG)));
      if (vo.owner[gy * VG + gx] !== i) continue;
      const nd = vo.dist[gy * VG + gx];
      const fade = shardFade;
      const gl = glass(su, sv, t + sh.spin, shatter);
      if (gl) return [gl[0], gl[1], gl[2] * fade];
      // Shard edges catch the light.
      if (nd > 0.02 && Math.sin(c.col + t * 6 * sh.spin) > 0.6) return ["'", CREAM, 0.5 * fade];
    }
  }

  // Conversation: dotted arcs from the team to each judge, with travelling dots.
  if (talk > 0) {
    const tv = talkMap(f, talk)[c.row * f.cols + c.col];
    if (tv) return [tv === 1 ? "o" : "·", tv === 1 ? CREAM : LAMP, tv === 1 ? 1 : 0.55];
  }

  // People, furniture, floor. Faces and screens glow; bodies are rim-lit silhouettes.
  const screenGlow = 0.5 + 0.5 * Math.sin(t * 2 + c.col * 0.1);
  switch (c.region) {
    case R.FACE: {
      // Faces lit warm by the laptop screens in front of them.
      const skin = SKIN[c.aux % SKIN.length];
      const edge = c.left !== R.FACE || c.right !== R.FACE || c.up !== R.FACE;
      if (edge) return ["o", mix(skin, CREAM, 0.15), 0.9, mix(INK, skin, 0.35)];
      return [c.down !== R.FACE ? "=" : "@", mix(skin, LAMP, screenGlow * 0.25), 0.9, mix(INK, skin, 0.55)];
    }
    case R.PERSON: {
      // Solid shirts in a different colour per student, with a lit top edge.
      const shirt = SHIRTS[c.aux % SHIRTS.length];
      if (c.up === R.SKY || c.up === R.FACE) return ["_", mix(shirt, CREAM, 0.45), 0.95, mix(INK, shirt, 0.45)];
      if (c.left === R.SKY || c.right === R.SKY) return [c.left === R.SKY ? "(" : ")", mix(shirt, CREAM, 0.25), 0.9, mix(INK, shirt, 0.4)];
      return [c.seed > 0.5 ? "#" : "%", shirt, 0.7, mix(INK, shirt, 0.32)];
    }
    case R.LAPTOP:
      return [c.up === R.SKY ? "_" : "=", mix(STATIC, CREAM, 0.3), 0.8, "36,32,44"];
    case R.SCREEN:
      return ["@", LAMP, 0.7 + screenGlow * 0.3, "60,40,30"];
    case R.TABLE:
      return ["=", mix(STATIC, LAMP, 0.25), 0.85, "40,34,40"];
    case R.JUDGE:
    case R.JHEAD: {
      // Gold statues, like an awards trophy: polished metal lit from the left, a dark shaded side,
      // and a glint that sweeps across them; they shine brighter once the team is talking to them.
      const j = g.judges[c.aux] ?? g.judges[0];
      const u = (c.x - j.x) / (g.ps * 0.7); // −1 left edge … +1 right edge
      const shine = Math.max(0, Math.min(1, 0.78 - u * 0.42)) * (0.75 + talk * 0.25);
      const glint = Math.abs(((t * 0.35 + c.aux * 0.33) % 1.6) - 0.3 - (c.y - j.head) / (g.ps * 4)) < 0.05;
            const bg = mix(GOLD_LO, GOLD, shine * 0.85);
      if (c.left === R.SKY || c.left === R.FLOOR) return ["(", "255,246,214", 1, bg];
      if (c.right === R.SKY || c.right === R.FLOOR) return [")", "110,72,20", 0.9, bg];
      if (c.up === R.SKY) return ["_", "255,246,214", 1, bg];
      // Glyphs are the polish on the metal: bright where it catches light, dark where it turns away.
      return [glint ? "*" : shine > 0.7 ? "@" : shine > 0.45 ? "%" : "#", glint ? "255,252,236" : mix("120,80,24", GOLD_HI, shine), 0.95, bg];
    }
    case R.CLIPBOARD: {
      // Notes appear on the clipboard as they listen.
      const writing = talk > 0 && (c.row + Math.floor(t * 3)) % 3 !== 0;
      return [writing ? "~" : "=", GOLD_LO, 0.9, mix(INK, GOLD, 0.55)];
    }
    case R.FLOOR: {
      // Reflection of the bubble on a glossy floor.
      const ref = Math.exp(-Math.abs(c.x - g.cx) / (g.r * 0.9)) * (1 - shatter * 0.7);
      return c.row % 2 === 0 ? ["_", mix(STATIC, LAMP, ref * 0.5), 0.12 + ref * 0.25] : null;
    }
  }
  return c.seed > 0.993 ? [".", CREAM, 0.15] : null;
}

export default function BubbleScene({ power }: { power: MotionValue<number> }) {
  return (
    <div className="bubble-scene">
      <AsciiScene
        label="A team inside an iridescent ASCII glass bubble full of ideas; it shatters and the ideas reach three judges outside, two from Manara West and one from MTC"
        paint={paint}
        shade={shade}
        power={power}
        cell={7}
        fps={24}
      />
    </div>
  );
}
