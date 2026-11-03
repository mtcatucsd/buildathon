import type { MotionValue } from "motion/react";
import AsciiScene, { region, type Cell, type Frame, type Shaded } from "./AsciiScene";

// Deen & Dunya: a brass balance. One pan holds a dome and minaret, the other a phone and a skyline.
// `power` (0 → 1) brings the beam from tipped to level.

const R = { SKY: 0, BASE: 1, POST: 2, BEAM: 3, CHAIN: 4, PAN: 5, DEEN: 6, DUNYA: 7, SCREEN: 8, PIVOT: 9, CRESCENT: 10 };
const BRASS = "222,178,92";
const BRASS_DARK = "160,120,60";
const WHITE = "236,230,220";
const ORANGE = "255,90,31";
const GOLD = "255,178,63";
const TONE = " .:-=+*#%@";

type Geo = { cx: number; s: number; pivotY: number; tilt: number };

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, power: number, t: number): Geo {
  const cx = w / 2;
  const s = Math.min(w * 0.95, h * 1.05);
  const groundY = h * 0.92;
  const pivotY = h * 0.2;
  // Settles from tipped to level, with a gentle sway that never quite stops.
  const tilt = ((1 - power) * 16 + Math.sin(t * 1.3) * 1.2 * (0.3 + (1 - power))) * (Math.PI / 180);
  const fill = (id: number) => (ctx.fillStyle = region(id));

  // Stepped base and post.
  fill(R.BASE);
  ctx.fillRect(cx - s * 0.2, groundY - s * 0.03, s * 0.4, s * 0.03);
  ctx.fillRect(cx - s * 0.13, groundY - s * 0.06, s * 0.26, s * 0.03);
  ctx.fillRect(cx - s * 0.06, groundY - s * 0.09, s * 0.12, s * 0.03);
  fill(R.POST);
  ctx.fillRect(cx - s * 0.018, pivotY, s * 0.036, groundY - s * 0.09 - pivotY);

  // Crescent finial above the pivot.
  fill(R.CRESCENT);
  ctx.beginPath();
  ctx.arc(cx, pivotY - s * 0.075, s * 0.032, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx + s * 0.015, pivotY - s * 0.082, s * 0.026, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  fill(R.POST);
  ctx.fillRect(cx - s * 0.006, pivotY - s * 0.045, s * 0.012, s * 0.045);

  // Beam, rotated about the pivot.
  const half = s * 0.4;
  ctx.save();
  ctx.translate(cx, pivotY);
  ctx.rotate(tilt);
  fill(R.BEAM);
  ctx.beginPath();
  ctx.moveTo(-half, -s * 0.008);
  ctx.lineTo(0, -s * 0.022);
  ctx.lineTo(half, -s * 0.008);
  ctx.lineTo(half, s * 0.01);
  ctx.lineTo(0, s * 0.022);
  ctx.lineTo(-half, s * 0.01);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  fill(R.PIVOT);
  ctx.beginPath();
  ctx.arc(cx, pivotY, s * 0.03, 0, Math.PI * 2);
  ctx.fill();

  // Pans hang straight down from the beam ends.
  const ends = [-1, 1].map((side) => ({
    side,
    x: cx + Math.cos(tilt) * half * side,
    y: pivotY + Math.sin(tilt) * half * side,
  }));
  for (const e of ends) {
    const panY = e.y + s * 0.34;
    const panW = s * 0.3;
    // Three chains converging on the hook.
    ctx.strokeStyle = region(R.CHAIN);
    ctx.lineWidth = Math.max(2, s * 0.008);
    for (const k of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + k * panW * 0.45, panY);
      ctx.stroke();
    }
    // The bowl.
    fill(R.PAN);
    ctx.beginPath();
    ctx.ellipse(e.x, panY, panW / 2, s * 0.075, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillRect(e.x - panW / 2 - s * 0.01, panY - s * 0.008, panW + s * 0.02, s * 0.016);

    if (e.side < 0) {
      // Deen: a dome with a minaret.
      fill(R.DEEN);
      ctx.beginPath();
      ctx.ellipse(e.x - s * 0.02, panY - s * 0.04, s * 0.06, s * 0.055, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(e.x - s * 0.08, panY - s * 0.04, s * 0.12, s * 0.035);
      ctx.fillRect(e.x + s * 0.065, panY - s * 0.16, s * 0.022, s * 0.155);
      ctx.beginPath();
      ctx.moveTo(e.x + s * 0.06, panY - s * 0.16);
      ctx.lineTo(e.x + s * 0.076, panY - s * 0.2);
      ctx.lineTo(e.x + s * 0.092, panY - s * 0.16);
      ctx.fill();
      ctx.fillRect(e.x - s * 0.023, panY - s * 0.13, s * 0.006, s * 0.04);
    } else {
      // Dunya: a phone in front of a small skyline.
      fill(R.DUNYA);
      for (const [dx, bw, bh] of [
        [-0.11, 0.04, 0.1],
        [-0.065, 0.035, 0.15],
        [0.05, 0.04, 0.12],
        [0.095, 0.03, 0.08],
      ]) {
        ctx.fillRect(e.x + dx * s, panY - bh * s, bw * s, bh * s);
      }
      fill(R.SCREEN);
      ctx.fillRect(e.x - s * 0.028, panY - s * 0.13, s * 0.06, s * 0.125);
    }
  }
  return { cx, s, pivotY, tilt };
}

// Repaint the stencil only when the beam has tilted by another quarter degree.
const tiltKey = (power: number, t: number) =>
  Math.round(((1 - power) * 16 + Math.sin(t * 1.3) * 1.2 * (0.3 + (1 - power))) * 4);

function shade(c: Cell, f: Frame<Geo>): Shaded {
  const { geo: g, t } = f;
  // Light falls from upper left: brighter toward the left of each shape.
  const light = Math.max(0, Math.min(1, 0.75 - (c.x - g.cx) / (g.s * 1.2)));
  const edge = (rgb: string): Shaded | undefined => {
    if (c.left === R.SKY) return ["/", rgb, 0.95];
    if (c.right === R.SKY) return ["\\", rgb, 0.7];
    if (c.up === R.SKY) return ["_", rgb, 0.85];
    if (c.down === R.SKY) return ["-", rgb, 0.6];
    return undefined;
  };
  switch (c.region) {
    case R.SKY:
      // Faint eight-point star lattice behind the scale.
      if ((c.col % 12 === 0 && c.row % 6 === 0) || ((c.col + 6) % 12 === 0 && (c.row + 3) % 6 === 0))
        return ["+", BRASS_DARK, 0.18];
      return c.seed > 0.993 ? [".", WHITE, 0.2] : null;
    case R.BASE:
      return edge(BRASS) ?? ["=", BRASS_DARK, 0.6];
    case R.POST:
      return ["|", c.left === R.SKY ? BRASS : BRASS_DARK, 0.85];
    case R.PIVOT:
      return ["@", BRASS, 0.95];
    case R.CRESCENT:
      return ["@", GOLD, 0.95];
    case R.BEAM:
      return edge(BRASS) ?? ["=", BRASS, 0.65 + light * 0.3];
    case R.CHAIN:
      return [c.row % 2 ? "o" : ":", BRASS, 0.75];
    case R.PAN:
      return edge(BRASS) ?? [TONE[Math.max(3, Math.round(light * 9))], BRASS, 0.5 + light * 0.4];
    case R.DEEN:
      return edge(GOLD) ?? [c.seed > 0.5 ? "#" : "%", GOLD, 0.6 + light * 0.3];
    case R.DUNYA: {
      const win = c.col % 2 === 0 && c.row % 2 === 0 && Math.floor(c.seed * 97 + t) % 7 !== 0;
      return edge(WHITE) ?? (win ? ["=", ORANGE, 0.75] : [".", WHITE, 0.35]);
    }
    case R.SCREEN:
      return ["#▒=+"[(c.row + Math.floor(t * 4)) % 4], "120,150,220", 0.8];
  }
  return null;
}

export default function ScaleScene({ power }: { power: MotionValue<number> }) {
  return (
    <AsciiScene
      label="An ASCII balance scale weighing a mosque against a city and a phone"
      paint={paint}
      shade={shade}
      power={power}
      cell={7}
      dynamic
      stencilKey={tiltKey}
    />
  );
}
