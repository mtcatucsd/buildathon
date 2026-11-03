declare module "ascii-magic-art/pieces/*.js" {
  export const meta: Record<string, unknown>;
  const create: (...args: unknown[]) => (t: number) => unknown;
  export default create;
}
declare module "ascii-magic-art/runtime/player.js" {
  export function play(pre: HTMLPreElement, mod: unknown, opts?: Record<string, unknown>): () => void;
}
declare module "ascii-magic-art/runtime/canvas.js" {
  export const CELL_W: number;
}
