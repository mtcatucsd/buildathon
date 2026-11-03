// The narrative, chapter by chapter. Copy lives here so it can be edited without touching layout.

// Chapter list drives the table of contents rail. Numerals are Eastern Arabic.
export const chapters = [
  { id: "prologue", numeral: "٠", name: "Prologue" },
  { id: "the-noise", numeral: "١", name: "The Noise" },
  { id: "the-signal", numeral: "٢", name: "The Signal" },
  { id: "bridging-campuses", numeral: "٣", name: "Bridging Campuses" },
  { id: "deen-and-dunya", numeral: "٤", name: "Deen & Dunya" },
  { id: "beyond-the-bubble", numeral: "٥", name: "Beyond the Bubble" },
  { id: "the-day", numeral: "٦", name: "The Day" },
  { id: "the-reward", numeral: "٧", name: "The Reward" },
  { id: "epilogue", numeral: "٨", name: "Epilogue" },
];

export type TrackChapter = {
  id: "bridging-campuses" | "deen-and-dunya";
  numeral: string;
  track: string;
  path: string;
  title: string;
  hook: string;
  blurb: string;
  side: "left" | "right";
};

export const trackChapters: TrackChapter[] = [
  {
    id: "bridging-campuses",
    numeral: "٣",
    track: "Track 1",
    path: "~/bridging_campuses",
    title: "Bridging Campuses: The Manara Network",
    hook: "Community college or four-year, every campus should be one network away.",
    blurb:
      "How can Manara West better connect Muslim students at community colleges and four-year universities? Build a solution that strengthens collaboration, mentorship, and access to resources across campuses.",
    side: "left",
  },
  {
    id: "deen-and-dunya",
    numeral: "٤",
    track: "Track 2",
    path: "~/deen_and_dunya",
    title: "Deen & Dunya: Reimagining the Muslim Student Experience",
    hook: "Faith was never meant to live in a separate tab.",
    blurb:
      "How can technology improve the Muslim student experience? Build a solution addressing challenges in faith, academics, career development, or campus life.",
    side: "right",
  },
];
