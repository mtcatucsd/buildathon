declare module "ascii-magic-art/pieces/*.js" {
  export const meta: Record<string, unknown>;
  const create: (...args: unknown[]) => (t: number) => unknown;
  export default create;
}
declare module "ascii-magic-art/runtime/canvas.js" {
  export const CELL_W: number;
  export function renderMode(meta: unknown, look?: Record<string, unknown>): string;
  export function paint(ctx: CanvasRenderingContext2D, frame: unknown, palette: unknown, opts: Record<string, unknown>): void;
  export class GlyphAtlas {}
}
declare module "ascii-magic-art/runtime/glyphs.js" {
  export function restyle(frame: unknown, palette: unknown, opts?: Record<string, unknown>): unknown;
}
