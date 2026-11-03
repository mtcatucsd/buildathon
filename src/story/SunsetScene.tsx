import { useEffect, useRef } from "react";
// "Ocean Sunset" from ASCII Magic (MIT). Image data: photo by César Couto, Unsplash License.
import * as oceanSunset from "ascii-magic-art/pieces/ocean-sunset.js";
import { paint, renderMode, GlyphAtlas } from "ascii-magic-art/runtime/canvas.js";
import { restyle } from "ascii-magic-art/runtime/glyphs.js";
import { device } from "./device";

// A minimal player for the piece. Unlike the stock player it only draws the columns and rows that
// are actually on screen (a portrait phone sees ~40% of the width), and it renders small (merging
// 2×2 cells into one glyph) then scales the canvas up with CSS: about 8× less drawing on phones.
type Frame = { text: string; color: string };
const meta = oceanSunset.meta as { cols: number; rows: number; palette: Record<string, string>; dots?: Record<string, unknown> };
const RENDER = 4.8; // render cell size in px, just under the 5px threshold where cells merge 2×2
const MERGE = 2;

function crop(f: Frame, c0: number, c1: number, r0: number, r1: number): Frame {
  const T = f.text.split("\n").slice(r0, r1);
  const C = f.color.split("\n").slice(r0, r1);
  return { text: T.map((row) => [...row].slice(c0, c1).join("")).join("\n"), color: C.map((row) => [...row].slice(c0, c1).join("")).join("\n") };
}

// fit: "cover" fills the box (cropping the edges); "contain" shows the entire picture.
export default function SunsetScene({ className = "", fit: mode = "cover" }: { className?: string; fit?: "cover" | "contain" }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const draw = (oceanSunset.default as unknown as () => (t: number) => Frame)();
    const look = { look: "ascii", lift: false, ...(meta.dots ?? {}) };
    const drawMode = renderMode(meta, look);
    const atlas = new GlyphAtlas();
    const dpr = device.dpr;
    const fps = device.small ? 10 : 12;
    let view = { c0: 0, c1: meta.cols, r0: 0, r1: meta.rows };
    let raf = 0;
    let last = 0;
    let visible = false;
    const born = performance.now();

    const fit = () => {
      const W = box.clientWidth;
      const H = box.clientHeight;
      if (!W || !H) return;
      // Display cell size so the full grid covers the box; then the visible window, aligned to merges.
      const d = mode === "contain" ? Math.min(W / meta.cols, H / meta.rows) : Math.max(W / meta.cols, H / meta.rows);
      const ox = (W - meta.cols * d) / 2;
      const oy = (H - meta.rows * d) / 2;
      const align = (v: number, up: boolean) => (up ? Math.ceil(v / MERGE) : Math.floor(v / MERGE)) * MERGE;
      const c0 = Math.max(0, align(-ox / d, false));
      const c1 = Math.min(meta.cols, align((W - ox) / d, true));
      const r0 = Math.max(0, align(-oy / d, false));
      const r1 = Math.min(meta.rows, align((H - oy) / d, true));
      view = { c0, c1, r0, r1 };
      const w = (c1 - c0) * RENDER;
      const h = (r1 - r0) * RENDER;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      // Position the cropped window where it sits within the full cover-fitted art, then scale up.
      const k = d / RENDER;
      canvas.style.transform = `translate(${ox + c0 * d}px, ${oy + r0 * d}px) scale(${k})`;
      render(performance.now());
    };

    const render = (now: number) => {
      const t = device.reducedMotion ? 0 : (now - born) / 1000;
      const f = restyle(crop(draw(t), view.c0, view.c1, view.r0, view.r1), meta.palette, { ...look, merge: MERGE }) as Frame & { palette?: Record<string, string> };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      paint(ctx, f, f.palette ?? meta.palette, { ...look, cw: RENDER * MERGE, ch: RENDER * MERGE, mode: drawMode, ink: "#e4e4e7", atlas, dpr });
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || device.reducedMotion) return;
      if (now - last > 1000 / fps) {
        last = now;
        render(now);
      }
      raf = requestAnimationFrame(loop);
    };

    let lastW = 0;
    const ro = new ResizeObserver(() => {
      // Ignore height-only changes (mobile URL bar) so the art doesn't re-crop while scrolling.
      if (box.clientWidth === lastW && lastW) return;
      lastW = box.clientWidth;
      fit();
    });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(box);
    document.fonts.ready.then(fit);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [mode]);

  return (
    <div ref={boxRef} className={`sunset ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="sunset-canvas" />
    </div>
  );
}
