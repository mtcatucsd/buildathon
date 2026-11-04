import type { MotionValue } from "motion/react";
import AsciiScene, { region, type Cell, type Frame, type Shaded } from "./AsciiScene";

// Awards: a gold cup on a plinth. `power` (0 → 1) builds it from the base up, then a glint sweeps across.

const R = { SKY: 0, CUP: 1, HANDLE: 2, STEM: 3, PLINTH: 4, PLATE: 5, STAR: 6 };
const GOLD = "255,178,63";
const WARM = "255,214,140";
const SHADOW = "170,125,50";
const STONE = "120,110,100";
const TONE = " .:-=+*#%@";

type Geo = { cx: number; top: number; bottom: number; s: number };

function paint(ctx: CanvasRenderingContext2D, w: number, h: number): Geo {
  const cx = w / 2;
  const s = Math.min(w * 0.9, h * 0.95);
  const bottom = h * 0.95;
  const fill = (id: number) => (ctx.fillStyle = region(id));

  fill(R.PLINTH);
  ctx.fillRect(cx - s * 0.26, bottom - s * 0.12, s * 0.52, s * 0.12);
  fill(R.PLATE);
  ctx.fillRect(cx - s * 0.15, bottom - s * 0.085, s * 0.3, s * 0.05);
  fill(R.STEM);
  ctx.fillRect(cx - s * 0.17, bottom - s * 0.16, s * 0.34, s * 0.04);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.05, bottom - s * 0.16);
  ctx.lineTo(cx - s * 0.025, bottom - s * 0.32);
  ctx.lineTo(cx + s * 0.025, bottom - s * 0.32);
  ctx.lineTo(cx + s * 0.05, bottom - s * 0.16);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, bottom - s * 0.33, s * 0.06, s * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cup bowl.
  const rimY = bottom - s * 0.78;
  fill(R.CUP);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.24, rimY);
  ctx.lineTo(cx + s * 0.24, rimY);
  ctx.bezierCurveTo(cx + s * 0.24, bottom - s * 0.5, cx + s * 0.12, bottom - s * 0.36, cx, bottom - s * 0.35);
  ctx.bezierCurveTo(cx - s * 0.12, bottom - s * 0.36, cx - s * 0.24, bottom - s * 0.5, cx - s * 0.24, rimY);
  ctx.fill();
  ctx.fillRect(cx - s * 0.26, rimY - s * 0.03, s * 0.52, s * 0.035);

  // Handles.
  ctx.strokeStyle = region(R.HANDLE);
  ctx.lineWidth = s * 0.03;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * s * 0.23, rimY + s * 0.04);
    ctx.bezierCurveTo(cx + side * s * 0.4, rimY + s * 0.02, cx + side * s * 0.38, rimY + s * 0.22, cx + side * s * 0.17, rimY + s * 0.3);
    ctx.stroke();
  }

  // Star on the cup.
  fill(R.STAR);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? s * 0.035 : s * 0.08;
    ctx.lineTo(cx + Math.cos(a) * rr, rimY + s * 0.17 + Math.sin(a) * rr);
  }
  ctx.fill();
  return { cx, top: rimY - s * 0.03, bottom, s };
}

function shade(c: Cell, f: Frame<Geo>): Shaded {
  const { geo: g, power, t } = f;
  // Builds from the base up.
  const built = g.bottom - (g.bottom - g.top + g.s * 0.05) * Math.min(1, power * 1.6);
  if (c.region !== R.SKY && c.y < built) return c.seed > 0.7 ? [".", SHADOW, 0.25] : null;
  // A glint sweeps diagonally once it's complete.
  const sweep = ((t * 0.6) % 2.2) - 0.6;
  const u = (c.x - g.cx) / g.s + (c.y - g.bottom) / g.s;
  const glint = power > 0.7 && Math.abs(u + 0.5 - sweep) < 0.04;
  const light = Math.max(0, Math.min(1, 0.8 - (c.x - g.cx) / (g.s * 0.5)));
  const edge = (rgb: string): Shaded | undefined => {
    if (c.left === R.SKY) return ["(", rgb, 0.95];
    if (c.right === R.SKY) return [")", rgb, 0.75];
    if (c.up === R.SKY) return ["_", rgb, 0.9];
    return undefined;
  };
  switch (c.region) {
    case R.SKY: {
      const d = Math.hypot(c.x - g.cx, c.y - (g.top + g.s * 0.2)) / g.s;
      const rays = power > 0.7 ? Math.max(0, 0.35 - d * 0.5) * (0.6 + 0.4 * Math.sin(Math.atan2(c.y - g.top, c.x - g.cx) * 12 + t)) : 0;
      if (rays > 0.08) return ["'", WARM, rays];
      return c.seed > 0.99 ? [".", GOLD, 0.2] : null;
    }
    case R.CUP:
      if (glint) return ["@", WARM, 1];
      return edge(GOLD) ?? [TONE[Math.max(3, Math.round(light * 9))], light > 0.5 ? GOLD : SHADOW, 0.55 + light * 0.4];
    case R.HANDLE:
      return [glint ? "@" : "o", glint ? WARM : GOLD, 0.85];
    case R.STEM:
      return edge(GOLD) ?? ["|", SHADOW, 0.85];
    case R.STAR:
      return ["*", WARM, 0.8 + 0.2 * Math.sin(t * 3)];
    case R.PLINTH:
      return edge(STONE) ?? ["#", STONE, 0.55];
    case R.PLATE:
      return ["=", GOLD, 0.8];
  }
  return null;
}

export default function TrophyScene({ power }: { power: MotionValue<number> }) {
  return <AsciiScene label="A gold ASCII trophy" paint={paint} shade={shade} power={power} cell={4.2} fps={24} />;
}
