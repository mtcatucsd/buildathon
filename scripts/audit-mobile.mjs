// Scrolls the site on an emulated phone and reports any canvas whose drawing buffer is stretched
// or squashed by CSS (buffer aspect ≠ displayed aspect), plus any horizontal overflow.
import { chromium } from "playwright";

const url = process.env.URL ?? "http://localhost:5180/";
const phones = [
  { name: "iPhone 15", width: 393, height: 852, dpr: 3 },
  { name: "iPhone SE", width: 375, height: 667, dpr: 2 },
  { name: "Pixel 7", width: 412, height: 915, dpr: 2.625 },
];
const browser = await chromium.launch();
for (const p of phones) {
  const ctx = await browser.newContext({ viewport: { width: p.width, height: p.height }, deviceScaleFactor: p.dpr, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForTimeout(2500);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const problems = new Map();
  for (let y = 0; y < H; y += p.height * 0.5) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(350);
    const found = await page.evaluate(() => {
      const out = [];
      for (const c of document.querySelectorAll("canvas")) {
        const r = c.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
        const buf = c.width / c.height;
        const shown = r.width / r.height;
        const skew = Math.abs(buf / shown - 1);
        if (skew > 0.02) out.push(`${c.className || "canvas"} buffer ${c.width}x${c.height} shown ${Math.round(r.width)}x${Math.round(r.height)} (${(skew * 100).toFixed(1)}% stretch)`);
      }
      if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`horizontal overflow ${document.documentElement.scrollWidth}px`);
      return out;
    });
    for (const f of found) problems.set(f.replace(/\d+x\d+/g, "").slice(0, 60), f);
  }
  console.log(`${p.name}: ${problems.size ? [...problems.values()].join("\n  ") : "no stretched canvases, no overflow"}${errors.length ? "\n  errors: " + errors.join("; ") : ""}`);
  await ctx.close();
}
await browser.close();
