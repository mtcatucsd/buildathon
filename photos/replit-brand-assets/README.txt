Replit Brand Assets
===================

Welcome. This kit contains everything you need to represent the Replit brand.

Clean vs Square variants
-------------------------
Every logo and icon ships in two variants:

  Clean   The SVG viewBox and PNG canvas hug the actual artwork with no
          padding. Use the clean version for layouts you control — web pages,
          slide decks, print — where you can set your own margins.

  Square  A 1:1 padded canvas with the mark centered and clear-space margin
          equal to the height of the symbol around the mark. Use the square
          version for app icons, social avatars, OG images, and marketplace
          listings where the container is a fixed square and you cannot add
          your own padding.

File-name convention:
  replit-symbol.svg                          (clean)
  replit-symbol-square.svg                   (square, transparent)
  replit-symbol-square-bg-offwhite.svg       (square, off-white #FAF6F1)
  replit-symbol-square-bg-offblack.svg       (square, off-black #191818)
  replit-symbol-square-bg-orange.svg         (square, Replit Orange #FF3C00)

Square PNGs follow the same pattern with a size suffix:
  replit-symbol-square-1024.png              (square, transparent, 1024px)
  replit-symbol-square-bg-offwhite-1024.png  (square, off-white, 1024px)

Clear-space rule: the margin around the mark on the square canvas equals the
height of the Replit symbol (the ">" glyph). This is the same clear-space
rule documented in the brand guidelines.

Structure
---------
  logos/svg/             Vector logos (clean + square).
                           replit-wordmark / replit-symbol / replit-stacked
                           replit-agent4-badge / replit-agent4-lockup
  logos/png-wordmark/    Rastered wordmarks at 4 sizes.
                           light-bg/         For light backgrounds (#FAF6F1).
                           dark-bg/          For dark backgrounds (#191818).
                           dark-bg-orange/   Orange symbol + light text on dark.
                           off-white/        Solid Off-White wordmark.
                           dark-gray/        Solid Dark-Gray wordmark.
                           square/           Square padded variants.
  logos/png-symbol/      Rastered symbol at 4 sizes.
                           light-bg/         Symbol for light backgrounds.
                           dark-bg/          Symbol for dark backgrounds.
                           off-white/        Solid Off-White symbol.
                           dark-gray/        Solid Dark-Gray symbol.
                           square/           Square padded variants.
  logos/png-stacked/     Stacked lockup of symbol + wordmark.
                           square/           Square padded variants.
  logos/png-agent4/      Agent 4 badge + "Replit Agent 4" lockup.
                           square/           Square padded variants.
  logos/secondary-pill/  Secondary pill logos (lockup + symbol), SVG only.
                         (Intentionally kept as-is — the pill is the padding.)
  logos/animation/       Looping logo animation in .mov and .mp4
                           at 1x1, 16x9, and 9x16.
  logos/favicon.png      64x64 favicon.

  fonts/                 ABC Diatype Plus Variable in WOFF2, TTF, OTF.

  icons/svg/             Four feature pillar icons (clean + square).
  icons/png-light-bg/    BLACK icons for light backgrounds (clean).
  icons/png-dark-bg/     WHITE icons for dark backgrounds (clean).
  icons/png-square/      Square padded icon variants.
  icons/animation/       Animated icon MP4s (bonus — for motion design).

  css/brand-tokens.css   Color custom properties + @font-face declaration.

Rules (the short version)
-------------------------
  * Background should be Off-White (#FAF6F1) or Off-Black (#191818).
  * Use the correct logo variant for your background.
  * Never recolor, stretch, rotate, or add effects to the logo.
  * Clear space around the logo equals the height of the symbol.
  * Never use pure black (#000000) or pure white (#FFFFFF).
  * Never use gradients.

Full guidelines: replit.com/brand
Questions: brand@replit.com
