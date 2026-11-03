import { useEffect, useRef } from "react";
// "Ocean Sunset" from ASCII Magic (MIT). Image data: photo by César Couto, Unsplash License.
import * as oceanSunset from "ascii-magic-art/pieces/ocean-sunset.js";
import { play } from "ascii-magic-art/runtime/player.js";
import { CELL_W } from "ascii-magic-art/runtime/canvas.js";
import { device } from "./device";

// Plays the piece full-bleed: the <pre>'s font size is scaled so the art covers the box.
export default function SunsetScene({ className = "" }: { className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const box = boxRef.current!;
    const pre = preRef.current!;
    // Phones get a single still frame: at cover size the grid is a ~3000px canvas, too heavy to animate there.
    const stop = play(pre, oceanSunset, { look: { look: "ascii" }, maxFps: 12, still: device.small || device.reducedMotion });
    const canvas = pre.nextElementSibling as HTMLCanvasElement;

    // A cell is CELL_W × font-size wide (square cells are as tall as wide), so pick the
    // font size that makes the whole grid cover the box. The player picks it up on its next measure.
    const { cols, rows, cell } = oceanSunset.meta as { cols: number; rows: number; cell?: string };
    const aspect = cell === "square" ? 1 : 1 / CELL_W;
    const fit = () => {
      const px = Math.max(box.clientWidth / (cols * CELL_W), box.clientHeight / (rows * CELL_W * aspect));
      pre.style.fontSize = `${px}px`;
    };
    fit();
    // Refit only when the box width changes (mobile URL-bar height changes shouldn't re-render the art).
    let lastW = box.clientWidth;
    const ro = new ResizeObserver(() => {
      if (box.clientWidth === lastW) return;
      lastW = box.clientWidth;
      fit();
    });
    ro.observe(box);
    return () => {
      ro.disconnect();
      stop();
      canvas?.remove();
    };
  }, []);

  return (
    <div ref={boxRef} className={`sunset ${className}`} aria-hidden="true">
      <pre ref={preRef} className="sunset-pre" />
    </div>
  );
}
