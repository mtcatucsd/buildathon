import type { MotionValue } from "motion/react";
import AsciiScene, { region, type Cell, type Frame, type Shaded } from "./AsciiScene";
import { rng } from "./rng";
import { stageFrame } from "./stageFrame";
import { device } from "./device";

// The Manara West lighthouse in ASCII: a slender minaret-lighthouse on a dark island at dusk,
// horizontal beams, a glowing path winding down past lanterns, a lone figure on the hill,
// a crescent and sparkles. Palette from manarawest.org. The sky gradient is CSS behind the canvas.
// `power` (0 → 1) lights the windows, the path and the beams.

const R = {
  SKY: 0,
  SEA: 1,
  ISLAND: 2,
  HILL: 3,
  TOWER: 4,
  WINDOW: 5,
  LANTERN: 6,
  GALLERY: 7,
  CAP: 8,
  DOOR: 9,
  PATH: 10,
  POST: 11,
  FIGURE: 12,
  MOON: 13,
  SPARK: 14,
};

// manarawest.org palette
const NIGHT = "16,0,55"; // #100037
const INK = "28,8,74";
const HILL = "34,10,88";
const PURPLE = "183,80,186"; // #B750BA
const MAGENTA = "167,66,168"; // #A742A8
const ORANGE = "255,100,39"; // #FF6427
const AMBER = "251,167,51"; // #FBA733
const YELLOW = "255,206,0"; // #FFCE00
const PINK = "236,120,190";
const CREAM = "255,230,212";

type Geo = { cx: number; horizon: number; s: number; lampY: number; lampHalf: number; towerTop: number; base: number };

function paint(ctx: CanvasRenderingContext2D, w: number, h: number): Geo {
  const wide = w >= 900;
  const fr = stageFrame(w, h);
  const cx = w * (wide ? 0.66 : 0.5);
  const s = fr.tall ? Math.min(fr.h * 0.8, w * 0.9) : Math.min(h * 0.62, w * (wide ? 0.5 : 0.9)); // tower height scale
  // Tall screens: the lighthouse stands in the upper area and the sea and hills fill everything below. The
  // horizon sits as high as the tower allows (it's ~0.86·s tall), so the path has room to wind toward you.
  const horizon = fr.tall ? fr.top + Math.min(fr.h * 0.86, Math.max(fr.h * 0.62, 40 + s * 0.86)) : h * 0.6;
  // Below-horizon positions given as fractions of a wide layout (0.6 = horizon … 1 = bottom).
  const hy = (k: number) => (fr.tall ? horizon + (h - horizon) * ((k - 0.6) / 0.4) : h * k);
  const fill = (id: number) => (ctx.fillStyle = region(id));
  const rand = rng(21);

  // Sea below the horizon.
  fill(R.SEA);
  ctx.fillRect(0, horizon, w, h - horizon);

  // Island the lighthouse stands on.
  const base = horizon - s * 0.02;
  fill(R.ISLAND);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.75, horizon + s * 0.06);
  ctx.quadraticCurveTo(cx - s * 0.2, base - s * 0.04, cx, base - s * 0.05);
  ctx.quadraticCurveTo(cx + s * 0.25, base - s * 0.04, cx + s * 0.8, horizon + s * 0.06);
  ctx.lineTo(cx + s * 0.8, h);
  ctx.lineTo(cx - s * 0.75, h);
  ctx.fill();

  // Foreground hills sweeping in from both sides.
  fill(R.HILL);
  ctx.beginPath();
  ctx.moveTo(0, hy(0.72));
  ctx.bezierCurveTo(w * 0.25, hy(0.66), w * 0.4, hy(0.82), cx - s * 0.1, hy(0.9));
  ctx.lineTo(cx - s * 0.1, h);
  ctx.lineTo(0, h);
  ctx.fill();
  const hillTop = (x: number) => hy(0.7) - Math.sin(((x - cx) / (w - cx)) * Math.PI * 0.9) * (hy(0.66) - hy(0.6));
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.15, h);
  for (let x = cx + s * 0.15; x <= w; x += 8) ctx.lineTo(x, hillTop(x) + (x < cx + s * 0.4 ? (cx + s * 0.4 - x) * 0.6 : 0));
  ctx.lineTo(w, h);
  ctx.fill();

  // Winding path from the door down the island, with lantern posts.
  const doorY = base - s * 0.06;
  // On phones the text card hides everything below `cardY`, so the path winds within the visible stretch
  // (and runs on beneath the card) instead of spreading over a screen height that's mostly covered.
  const cardY = fr.tall ? fr.top + fr.h + 14 : h;
  const reach = fr.tall ? (cardY - doorY) * 1.15 : (h - doorY) * 1.05;
  const waves = fr.tall ? 2.4 : 3.2;
  // A grid cell is ~3–5px; a line narrower than ~2 cells loses cells to its neighbours and breaks up.
  const cellPx = 4.8 * device.cellScale;
  const pw = Math.max(5, s * 0.022, cellPx * 2.2);
  ctx.strokeStyle = region(R.PATH);
  ctx.lineCap = "round";
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    pts.push([
      cx + Math.sin(u * Math.PI * waves) * s * (0.05 + u * (fr.tall ? 0.2 : 0.22)) - u * s * (fr.tall ? 0.1 : 0.15),
      doorY + u * reach,
    ]);
  }
  // Drawn in short pieces so it can widen toward the viewer, like a road in perspective.
  for (let i = 0; i < 40; i++) {
    ctx.lineWidth = pw * (1 + (i / 40) * 1.3);
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
    ctx.stroke();
  }
  fill(R.POST);
  for (const i of [9, 17, 25, 33]) {
    const [x, y] = pts[i];
    const off = (i % 2 ? 1 : -1) * s * 0.06;
    ctx.fillRect(x + off - 1.5, y - s * 0.06, Math.max(3, cellPx), s * 0.06);
  }

  // A figure on the right-hand hill, looking toward the light.
  const fx = cx + (w - cx) * 0.62;
  const fy = hillTop(fx) + 2;
  const fs = s * 0.11;
  fill(R.FIGURE);
  ctx.beginPath();
  ctx.arc(fx, fy - fs * 1.05, fs * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fx - fs * 0.2, fy - fs * 0.9);
  ctx.lineTo(fx + fs * 0.2, fy - fs * 0.9);
  ctx.lineTo(fx + fs * 0.15, fy - fs * 0.4);
  ctx.lineTo(fx + fs * 0.12, fy);
  ctx.lineTo(fx - fs * 0.12, fy);
  ctx.lineTo(fx - fs * 0.15, fy - fs * 0.4);
  ctx.closePath();
  ctx.fill();

  // --- The lighthouse (bottom → top) ---
  const H = s; // overall height
  const towerTop = base - H * 0.78;
  // Flared base.
  fill(R.TOWER);
  ctx.beginPath();
  ctx.moveTo(cx - H * 0.11, base);
  ctx.quadraticCurveTo(cx - H * 0.075, base - H * 0.05, cx - H * 0.07, base - H * 0.12);
  ctx.lineTo(cx + H * 0.07, base - H * 0.12);
  ctx.quadraticCurveTo(cx + H * 0.075, base - H * 0.05, cx + H * 0.11, base);
  ctx.fill();
  // Arched door.
  fill(R.DOOR);
  ctx.beginPath();
  ctx.moveTo(cx - H * 0.018, base);
  ctx.lineTo(cx - H * 0.018, base - H * 0.045);
  ctx.arc(cx, base - H * 0.045, H * 0.018, Math.PI, 0);
  ctx.lineTo(cx + H * 0.018, base);
  ctx.fill();
  // Lower gallery ring with a row of small windows.
  const gal1 = base - H * 0.12;
  fill(R.GALLERY);
  ctx.fillRect(cx - H * 0.09, gal1 - H * 0.035, H * 0.18, H * 0.035);
  fill(R.WINDOW);
  for (let i = -2; i <= 2; i++) ctx.fillRect(cx + i * H * 0.03 - H * 0.007, gal1 - H * 0.027, H * 0.014, H * 0.016);
  // Slender, slightly tapered shaft.
  fill(R.TOWER);
  ctx.beginPath();
  ctx.moveTo(cx - H * 0.06, gal1 - H * 0.035);
  ctx.lineTo(cx - H * 0.045, towerTop + H * 0.17);
  ctx.lineTo(cx + H * 0.045, towerTop + H * 0.17);
  ctx.lineTo(cx + H * 0.06, gal1 - H * 0.035);
  ctx.fill();
  // Three small arched windows up the shaft.
  fill(R.WINDOW);
  for (let i = 0; i < 3; i++) {
    const wy = gal1 - H * (0.12 + i * 0.13);
    ctx.fillRect(cx - H * 0.009, wy, H * 0.018, H * 0.03);
    ctx.beginPath();
    ctx.arc(cx, wy, H * 0.009, Math.PI, 0);
    ctx.fill();
  }
  // Upper gallery ring.
  const gal2 = towerTop + H * 0.17;
  fill(R.GALLERY);
  ctx.fillRect(cx - H * 0.075, gal2 - H * 0.03, H * 0.15, H * 0.03);
  // Lantern room with three bright arched windows.
  const lanTop = gal2 - H * 0.03 - H * 0.075;
  fill(R.TOWER);
  ctx.fillRect(cx - H * 0.055, lanTop, H * 0.11, H * 0.075);
  fill(R.LANTERN);
  for (let i = -1; i <= 1; i++) {
    const lx = cx + i * H * 0.033;
    ctx.fillRect(lx - H * 0.011, lanTop + H * 0.02, H * 0.022, H * 0.045);
    ctx.beginPath();
    ctx.arc(lx, lanTop + H * 0.02, H * 0.011, Math.PI, 0);
    ctx.fill();
  }
  // Cornice + pointed minaret cap + finial.
  fill(R.GALLERY);
  ctx.fillRect(cx - H * 0.065, lanTop - H * 0.015, H * 0.13, H * 0.015);
  fill(R.CAP);
  ctx.beginPath();
  ctx.moveTo(cx - H * 0.06, lanTop - H * 0.015);
  ctx.quadraticCurveTo(cx - H * 0.05, lanTop - H * 0.07, cx, lanTop - H * 0.11);
  ctx.quadraticCurveTo(cx + H * 0.05, lanTop - H * 0.07, cx + H * 0.06, lanTop - H * 0.015);
  ctx.fill();
  ctx.fillRect(cx - H * 0.004, lanTop - H * 0.14, H * 0.008, H * 0.035);

  // Crescent moon, upper right.
  const mx = wide ? w * 0.9 : w * 0.82;
  const my = fr.tall ? fr.top + fr.h * 0.12 : h * 0.16;
  const mr = Math.min(w, h) * 0.06;
  fill(R.MOON);
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(mx - mr * 0.35, my - mr * 0.3, mr * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // Four-point sparkles.
  ctx.strokeStyle = region(R.SPARK);
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const x = rand() * w;
    const y = rand() * horizon * 0.85;
    const r = 6 + rand() * 16;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r * 1.3);
    ctx.lineTo(x, y + r * 1.3);
    ctx.stroke();
  }

  return { cx, horizon, s, lampY: lanTop + H * 0.04, lampHalf: H * 0.035, towerTop, base };
}

const mix = (a: string, b: string, t: number) => {
  const A = a.split(",").map(Number);
  const B = b.split(",").map(Number);
  return A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",");
};

function shade(c: Cell, f: Frame<Geo>): Shaded {
  const { geo: g, t, power } = f;
  const lit = power;
  const dx = c.x - g.cx;
  const dy = c.y - g.lampY;
  const breathe = 0.85 + 0.15 * Math.sin(t * 1.4);

  // Horizontal beams: wedges to both sides of the lantern, widening outward.
  const beam = () => {
    if (lit < 0.05) return 0;
    const ax = Math.abs(dx);
    if (ax < g.s * 0.06) return 0;
    const half = g.lampHalf + ax * 0.16;
    if (Math.abs(dy) > half) return 0;
    const fade = Math.max(0, 1 - ax / (f.w * 0.75));
    return lit * breathe * fade * (1 - Math.abs(dy) / half) ** 0.7;
  };

  switch (c.region) {
    case R.SKY: {
      const b = beam();
      if (b > 0.04) return [b > 0.55 ? "=" : b > 0.25 ? "-" : ".", mix(PINK, CREAM, b), 0.2 + b * 0.75];
      const halo = lit * Math.exp(-Math.hypot(dx, dy) / (g.s * 0.09));
      if (halo > 0.08) return [halo > 0.5 ? "*" : ":", CREAM, halo * 0.9];
      if (c.seed > 0.988) return [c.seed > 0.996 ? "*" : ".", CREAM, 0.25 + 0.35 * Math.abs(Math.sin(t * 1.5 + c.seed * 90))];
      return null;
    }
    case R.SEA: {
      // Horizontal stripes catching the sunset, brightest at the horizon.
      const depth = Math.min(1, (c.y - g.horizon) / (f.h - g.horizon));
      const stripe = c.row % 2 === 0;
      const tone = mix(mix(AMBER, ORANGE, depth * 1.5 > 1 ? 1 : depth * 1.5), PURPLE, Math.max(0, depth - 0.3));
      const reflect = lit * Math.max(0, 1 - Math.abs(dx) / (g.s * 0.12)) * (1 - depth);
      if (reflect > 0.2 && stripe) return ["=", YELLOW, reflect, NIGHT];
      return stripe ? ["-", tone, 0.65 - depth * 0.4, NIGHT] : [".", tone, 0.15, NIGHT];
    }
    case R.ISLAND:
      return [c.seed > 0.85 ? "." : " ", PURPLE, 0.35, INK];
    case R.HILL: {
      const rimLit = c.up === R.SKY || c.up === R.SEA || c.up === R.ISLAND;
      return rimLit ? ["_", MAGENTA, 0.9, HILL] : [c.seed > 0.9 ? "'" : " ", PURPLE, 0.3, HILL];
    }
    case R.TOWER:
    case R.CAP: {
      // Dark silhouette with a warm rim where the lamp light catches its left edge.
      const edgeL = c.left === R.SKY || c.left === R.SEA || c.left === R.ISLAND;
      const edgeR = c.right === R.SKY || c.right === R.SEA || c.right === R.ISLAND;
      if (c.region === R.CAP && (edgeL || edgeR)) return [edgeL ? "/" : "\\", AMBER, 0.75, NIGHT];
      if (edgeL) return ["|", mix(PURPLE, AMBER, lit * 0.6), 0.8, NIGHT];
      if (edgeR) return ["|", PURPLE, 0.5, NIGHT];
      return [c.seed > 0.75 ? ":" : " ", PURPLE, 0.3, NIGHT];
    }
    case R.GALLERY:
      return [c.up === R.SKY ? "_" : "=", mix(PURPLE, CREAM, 0.3), 0.75, NIGHT];
    case R.WINDOW:
      return lit > 0.15 ? ["#", YELLOW, 0.55 + lit * 0.45, mix(NIGHT, AMBER, lit * 0.35)] : [".", PURPLE, 0.5, NIGHT];
    case R.LANTERN: {
      const flick = 0.9 + 0.1 * Math.sin(t * 8 + c.seed * 9);
      return lit > 0.05 ? ["@", "255,250,220", lit * flick, mix(NIGHT, YELLOW, lit * 0.55)] : [":", PURPLE, 0.5, NIGHT];
    }
    case R.DOOR:
      return lit > 0.1 ? ["#", YELLOW, lit, mix(NIGHT, AMBER, lit * 0.5)] : [".", PURPLE, 0.4, NIGHT];
    case R.PATH: {
      // The path glows in pink, a light pulse travelling down it.
      const pulse = Math.sin(c.row * 0.35 - t * 2.5) > 0.6 ? 1 : 0;
      const on = lit * (0.55 + pulse * 0.45);
      return on > 0.05 ? [pulse ? "*" : "~", mix(PINK, CREAM, pulse * 0.6), 0.4 + on * 0.6] : ["~", PURPLE, 0.25];
    }
    case R.POST:
      return c.up === R.HILL || c.up === R.ISLAND || c.up === R.SKY ? ["*", YELLOW, 0.4 + lit * 0.6] : ["|", PURPLE, 0.8];
    case R.FIGURE:
      return [" ", NIGHT, 0, "10,0,36"];
    case R.MOON:
      return ["@", YELLOW, 0.95, mix(NIGHT, AMBER, 0.25)];
    case R.SPARK:
      return ["+", CREAM, 0.5 + 0.5 * Math.abs(Math.sin(t * 2 + c.col))];
  }
  return null;
}

export default function LighthouseScene({ power }: { power: MotionValue<number> }) {
  return (
    <div className="manara-sky">
      <AsciiScene
        label="The Manara West lighthouse in ASCII at dusk: a minaret-lighthouse on an island, its beams spreading over the sea, a glowing path and a lone figure on the hill"
        paint={paint}
        shade={shade}
        power={power}
        cell={4.8} fps={20}
      />
    </div>
  );
}
