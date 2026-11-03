import type { MotionValue } from "motion/react";
import AsciiScene, { region, type Cell, type Frame, type Shaded } from "./AsciiScene";
import { rng } from "./rng";

// The noise: a skyline of towers and glowing screens under a rain of feed glyphs.
// `power` (1 → 0) is how much light is left; as it drops, windows die and static takes over.

const R = { SKY: 0, TOWER: 1, SCREEN: 2, ANTENNA: 3, PHONE: 4, FEED: 5 };
const WHITE = "236,230,220";
const GOLD = "255,178,63";
const ORANGE = "255,90,31";
const BLUE = "120,150,220";
const GRAY = "150,145,140";
const RAIN = "01<>/\\|#%&$@!?{}[]=+*";
const FEED = ["LIKE", "SHARE", "99+", "LIVE", "AD", "NEW", "FOR YOU", "▶", "TRENDING", "SWIPE"];

type Phone = { x: number; y: number; w: number; h: number; angle: number; speed: number; hue: number };
type Geo = { horizon: number; phones: Phone[] };

function paint(ctx: CanvasRenderingContext2D, w: number, h: number): Geo {
  const rand = rng(7);
  const horizon = h * 0.98;
  let x = -20;
  while (x < w + 20) {
    const tw = w * (0.035 + rand() * 0.06);
    const th = h * (0.18 + Math.pow(rand(), 1.6) * 0.55);
    ctx.fillStyle = region(R.TOWER);
    ctx.fillRect(x, horizon - th, tw, th);
    if (rand() > 0.6) {
      ctx.fillStyle = region(R.ANTENNA);
      ctx.fillRect(x + tw / 2 - 2, horizon - th - h * 0.06, 4, h * 0.06);
    }
    if (rand() > 0.55) {
      // A billboard screen bolted to the tower face.
      ctx.fillStyle = region(R.SCREEN);
      ctx.fillRect(x + tw * 0.12, horizon - th + th * (0.08 + rand() * 0.3), tw * 0.76, Math.min(th * 0.22, h * 0.09));
    }
    x += tw + w * (0.004 + rand() * 0.012);
  }

  // A collage of phones floating over the city, each scrolling its own feed.
  const phones: Phone[] = [];
  const spots: [number, number, number][] = [
    [0.62, 0.3, 1.0],
    [0.84, 0.42, 0.85],
    [0.47, 0.55, 0.7],
    [0.74, 0.7, 0.95],
    [0.93, 0.15, 0.6],
    [0.36, 0.2, 0.55],
    [0.55, 0.85, 0.6],
  ];
  spots.forEach(([fx, fy, k], i) => {
    const ph = Math.min(h * 0.42, w * 0.3) * k;
    phones.push({ x: w * fx, y: h * fy, w: ph * 0.5, h: ph, angle: (rand() - 0.5) * 0.5, speed: 25 + rand() * 40, hue: i });
  });
  phones.forEach((p, i) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = region(R.PHONE, i);
    ctx.beginPath();
    ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, p.w * 0.14);
    ctx.fill();
    ctx.fillStyle = region(R.FEED, i);
    ctx.beginPath();
    ctx.roundRect(-p.w / 2 + p.w * 0.06, -p.h / 2 + p.w * 0.12, p.w * 0.88, p.h - p.w * 0.22, p.w * 0.06);
    ctx.fill();
    ctx.restore();
  });
  return { horizon, phones };
}

const CARD_TINTS = [ORANGE, GOLD, BLUE, "190,120,230", "120,200,200"];

// One cell of a scrolling social feed, in the phone's screen space (u: 0..1 across, py: px down the feed).
function feed(u: number, py: number, cardH: number, card: number, t: number, glitch: boolean): Shaded {
  const y = (((py % cardH) + cardH) % cardH) / cardH; // position within the post
  const tint = CARD_TINTS[(card * 7 + 3) % CARD_TINTS.length];
  if (glitch) return [RAIN[Math.floor(Math.random() * RAIN.length)], tint, 0.7];
  if (y < 0.14) {
    // Header: avatar + username + "…"
    if (u < 0.16) return [y > 0.03 && y < 0.11 ? "O" : " ", tint, 0.95];
    if (u > 0.22 && u < 0.62 && y > 0.04 && y < 0.1) return ["-", WHITE, 0.7];
    if (u > 0.86) return ["·", GRAY, 0.6];
    return null;
  }
  if (y < 0.66) {
    // The photo: a tinted block with a soft pattern so each post looks different.
    const pat = Math.sin(u * 9 + card) * Math.cos((y - 0.14) * 14 + card * 2);
    return [pat > 0.35 ? "▓" : pat > -0.2 ? "▒" : "░", tint, 0.55 + pat * 0.25];
  }
  if (y < 0.76) {
    // Like · comment · share, and a like counter that keeps climbing.
    if (u < 0.12) return ["♥", card % 3 === 0 ? ORANGE : WHITE, 0.9];
    if (u > 0.18 && u < 0.26) return ["◌", WHITE, 0.7];
    if (u > 0.32 && u < 0.4) return ["↗", WHITE, 0.7];
    if (u > 0.62) {
      const count = `${(card * 37 + Math.floor(t * 3)) % 999}K`;
      const i = Math.floor((u - 0.62) / 0.08);
      return count[i] ? [count[i], GRAY, 0.8] : null;
    }
    return null;
  }
  if (y < 0.92) {
    // Caption lines.
    const len = y < 0.84 ? 0.85 : 0.5 + ((card * 13) % 30) / 100;
    return u < len && Math.floor(u * 40) % 7 !== 0 ? ["-", GRAY, 0.55] : null;
  }
  return null; // gap between posts
}

function shade(c: Cell, f: Frame<Geo>): Shaded {
  const { t, power } = f;
  const noise = 1 - power;
  const tick = Math.floor(t * 12);
  switch (c.region) {
    case R.SKY: {
      // Feed rain: columns fall at their own speed; denser as the light goes.
      const speed = 4 + (c.col * 7919) % 9;
      const head = (t * speed + ((c.col * 131) % 97)) % (f.rows + 20);
      const trail = head - c.row;
      if (trail > 0 && trail < 14 && (c.col * 37) % 5 < 1 + noise * 3) {
        const g = RAIN[(c.row * 13 + tick + c.col) % RAIN.length];
        return [g, trail < 1.5 ? WHITE : GRAY, (1 - trail / 14) * (0.12 + noise * 0.35)];
      }
      if (c.seed > 0.997 - noise * 0.02) return [RAIN[(tick + c.col) % RAIN.length], GRAY, 0.2];
      return null;
    }
    case R.TOWER: {
      if (c.left === R.SKY) return ["|", GRAY, 0.6];
      if (c.right === R.SKY) return ["|", GRAY, 0.35];
      if (c.up === R.SKY || c.up === R.ANTENNA) return ["_", GRAY, 0.6];
      const isWindow = c.col % 3 !== 0 && c.row % 2 === 0;
      if (!isWindow) return [".", GRAY, 0.12];
      // Windows die off as power drops, flickering on the way out.
      const alive = c.seed < power * 0.75 && Math.floor(c.seed * 997 + t * 3) % 29 !== 0;
      return alive ? [c.seed > 0.5 ? "=" : "#", c.seed > 0.92 ? ORANGE : GOLD, 0.35 + c.seed * 0.5] : [":", GRAY, 0.18];
    }
    case R.SCREEN: {
      // Ads and feeds: scrolling glyph noise, glitching harder as the static wins.
      const word = FEED[(c.row + Math.floor(t * 2)) % FEED.length];
      const ch = word[(c.col + tick) % word.length] || "▒";
      const hue = (c.row + Math.floor(t)) % 3 === 0 ? ORANGE : BLUE;
      const glitch = Math.random() < noise * 0.4;
      return [glitch ? RAIN[tick % RAIN.length] : ch, hue, 0.55 + Math.sin(t * 6 + c.row) * 0.2];
    }
    case R.ANTENNA:
      return ["|", GRAY, 0.5];
    case R.PHONE: {
      // Bezel: a dark frame with a lit edge.
      const edge = c.left !== R.PHONE && c.left !== R.FEED ? "|" : c.right !== R.PHONE && c.right !== R.FEED ? "|" : c.up !== R.PHONE && c.up !== R.FEED ? "_" : " ";
      return [edge, GRAY, 0.7, "20,17,24"];
    }
    case R.FEED: {
      const p = f.geo.phones[c.aux];
      if (!p) return null;
      // Into the phone's own (rotated) screen space.
      const dx = c.x - p.x;
      const dy = c.y - p.y;
      const cos = Math.cos(-p.angle);
      const sin = Math.sin(-p.angle);
      const lx = dx * cos - dy * sin;
      const ly = dx * sin + dy * cos;
      const sw = p.w * 0.88;
      const u = lx / sw + 0.5;
      const cardH = sw * 1.25;
      const py = ly + p.h / 2 + t * p.speed; // the feed scrolls forever
      const card = Math.floor(py / cardH) + p.hue * 11;
      // As the city goes dark the feeds glitch harder.
      const glitch = Math.random() < noise * 0.12;
      const fd = feed(u, py, cardH, card, t, glitch);
      return fd ? [fd[0], fd[1], fd[2], "12,10,16"] : [" ", WHITE, 0, "12,10,16"];
    }
  }
  return null;
}

export default function CityScene({ power }: { power: MotionValue<number> }) {
  return <AsciiScene label="An ASCII city of towers and glowing screens under falling glyphs" paint={paint} shade={shade} power={power} cell={9} />;
}
