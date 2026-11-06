// Snapshots the live torch canvas at full flame and writes it as an SVG of coloured glyphs.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.env.URL ?? "http://localhost:5199";
const out = process.argv[2] ?? "docs/torch-hand.svg";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  const cells = new Map(); // key -> {t,x,y,fill} | {bg,x,y,w,h}
  window.__cells = cells;
  window.__font = "";
  const P = CanvasRenderingContext2D.prototype;
  const key = (x, y) => `${Math.round(x)}:${Math.round(y)}`;
  const orig = { fillText: P.fillText, fillRect: P.fillRect, clearRect: P.clearRect };
  P.fillText = function (t, x, y) {
    if (this.canvas.classList.contains("ascii-scene") && this.canvas.closest(".epilogue-hand")) {
      window.__font = this.font;
      const k = key(x, y);
      const e = cells.get(k) ?? {};
      cells.set(k, { ...e, t, x, y, fill: this.fillStyle });
    }
    return orig.fillText.call(this, t, x, y);
  };
  P.fillRect = function (x, y, w, h) {
    if (this.canvas.closest(".epilogue-hand")) cells.set(key(x + w / 2, y + h / 2), { bg: this.fillStyle, x, y, w, h });
    return orig.fillRect.call(this, x, y, w, h);
  };
  P.clearRect = function (x, y, w, h) {
    if (this.canvas.closest(".epilogue-hand") && w < 100) cells.delete(key(x + w / 2, y + h / 2));
    return orig.clearRect.call(this, x, y, w, h);
  };
});
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.querySelector(".epilogue-hand").scrollIntoView({ block: "center" }));
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollBy(0, 400));
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector(".epilogue-hand").scrollIntoView({ block: "center" }));
await page.waitForTimeout(3000);
const data = await page.evaluate(() => {
  const c = document.querySelector(".epilogue-hand canvas");
  return { w: c.clientWidth, h: c.clientHeight, font: window.__font, cells: [...window.__cells.values()] };
});
await page.screenshot({ path: "/tmp/torch-live.png" });
await browser.close();

const { w, h, cells } = data;
const px = Number(/([\d.]+)px/.exec(data.font)?.[1] ?? 9);
const rgba = (s) => {
  const m = /rgba?\(([^)]+)\)/.exec(s);
  if (!m) return { c: s, a: 1 };
  const [r, g, b, a = 1] = m[1].split(",").map((v) => Number(v.trim()));
  return { c: `rgb(${r},${g},${b})`, a: +a };
};
const esc = (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c);
let bgs = "";
let txt = "";
for (const e of cells) {
  if (e.bg !== undefined && e.t === undefined) {
    const { c } = rgba(e.bg);
    bgs += `<rect x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}" width="${(e.w).toFixed(1)}" height="${(e.h).toFixed(1)}" fill="${c}"/>`;
  }
}
for (const e of cells) {
  if (e.t === undefined || e.t === " ") continue;
  const { c, a } = rgba(e.fill);
  txt += `<text x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}" fill="${c}"${a < 1 ? ` fill-opacity="${a.toFixed(2)}"` : ""}>${esc(e.t)}</text>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="A raised hand holding a torch with a blazing flame, drawn in ASCII like a Renaissance chalk study"><g>${bgs}</g><g font-family="'Diatype Semi-Mono', ui-monospace, Menlo, monospace" font-size="${px}" font-weight="500" text-anchor="middle" dominant-baseline="central">${txt}</g></svg>`;
writeFileSync(out, svg);
console.log(out, `${w}x${h}`, cells.length, "cells", (svg.length / 1024).toFixed(0) + "KB");
