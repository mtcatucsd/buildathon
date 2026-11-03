// Single source of truth for the site and the flyer.
export const event = {
  title: "Buildathon",
  partners: "Replit x Manara West x MTC",
  date: "Fri, Nov 6",
  time: "2:30 PM – 7:30 PM",
  venue: "Triton Conference Room, Triton Arena",
  address: "9860 Hopkins Dr, La Jolla, CA 92093",
  registerUrl: "https://luma.com/fc7cjwnl",
  capacity: 50,
  prizePool: "$1,000",
  food: "Food & drinks provided",
};

export const socials = {
  mtc: { handle: "@mtcatucsd", url: "https://www.instagram.com/mtcatucsd/" },
  replit: { handle: "@replit", url: "https://www.instagram.com/replit/" },
  manara: { handle: "@manarawestofficial", url: "https://www.instagram.com/manarawestofficial/" },
};

export type Track = { path: string; title: string; blurb: string };

export const tracks: Track[] = [
  {
    path: "/bridging_campuses",
    title: "Bridging Campuses: The Manara Network",
    blurb:
      "How can Manara West better connect Muslim students at community colleges and four-year universities? Build a solution that strengthens collaboration, mentorship, and access to resources across campuses.",
  },
  {
    path: "/deen_and_dunya",
    title: "Deen & Dunya: Reimagining the Muslim Student Experience",
    blurb:
      "How can technology improve the Muslim student experience? Build a solution addressing challenges in faith, academics, career development, or campus life.",
  },
];

export const prizes = [
  { place: "1st", amount: "$500" },
  { place: "2nd", amount: "$300" },
  { place: "3rd", amount: "$200" },
];

export const faq = [
  {
    q: "Who can join?",
    a: "Any student, any major, any skill level. You do not have to be Muslim to participate or to win.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No. You'll build on Replit, where Agent can take you from idea to working app. Designers, storytellers, and big thinkers are welcome.",
  },
  {
    q: "Do I need a team?",
    a: "Teams are 2–3 people. Coming solo? We run team formation right after the opening, so you'll leave with a squad.",
  },
  {
    q: "How are prizes decided?",
    a: "Both tracks compete for the same $1,000 pool: $500 / $300 / $200 for the top three teams, judged on impact, creativity, execution, and demo.",
  },
  {
    q: "What do I submit?",
    a: "A working prototype built during the event and a short pitch at the judging expo. Every team consults at least two judges and shows how their feedback shaped the build.",
  },
  {
    q: "Is food provided?",
    a: "Yes. Dinner and drinks are on us.",
  },
  {
    q: "How many spots are there?",
    a: "50. Registration is on Luma and requires approval, so apply early.",
  },
];
