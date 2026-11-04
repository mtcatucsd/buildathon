import { useEffect, useRef } from "react";
// "Ocean Sunset" from ASCII Magic (MIT). Image data: photo by César Couto, Unsplash License.
import * as oceanSunset from "ascii-magic-art/pieces/ocean-sunset.js";
import { paint, renderMode, GlyphAtlas } from "ascii-magic-art/runtime/canvas.js";
import { device } from "./device";
import { findPanel, panelTop } from "./stageFrame";

// A minimal player for the piece, in its original look: halftone dots at full resolution, exactly as
// on ascii-magic.com.
//  · Laptops: the picture covers the screen (only the cells actually on screen are painted).
//  · Phones: the picture (palms kept, ~10% trimmed off each side) sits at the top of the screen and fades
//    into the dark behind the text card below it.
type Frame = { text: string; color: string };
const meta = oceanSunset.meta as { cols: number; rows: number; palette: Record<string, string>; dots?: Record<string, unknown> };

const PALETTE = Object.entries(meta.palette).map(([key, hex]) => ({
  key,
  rgb: [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
}));
const RGB = new Map(PALETTE.map((p) => [p.key, p.rgb]));

function crop(f: Frame, c0: number, c1: number, r0: number, r1: number): Frame {
  const T = f.text.split("\n").slice(r0, r1);
  const C = f.color.split("\n").slice(r0, r1);
  return { text: T.map((row) => [...row].slice(c0, c1).join("")).join("\n"), color: C.map((row) => [...row].slice(c0, c1).join("")).join("\n") };
}

export default function SunsetScene({ className = "" }: { className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const draw = (oceanSunset.default as unknown as () => (t: number) => Frame)();
    const look = { lift: false, ...(meta.dots ?? {}) }; // the piece's own halftone tuning
    const drawMode = renderMode(meta, look);
    const atlas = new GlyphAtlas();
    // The dots are ~1px: 2× is plenty, and the dot painter's cost scales with pixels, so 3× would cost 2.25× more.
    const dpr = Math.min(device.dpr, 2);
    const fps = device.small ? 8 : 10; // gentle motion; full-resolution halftone frames are the costliest draw on the page
    const panel = findPanel(box);
    // Where the picture sits: x/y/size of one cell, which rows/cols of it are shown, and its clear rect.
    let view = { c0: 0, c1: meta.cols, r0: 0, r1: meta.rows, d: 1, x: 0, y: 0, W: 0, H: 0 }; // x/y: where to paint inside the picture canvas
    let key = "";
    let raf = 0;
    let last = 0;
    let visible = false;
    const born = performance.now();

    const paintFrame = (f: Frame, x: number, y: number, d: number) =>
      paint(ctx, f, meta.palette, { ...look, x, y, cw: d, ch: d, mode: drawMode, ink: "#e4e4e7", atlas, dpr });

    const fit = () => {
      const W = box.clientWidth;
      const H = box.clientHeight;
      const card = panelTop(panel);
      if (!W || !H || key === `${W}x${H}x${card}`) return;
      key = `${W}x${H}x${card}`;
      // The animated canvas is only as big as it needs to be: the dot painter rewrites a full-size pixel
      // buffer on every frame, so a screen-sized canvas for a picture-sized animation would be pure waste.
      const place = (left: number, top: number, w: number, h: number) => {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.left = `${left}px`;
        canvas.style.top = `${top}px`;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      // How much of the picture's width "cover" would crop on this screen. On a landscape laptop that's a
      // sliver; on any portrait screen (a phone, or an iPad held upright) it's most of the picture, losing
      // both palm trees. Whenever it would lose more than ~20%, show the whole picture instead.
      const cover = Math.max(W / meta.cols, H / meta.rows);
      const showAll = card > 0 || W / (meta.cols * cover) < 0.8;

      if (showAll) {
        // Phones and portrait tablets: the picture zoomed in to cover the whole space above the text card
        // (centred on the sun, the sides cropped), running a little under the card's top edge.
        const areaH = (card > 0 ? card : H) + 24;
        const d = Math.max(W / meta.cols, areaH / meta.rows);
        const bandH = meta.rows * d;
        const ox = (W - meta.cols * d) / 2;
        const c0 = Math.max(0, Math.floor(-ox / d));
        const c1 = Math.min(meta.cols, Math.ceil((W - ox) / d));
        const x = ox + c0 * d;
        const y = areaH - bandH; // bottom-aligned to the card, so the sea meets the card
        view = { c0, c1, r0: 0, r1: meta.rows, d, x, y: 0, W, H: bandH };
        place(0, y, W, bandH);
        // Soften the picture's bottom edge so it melts into the card instead of ending in a hard line.
        const mask = `linear-gradient(to bottom, #000 0px, #000 ${Math.round(bandH * 0.85)}px, transparent ${Math.round(bandH)}px)`;
        canvas.style.maskImage = mask;
        canvas.style.webkitMaskImage = mask;
      } else {
        // Landscape screens: the picture covers the screen; paint only the cells that are on screen.
        const d = cover;
        const ox = (W - meta.cols * d) / 2;
        const oy = (H - meta.rows * d) / 2;
        const c0 = Math.max(0, Math.floor(-ox / d));
        const c1 = Math.min(meta.cols, Math.ceil((W - ox) / d));
        const r0 = Math.max(0, Math.floor(-oy / d));
        const r1 = Math.min(meta.rows, Math.ceil((H - oy) / d));
        view = { c0, c1, r0, r1, d, x: ox + c0 * d, y: oy + r0 * d, W, H };
        place(0, 0, W, H);
        canvas.style.maskImage = canvas.style.webkitMaskImage = "none";
      }
      render(performance.now());
    };

    const render = (now: number) => {
      const t = device.reducedMotion ? 0 : (now - born) / 1000;
      const f = crop(draw(t), view.c0, view.c1, view.r0, view.r1);
      ctx.clearRect(0, 0, view.W, view.H);
      paintFrame(f, view.x, view.y, view.d);
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

    const ro = new ResizeObserver(fit);
    ro.observe(box);
    if (panel) ro.observe(panel);
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
  }, []);

  return (
    <div ref={boxRef} className={`sunset ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="sunset-canvas" />
    </div>
  );
}