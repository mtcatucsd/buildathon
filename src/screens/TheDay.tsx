import { motion, useMotionValueEvent, useTransform } from "motion/react";
import { useState } from "react";
import Chapter, { useChapterProgress } from "../story/Chapter";
import { scheduleData } from "../data/scheduleData";
import TrophyScene from "../story/TrophyScene";
import { event } from "../data/event";

// Map a "2:30 PM" style time onto the chapter's scroll (2:15 PM → 0, 8:00 PM → 1).
const toMinutes = (t: string) => {
  const m = t.replace("~", "").match(/(\d+):(\d+)\s*(AM|PM)/)!;
  return ((+m[1] % 12) + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2];
};
const START = 14 * 60 + 15;
const END = 20 * 60;
const at = (t: string) => (toMinutes(t) - START) / (END - START);
const MAGHRIB = at("4:50 PM");

function Scene() {
  const progress = useChapterProgress();
  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, "change", (p) => {
    let i = 0;
    scheduleData.forEach((s, k) => {
      if (p >= at(s.time) - 0.02) i = k;
    });
    setActive(i);
  });

  // Afternoon gold → Maghrib ember → dusk violet → night.
  const sky = useTransform(
    progress,
    [0, MAGHRIB - 0.12, MAGHRIB, MAGHRIB + 0.15, 1],
    [
      "linear-gradient(180deg, #2a2531 0%, #7a5a3a 65%, #ffb23f 100%)",
      "linear-gradient(180deg, #241c2c 0%, #8a3a24 60%, #ff7d3a 100%)",
      "linear-gradient(180deg, #18141f 0%, #4a1f2c 55%, #ff5a1f 100%)",
      "linear-gradient(180deg, #120f18 0%, #2a1c2c 65%, #6a2a24 100%)",
      "linear-gradient(180deg, #0b090e 0%, #100d14 70%, #1c1726 100%)",
    ]
  );
  const sunY = useTransform(progress, [0, MAGHRIB], ["18%", "92%"]);
  const sunOpacity = useTransform(progress, [MAGHRIB - 0.04, MAGHRIB + 0.02], [1, 0]);
  const moonY = useTransform(progress, [MAGHRIB + 0.05, 1], ["95%", "22%"]);
  const moonOpacity = useTransform(progress, [MAGHRIB + 0.04, MAGHRIB + 0.14], [0, 1]);
  const stars = useTransform(progress, [MAGHRIB + 0.1, 1], [0, 1]);
  // Awards + closing: the moon makes way for the trophy.
  const AWARDS = at("7:30 PM");
  const trophy = useTransform(progress, [AWARDS - 0.06, 1], [0, 1]);
  const trophyOpacity = useTransform(progress, [AWARDS - 0.08, AWARDS - 0.02], [0, 1]);
  const moonFade = useTransform(progress, [AWARDS - 0.1, AWARDS - 0.04], [1, 0]);

  return (
    <motion.div className="day" style={{ background: sky }}>
      <motion.div className="day-stars" style={{ opacity: stars }} />
      <div className="day-orbit">
        <motion.div className="day-sun" style={{ top: sunY, opacity: sunOpacity }} />
        <motion.div style={{ opacity: moonFade }}>
          <motion.div className="day-moon" style={{ top: moonY, opacity: moonOpacity }} />
        </motion.div>
      </div>
      <motion.div className="day-trophy" style={{ opacity: trophyOpacity }}>
        <TrophyScene power={trophy} />
      </motion.div>
      <div className="day-copy">
        <p className="eyebrow">٦ · The Day</p>
        <h2 className="serif-xl dropcap">One afternoon, from Asr to Isha.</h2>
        <p className="day-where">
          {event.date} · {event.venue}
        </p>
        <ol className="day-log">
          {scheduleData.map((s, i) => (
            <li key={s.time + s.title} className={i === active ? "now" : i < active ? "past" : ""}>
              <span className="day-time">{s.time}</span>
              <span className="day-title">{s.title}</span>
              {s.note && <span className="day-note">{s.note}</span>}
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}

export default function TheDay() {
  return (
    <Chapter id="the-day" length={2.6}>
      <Scene />
    </Chapter>
  );
}
