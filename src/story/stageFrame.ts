// Where a scene should place its subject. Wide boxes use the whole canvas. Tall boxes (phones,
// portrait tablets) keep the art full-bleed, but put the subject in the upper part, clear of the
// top bar and of the text panel that overlays the bottom; the scene's world fills the rest.
export function stageFrame(w: number, h: number) {
  // Only where the text panel overlays the art (the ≤900px layout); on wider screens text sits beside it.
  const overlay = typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
  const tall = overlay && w / h < 0.9;
  if (!tall) return { tall, top: 0, h };
  const top = Math.max(56, h * 0.07);
  return { tall, top, h: h * 0.5 };
}
