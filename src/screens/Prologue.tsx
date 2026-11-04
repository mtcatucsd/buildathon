import { motion, useTransform } from "motion/react";
import Chapter, { useChapterProgress } from "../story/Chapter";
import SunsetScene from "../story/SunsetScene";
import Lockup from "../components/Lockup";
import DecryptedText from "../components/DecryptedText";
import { event } from "../data/event";
import { device } from "../story/device";

// The hero is not pinned: it scrolls away the moment you do (so the very first swipe always moves
// something), while the sun sinks and the sky darkens behind it as it leaves.
function Scene() {
  const progress = useChapterProgress();
  const night = useTransform(progress, [0, 1], [0, 0.85]);
  // Phones show the whole picture, so no zoom-in (it would crop the edges again).
  const scale = useTransform(progress, [0, 1], device.small ? [1, 1] : [1.02, 1.1]);
  const lift = useTransform(progress, [0, 1], [0, -40]);

  return (
    <>
      <motion.div className="stage-art stage-art-bleed stage-art-hero" style={{ scale }}>
        <SunsetScene />
      </motion.div>
      <motion.div className="stage-night" style={{ opacity: night }} />
      <div className="stage-shade stage-shade-hero" />
      <div className="stage-copy stage-copy-left">
        <motion.div className="beats" style={{ y: lift }}>
          <div className="beat">
            <div className="reveal">
              <p className="eyebrow">Replit × Manara West × MTC present</p>
              <Lockup />
              <h1 className="display">
                <DecryptedText text="BUILDATHON" animateOn="view" sequential speed={45} revealDirection="center" characters="01<>/\|#%&$@" />
              </h1>
              <p className="display-sub">
                @ UCSD<span className="cursor">_</span>
              </p>
              <p className="meta">
                {event.date} · {event.time}
                <br />
                {event.venue}
              </p>
              <a className="cta" href={event.registerUrl} target="_blank" rel="noopener noreferrer">
                &gt; register on luma
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default function Prologue() {
  return (
    <Chapter id="prologue" length={1} snaps={[0]} offset={["start start", "end start"]}>
      <Scene />
    </Chapter>
  );
}
