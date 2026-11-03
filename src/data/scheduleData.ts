// Prayer times are approximate; confirm against the event date.
export type ScheduleItem = { time: string; title: string; note?: string };

export const scheduleData: ScheduleItem[] = [
  { time: "2:30 PM", title: "Check-in" },
  { time: "2:45 PM", title: "Asr + opening ceremony", note: "track reveal, team formation" },
  { time: "3:15 PM", title: "Building begins" },
  { time: "4:00 PM", title: "Judge office hours open", note: "until 5:30 · every team meets at least two judges" },
  { time: "~4:50 PM", title: "Maghrib" },
  { time: "5:30 PM", title: "Dinner" },
  { time: "~6:10 PM", title: "Isha" },
  { time: "6:30 PM", title: "Code freeze → judging expo" },
  { time: "7:30 PM", title: "Awards + closing" },
];
