import type { MotionValue } from "motion/react";
import AsciiScene, { region, type Cell, type Frame, type Shaded } from "./AsciiScene";

// Bridging Campuses: an ASCII map of California. Community colleges (ember) and universities (lamplight)
// light up and link into one network as `power` goes 0 → 1, with pulses travelling along the links.

const R = { SEA: 0, LAND: 1 };
const LAMP = "255,178,63";
const EMBER = "255,90,31";
const CREAM = "243,239,230";
const STATIC = "138,132,148";
const SEA = "70,80,110";

// California outline, [lon, lat], clockwise from the north-west corner.
const OUTLINE: [number, number][] = [
  [-124.2, 42.0], [-120.0, 42.0], [-120.0, 39.0], [-114.6, 35.0], [-114.7, 32.7], [-117.1, 32.53],
  [-117.25, 32.75], [-117.4, 33.2], [-117.9, 33.6], [-118.4, 33.75], [-118.8, 34.02], [-119.2, 34.15],
  [-120.0, 34.45], [-120.6, 34.55], [-120.65, 35.2], [-121.0, 35.6], [-121.9, 36.3], [-121.9, 36.6],
  [-122.0, 36.95], [-122.5, 37.5], [-122.5, 37.8], [-123.0, 38.0], [-123.7, 38.9], [-123.8, 39.8],
  [-124.4, 40.4], [-124.1, 41.0], [-124.2, 41.8],
];

type Campus = { name: string; lat: number; lon: number; uni: boolean };
const CAMPUSES: Campus[] = [
  { name: "UCSD", lat: 32.88, lon: -117.24, uni: true },
  { name: "SDSU", lat: 32.77, lon: -117.07, uni: true },
  { name: "UCI", lat: 33.64, lon: -117.84, uni: true },
  { name: "UCR", lat: 33.97, lon: -117.33, uni: true },
  { name: "UCLA", lat: 34.07, lon: -118.44, uni: true },
  { name: "USC", lat: 34.02, lon: -118.29, uni: true },
  { name: "UCSB", lat: 34.41, lon: -119.85, uni: true },
  { name: "Cal Poly", lat: 35.3, lon: -120.66, uni: true },
  { name: "Fresno St", lat: 36.81, lon: -119.75, uni: true },
  { name: "UC Merced", lat: 37.37, lon: -120.42, uni: true },
  { name: "UCSC", lat: 37.0, lon: -122.06, uni: true },
  { name: "SJSU", lat: 37.33, lon: -121.88, uni: true },
  { name: "Stanford", lat: 37.43, lon: -122.17, uni: true },
  { name: "Berkeley", lat: 37.87, lon: -122.26, uni: true },
  { name: "UC Davis", lat: 38.54, lon: -121.75, uni: true },
  { name: "Sac State", lat: 38.56, lon: -121.42, uni: true },
  { name: "Mesa", lat: 32.8, lon: -117.17, uni: false },
  { name: "Grossmont", lat: 32.82, lon: -116.99, uni: false },
  { name: "Southwestern", lat: 32.64, lon: -117.01, uni: false },
  { name: "Palomar", lat: 33.15, lon: -117.18, uni: false },
  { name: "Saddleback", lat: 33.55, lon: -117.66, uni: false },
  { name: "Santa Monica", lat: 34.02, lon: -118.47, uni: false },
  { name: "Pasadena", lat: 34.14, lon: -118.12, uni: false },
  { name: "Fresno City", lat: 36.77, lon: -119.8, uni: false },
  { name: "De Anza", lat: 37.32, lon: -122.04, uni: false },
  { name: "CCSF", lat: 37.73, lon: -122.45, uni: false },
  { name: "Diablo Valley", lat: 37.97, lon: -122.07, uni: false },
  { name: "American River", lat: 38.65, lon: -121.35, uni: false },
];

type Pt = { x: number; y: number; uni: boolean; name: string; order: number };
type Link = { a: number; b: number; order: number };
type Geo = { pts: Pt[]; links: Link[]; label: { x: number; y: number } };

function paint(ctx: CanvasRenderingContext2D, w: number, h: number): Geo {
  // Fit the state's bounding box into the canvas (lon scaled by cos(lat) so it isn't stretched).
  const lonMin = -124.5, lonMax = -114.1, latMin = 32.4, latMax = 42.1;
  const k = Math.cos((37 * Math.PI) / 180);
  const bw = (lonMax - lonMin) * k;
  const bh = latMax - latMin;
  const scale = Math.min((w * 0.92) / bw, (h * 0.92) / bh);
  const ox = (w - bw * scale) / 2;
  const oy = (h - bh * scale) / 2;
  const project = (lon: number, lat: number) => ({ x: ox + (lon - lonMin) * k * scale, y: oy + (latMax - lat) * scale });

  ctx.fillStyle = region(R.LAND);
  ctx.beginPath();
  OUTLINE.forEach(([lon, lat], i) => {
    const p = project(lon, lat);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();

  // Light spreads north from UCSD: order by distance from the host campus.
  const host = CAMPUSES[0];
  const pts: Pt[] = CAMPUSES.map((c) => ({ ...project(c.lon, c.lat), uni: c.uni, name: c.name, order: 0 }))
    .map((p, i) => ({ ...p, d: Math.hypot(CAMPUSES[i].lat - host.lat, CAMPUSES[i].lon - host.lon) }))
    .sort((a, b) => a.d - b.d)
    .map((p, i) => ({ x: p.x, y: p.y, uni: p.uni, name: p.name, order: i }));

  const links: Link[] = [];
  const unis = pts.filter((p) => p.uni);
  // Each community college links to its nearest university…
  pts.forEach((p, i) => {
    if (p.uni) return;
    let best = 0;
    let bd = Infinity;
    unis.forEach((u) => {
      const d = Math.hypot(u.x - p.x, u.y - p.y);
      if (d < bd) ((bd = d), (best = pts.indexOf(u)));
    });
    links.push({ a: i, b: best, order: Math.max(p.order, pts[best].order) });
  });
  // …and every university to the nearest one already lit, so the network chains up the state.
  unis.forEach((u) => {
    const i = pts.indexOf(u);
    let best = -1;
    let bd = Infinity;
    pts.forEach((v, j) => {
      if (!v.uni || v.order >= u.order) return;
      const d = Math.hypot(v.x - u.x, v.y - u.y);
      if (d < bd) ((bd = d), (best = j));
    });
    if (best >= 0) links.push({ a: i, b: best, order: u.order });
  });

  return { pts, links, label: { x: pts[0].x, y: pts[0].y } };
}

// Links are rasterised once per frame into a per-cell map (with a pulse running along each).
let linkCache = { t: -1, cols: 0, map: new Float32Array(0) };
function linkMap(f: Frame<Geo>) {
  if (linkCache.t === f.t && linkCache.cols === f.cols) return linkCache.map;
  const { geo: g, t, power, cols, rows } = f;
  const map = new Float32Array(cols * rows);
  const cw = f.w / cols;
  const ch = f.h / rows;
  const reach = power * g.pts.length;
  for (const [li, l] of g.links.entries()) {
    const grow = Math.max(0, Math.min(1, reach - l.order));
    if (grow <= 0) continue;
    const a = g.pts[l.a];
    const b = g.pts[l.b];
    // A gentle arc bowing west (over the sea), like a flight path.
    const mx = (a.x + b.x) / 2 - Math.abs(a.y - b.y) * 0.12 - 4;
    const my = (a.y + b.y) / 2;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(8, Math.ceil(len / (cw * 0.5)));
    for (let k = 0; k <= steps * grow; k++) {
      const u = k / steps;
      const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x;
      const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y;
      const col = Math.floor(x / cw);
      const row = Math.floor(y / ch);
      if (col < 0 || row < 0 || col >= cols || row >= rows) continue;
      const pulse = Math.max(0, 1 - Math.abs(((t * 0.45 + li * 0.137) % 1) - u) * 8);
      const v = 0.7 + pulse * 0.3;
      const i = row * cols + col;
      if (v > map[i]) map[i] = v;
    }
  }
  linkCache = { t: f.t, cols, map };
  return map;
}

function shade(c: Cell, f: Frame<Geo>): Shaded {
  const { geo: g, power, t } = f;
  const reach = power * g.pts.length;
  const cw = f.w / f.cols;
  const ch = f.h / f.rows;

  // Campus nodes and their halos.
  for (const p of g.pts) {
    const d = Math.hypot((c.x - p.x) / cw, (c.y - p.y) / ch);
    if (d > 3.2) continue;
    const on = p.order < reach;
    const host = p.order === 0;
    if (d < 0.8) {
      if (!on) return [p.uni ? "o" : ".", STATIC, 0.6];
      return [host ? "@" : p.uni ? "@" : "o", host ? CREAM : p.uni ? LAMP : EMBER, 1];
    }
    if (on && d < (host ? 3.2 : 2)) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 3 + p.order);
      return [d < 1.6 ? "*" : ".", p.uni ? LAMP : EMBER, (1 - d / 3.2) * pulse];
    }
  }

  // Host label: "UCSD" written into the map next to its node.
  const lx = Math.round((c.x - g.label.x) / cw);
  const ly = Math.round((c.y - g.label.y) / ch);
  if (ly === 0 && lx >= 3 && lx < 3 + 6) return ["< UCSD"[lx - 3], CREAM, 0.9];

  const link = linkMap(f)[c.row * f.cols + c.col];
  if (link > 0) return [link > 0.95 ? "*" : "-", link > 0.95 ? CREAM : LAMP, link];

  if (c.region === R.LAND) {
    const coast = c.left === R.SEA || c.right === R.SEA || c.up === R.SEA || c.down === R.SEA;
    if (coast) return [c.left === R.SEA || c.right === R.SEA ? "|" : "_", STATIC, 0.8];
    // Faint terrain texture, slightly lit as the network grows.
    return [c.seed > 0.55 ? "." : c.seed > 0.4 ? ":" : " ", STATIC, 0.18 + power * 0.12];
  }
  // Sea: slow swell lines.
  const wave = Math.sin(c.col * 0.3 + c.row * 1.1 + t * 0.8);
  return wave > 0.85 ? ["~", SEA, 0.35] : c.seed > 0.985 ? [".", SEA, 0.3] : null;
}

export default function CampusScene({ power }: { power: MotionValue<number> }) {
  return (
    <AsciiScene
      label="An ASCII map of California where community colleges and universities light up and connect into one network"
      paint={paint}
      shade={shade}
      power={power}
      cell={7}
    />
  );
}
