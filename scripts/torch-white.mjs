// White, transparent-background version of docs/torch-hand.svg (colour → opacity), rendered to PNG.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("docs/torch-hand.svg", "utf8");
const white = src
  .replace(/<g><rect[\s\S]*?<\/g>/, "<g></g>") // drop solid background tiles
  .replace(/<text ([^>]*?)fill="rgb\((\d+),(\d+),(\d+)\)"(?: fill-opacity="([\d.]+)")?>/g, (_, pre, r, g, b, a = "1") => {
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const alpha = Math.min(1, Number(a) * (0.3 + 0.9 * lum));
    return `<text ${pre}fill="#FFFFFF" fill-opacity="${alpha.toFixed(2)}">`;
  });
writeFileSync("docs/torch-hand-white.svg", white);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 501, height: 700 }, deviceScaleFactor: 3 });
await page.setContent(`<body style="margin:0;background:transparent">${white}</body>`);
await page.screenshot({ path: "docs/torch-hand-white.png", omitBackground: true });
await browser.close();
