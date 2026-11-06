// Snapshots the live trophy canvas (full power) and writes a gold, transparent PNG + SVG.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const url = process.env.URL ?? "http://localhost:5199";
const GOLD = "#FFB23F"; // site --gold
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  const cells = new Map();
  window.__cells = cells;
  window.__font = "";
  const P = CanvasRenderingContext2D.prototype;
  const key = (x, y) => `${Math.round(x)}:${Math.round(y)}`;
  const inScope = (ctx) => ctx.canvas.closest(".day-trophy");
  const o = { fillText: P.fillText, fillRect: P.fillRect, clearRect: P.clearRect };
  P.fillText = function (t, x, y) {
    if (inScope(this)) { window.__font = this.font; cells.set(key(x, y), { t, x, y, fill: this.fillStyle }); }
    return o.fillText.call(this, t, x, y);
  };
  P.fillRect = function (x, y, w, h) {
    if (inScope(this)) cells.delete(key(x + w / 2, y + h / 2)); // bg tiles dropped: transparent output
    return o.fillRect.call(this, x, y, w, h);
  };
  P.clearRect = function (x, y, w, h) {
    if (inScope(this) && w < 100) cells.delete(key(x + w / 2, y + h / 2));
    return o.clearRect.call(this, x, y, w, h);
  };
});
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
// The Day is a pinned chapter: scroll to its end so the trophy is fully shown.
for (let i = 0; i < 2; i++) {
  await page.evaluate(() => {
    const s = document.getElementById("the-day");
    window.scrollTo(0, s.offsetTop + s.offsetHeight - window.innerHeight);
  });
  await page.waitForTimeout(2500);
}
const data = await page.evaluate(() => {
  const c = document.querySelector(".day-trophy canvas");
  return { w: c.clientWidth, h: c.clientHeight, font: window.__font, cells: [...window.__cells.values()] };
});
await page.screenshot({ path: "/tmp/trophy-live.png" });
await browser.close();

const { w, h, cells } = data;
const px = Number(/([\d.]+)px/.exec(data.font)?.[1] ?? 9);
const esc = (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] ?? c);
let txt = "";
for (const e of cells) {
  if (!e.t || e.t === " ") continue;
  const m = /rgba?\(([^)]+)\)/.exec(e.fill);
  const [r, g, b, a = 1] = m[1].split(",").map((v) => Number(v.trim()));
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const alpha = Math.min(1, a * (0.3 + 0.9 * lum));
  txt += `<text x="${e.x.toFixed(1)}" y="${e.y.toFixed(1)}" fill-opacity="${alpha.toFixed(2)}">${esc(e.t)}</text>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="A gold ASCII trophy"><g fill="${GOLD}" font-family="'Diatype Semi-Mono', ui-monospace, Menlo, monospace" font-size="${px}" font-weight="500" text-anchor="middle" dominant-baseline="central">${txt}</g></svg>`;
writeFileSync("docs/trophy-gold.svg", svg);

const b2 = await chromium.launch();
const p2 = await b2.newPage({ viewport: { width: Math.round(w), height: Math.round(h) }, deviceScaleFactor: 3 });
await p2.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
await p2.screenshot({ path: "docs/trophy-gold.png", omitBackground: true });
await b2.close();
console.log(`${w}x${h}`, cells.length, "cells");
