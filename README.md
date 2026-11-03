# buildathon

Replit x Manara West x MTC Buildathon @ UCSD: site + flyer.

```bash
npm install
npm run dev          # site at http://localhost:5173
npm run flyer        # with dev running → flyers/buildathon-{post,story}.png
```

- Event facts (date, time, venue, links, tracks, prizes, FAQ): `src/data/event.ts`
- Run of show: `src/data/scheduleData.ts`
- Flyer previews in the browser: `/?flyer=post` (1080×1350), `/?flyer=story` (1080×1920)

The Replit logo is always shown unmodified, per Replit's brand rules. Only the Manara West and MTC marks get ASCII/electric effects.

## Credits

- Hero background: "Ocean Sunset" from [ASCII Magic](https://www.ascii-magic.com/ascii/ocean-sunset) (`ascii-magic-art`, MIT). Its image data is a rendering of a photo by César Couto on Unsplash, under the [Unsplash License](https://unsplash.com/license).
- All other ASCII scenes (city, lighthouse, scale, constellation, bubble, globe, trophy) are drawn in code in `src/story/`.
