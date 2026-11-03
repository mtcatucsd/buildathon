// Renders the flyer route to PNG. Run `npm run dev` first, then `npm run flyer`.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.FLYER_URL ?? "http://localhost:5173";
const formats = { post: [1080, 1350], story: [1080, 1920] };

await mkdir("flyers", { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu"] });
for (const [format, [width, height]] of Object.entries(formats)) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto(`${base}/?flyer=${format}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3500); // let the ASCII field finish its intro
  await page.screenshot({ path: `flyers/buildathon-${format}.png` });
  console.log(`flyers/buildathon-${format}.png`);
  await page.close();
}
await browser.close();
