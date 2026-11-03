// The narrative, chapter by chapter. Copy lives here so it can be edited without touching layout.

// Chapter list drives the table of contents rail. Numerals are Eastern Arabic.
// `menu` is the plain-language label used in the menu sheet.
export const chapters = [
  { id: "prologue", numeral: "٠", name: "Prologue", menu: "Home" },
  { id: "the-noise", numeral: "١", name: "The Noise", menu: "The Story" },
  { id: "the-signal", numeral: "٢", name: "The Signal", menu: "The Event" },
  { id: "bridging-campuses", numeral: "٣", name: "Bridging Campuses", menu: "Track 1 · Bridging Campuses" },
  { id: "deen-and-dunya", numeral: "٤", name: "Deen & Dunya", menu: "Track 2 · Deen & Dunya" },
  { id: "beyond-the-bubble", numeral: "٥", name: "Beyond the Bubble", menu: "Judges" },
  { id: "the-day", numeral: "٦", name: "The Day", menu: "Schedule" },
  { id: "the-reward", numeral: "٧", name: "The Reward", menu: "Prizes & FAQ" },
  { id: "epilogue", numeral: "٨", name: "Epilogue", menu: "Register" },
];

export type TrackChapter = {
  id: "bridging-campuses" | "deen-and-dunya";
  numeral: string;
  track: string;
  title: string;
  subtitle: string;
  hook: string;
  blurb: string;
  side: "left" | "right";
};

export const trackChapters: TrackChapter[] = [
  {
    id: "bridging-campuses",
    numeral: "٣",
    track: "Track 1",
    title: "Bridging Campuses",
    subtitle: "The Manara Network",
    hook: "Community college or four-year, every campus should be one network away.",
    blurb:
      "How can Manara West better connect Muslim students at community colleges and four-year universities? Build a solution that strengthens collaboration, mentorship, and access to resources across campuses.",
    side: "left",
  },
  {
    id: "deen-and-dunya",
    numeral: "٤",
    track: "Track 2",
    title: "Deen & Dunya",
    subtitle: "Reimagining the Muslim Student Experience",
    hook: "Faith was never meant to live in a separate tab.",
    blurb:
      "How can technology improve the Muslim student experience? Build a solution addressing challenges in faith, academics, career development, or campus life.",
    side: "right",
  },
];
