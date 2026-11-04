// Phones & tablets (≤900px): the text sits on a card at the bottom of the full-bleed stage. Scenes
// measure where that card starts and compose their subject in the space above it, while their world
// (sky, sea, floor, stars) keeps filling the whole stage. On wider screens the text sits beside the art.
export const OVERLAY_MQ = "(max-width: 900px)";
const PANEL_SELECTOR = ".stage-copy, .track-copy, .day-copy";

// The text card of the stage that contains `el` (null on laptop layouts).
export function findPanel(el: Element): HTMLElement | null {
  if (typeof window === "undefined" || !window.matchMedia(OVERLAY_MQ).matches) return null;
  return el.closest(".chapter-stage")?.querySelector<HTMLElement>(PANEL_SELECTOR) ?? null;
}

// Distance from the top of the stage to the top of the card, ignoring transforms (the card fades and slides).
export function panelTop(panel: HTMLElement | null): number {
  return panel && panel.offsetParent ? panel.offsetTop : 0;
}

let currentPanelTop = 0;
// Called by AsciiScene just before a scene paints, so stageFrame() sees that scene's own card.
export function setPanelTop(px: number) {
  currentPanelTop = px;
}

export function stageFrame(w: number, h: number) {
  if (currentPanelTop <= 0) return { tall: false, top: 0, h };
  const top = 60; // clear of the top bar
  const free = currentPanelTop - top - 14; // and a little air above the card
  return { tall: true, top, h: Math.max(h * 0.28, free) };
}
