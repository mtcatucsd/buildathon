import { useEffect, useRef } from "react";
// "Ocean Sunset" from ASCII Magic (MIT). Image data: photo by César Couto, Unsplash License.
import * as oceanSunset from "ascii-magic-art/pieces/ocean-sunset.js";
import { paint, renderMode, GlyphAtlas } from "ascii-magic-art/runtime/canvas.js";
import { device } from "./device";

// A minimal player for the piece, in its original look: halftone dots at full resolution, exactly
// as on ascii-magic.com. Unlike the stock player it only paints the cells that are actually on
// screen (a cover-fitted laptop hero crops ~40% of the rows; nothing is wasted off-canvas).
type Frame = { text: string; color: string };
const meta = oceanSunset.meta as { cols: number; rows: number; palette: Record<string, string>; dots?: Record<string, unknown> };

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
    // The piece's own look ("dots") and its halftone tuning, like the stock player.
    const look = { lift: false, ...(meta.dots ?? {}) };
    const drawMode = renderMode(meta, look);
    const atlas = new GlyphAtlas();
    const dpr = device.dpr;
    const fps = device.small ? 8 : 10; // gentle motion; full-res halftone frames are the costliest draw on the page
    let view = { c0: 0, c1: meta.cols, r0: 0, r1: meta.rows, d: 1, x: 0, y: 0, W: 0, H: 0 };
    let raf = 0;
    let last = 0;
    let visible = false;
    const born = performance.now();

    const fit = () => {
      const W = box.clientWidth;
      const H = box.clientHeight;
      if (!W || !H) return;
      const d = mode === "contain" ? Math.min(W / meta.cols, H / meta.rows) : Math.max(W / meta.cols, H / meta.rows);
      const ox = (W - meta.cols * d) / 2;
      const oy = (H - meta.rows * d) / 2;
      const c0 = Math.max(0, Math.floor(-ox / d));
      const c1 = Math.min(meta.cols, Math.ceil((W - ox) / d));
      const r0 = Math.max(0, Math.floor(-oy / d));
      const r1 = Math.min(meta.rows, Math.ceil((H - oy) / d));
      view = { c0, c1, r0, r1, d, x: ox + c0 * d, y: oy + r0 * d, W, H };
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      render(performance.now());
    };

    const render = (now: number) => {
      const t = device.reducedMotion ? 0 : (now - born) / 1000;
      const f = crop(draw(t), view.c0, view.c1, view.r0, view.r1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, view.W, view.H);
      paint(ctx, f, meta.palette, { ...look, x: view.x, y: view.y, cw: view.d, ch: view.d, mode: drawMode, ink: "#e4e4e7", atlas, dpr });
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
