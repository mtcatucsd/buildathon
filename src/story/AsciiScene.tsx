import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";

// Engine for drawn (procedural) ASCII scenes.
// 1. `paint` draws the scene's shapes into a stencil using region ids (see `region()`).
// 2. `shade` turns every grid cell into a glyph + colour, once per frame.
// Scenes that move their shapes (e.g. a tilting scale) set `dynamic` so the stencil is repainted each frame.

export type Cell = {
  col: number;
  row: number;
  x: number; // centre, CSS px
  y: number;
  region: number;
  aux: number; // green channel: per-shape index (e.g. which edge of a graph)
  left: number; // neighbouring regions, for silhouette edges
  right: number;
  up: number;
  down: number;
  seed: number;
};

export type Frame<G> = { t: number; power: number; w: number; h: number; cols: number; rows: number; geo: G };
// Optional 4th value: a solid background tile behind the glyph (for silhouettes).
export type Shaded = [glyph: string, rgb: string, alpha: number, bg?: string] | null;

// Paint colour for a region id (+ optional 0–255 index). Ids are spaced so antialiasing still rounds to a real id.
export const region = (id: number, aux = 0) => `rgb(${id * 16},${aux},0)`;

type Props<G> = {
  paint: (ctx: CanvasRenderingContext2D, w: number, h: number, power: number, t: number) => G;
  shade: (cell: Cell, f: Frame<G>) => Shaded;
  power?: MotionValue<number>;
  cell?: number;
  dynamic?: boolean;
  label: string;
  className?: string;
};

const FONT = '"Diatype Semi-Mono", ui-monospace, monospace';
const CHAR_ASPECT = 0.6;
// Stencil supersampling: each cell reads the centre of a 3×3 block, away from antialiased edges.
const SS = 3;

export default function AsciiScene<G>({ paint, shade, power, cell = 9, dynamic = false, label, className = "" }: Props<G>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef(paint);
  const shadeRef = useRef(shade);
  paintRef.current = paint;
  shadeRef.current = shade;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const stencil = document.createElement("canvas");
    const sctx = stencil.getContext("2d", { willReadFrequently: true })!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const born = performance.now();
    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let cw = 0;
    let ch = 0;
    let cells: Cell[] = [];
    let geo = null as G;
    let raf = 0;
    let last = 0;
    let visible = false;

    const restencil = (p: number, t: number) => {
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, cols * SS, rows * SS);
      sctx.setTransform((cols * SS) / W, 0, 0, (rows * SS) / H, 0, 0);
      geo = paintRef.current(sctx, W, H, p, t);
      const px = sctx.getImageData(0, 0, cols * SS, rows * SS).data;
      // Each cell takes the most common *exact* region value in its 3×3 block; antialiased
      // pixels are blends (not multiples of 16, or semi-transparent) and are ignored.
      const W3 = cols * SS;
      const idGrid = new Uint8Array(cols * rows);
      const auxGrid = new Uint8Array(cols * rows);
      const counts = new Uint8Array(16);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          counts.fill(0);
          let best = -1;
          let bestN = 0;
          let bestAux = 0;
          for (let yy = 0; yy < SS; yy++) {
            for (let xx = 0; xx < SS; xx++) {
              const k = ((r * SS + yy) * W3 + c * SS + xx) * 4;
              const a = px[k + 3];
              const v = px[k];
              let idv = -1;
              if (a === 0) idv = 0;
              else if (a === 255 && v % 16 === 0) idv = v / 16;
              if (idv < 0) continue;
              if (++counts[idv] > bestN) {
                bestN = counts[idv];
                best = idv;
                bestAux = px[k + 1];
              }
            }
          }
          const center = ((r * SS + 1) * W3 + c * SS + 1) * 4;
          idGrid[r * cols + c] = best >= 0 ? best : Math.round(px[center] / 16);
          auxGrid[r * cols + c] = best >= 0 ? bestAux : px[center + 1];
        }
      }
      const id = (c: number, r: number) => (c < 0 || r < 0 || c >= cols || r >= rows ? 0 : idGrid[r * cols + c]);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = cells[r * cols + c];
          k.region = id(c, r);
          k.aux = auxGrid[r * cols + c];
          k.left = id(c - 1, r);
          k.right = id(c + 1, r);
          k.up = id(c, r - 1);
          k.down = id(c, r + 1);
        }
      }
    };

    const layout = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      if (!W || !H) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const size = W < 700 ? cell * 0.8 : cell;
      cols = Math.round(W / size);
      rows = Math.round((H / size) * CHAR_ASPECT);
      cw = W / cols;
      ch = H / rows;
      stencil.width = cols * SS;
      stencil.height = rows * SS;
      cells = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          cells.push({ col: c, row: r, x: (c + 0.5) * cw, y: (r + 0.5) * ch, region: 0, aux: 0, left: 0, right: 0, up: 0, down: 0, seed: Math.random() });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `500 ${ch * 0.95}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      restencil(power?.get() ?? 1, 0);
    };

    const draw = (now: number) => {
      if (!cols) return;
      const t = reduce ? 0 : (now - born) / 1000;
      const p = power?.get() ?? 1;
      if (dynamic) restencil(p, t);
      const frame: Frame<G> = { t, power: p, w: W, h: H, cols, rows, geo };
      ctx.clearRect(0, 0, W, H);
      const sh = shadeRef.current;
      for (const c of cells) {
        const s = sh(c, frame);
        if (!s) continue;
        if (s[3]) {
          ctx.fillStyle = `rgb(${s[3]})`;
          ctx.fillRect(c.x - cw / 2, c.y - ch / 2, cw + 0.5, ch + 0.5);
        }
        if (s[2] <= 0.01) continue;
        ctx.fillStyle = `rgba(${s[1]},${Math.min(1, s[2])})`;
        ctx.fillText(s[0], c.x, c.y);
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      if (now - last > 1000 / 30) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(() => {
      layout();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(canvas);
    document.fonts.ready.then(() => {
      layout();
      draw(performance.now());
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [cell, dynamic, power]);

  return <canvas ref={canvasRef} className={`ascii-scene ${className}`} role="img" aria-label={label} />;
}
