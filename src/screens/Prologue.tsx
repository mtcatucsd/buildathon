import { motion, useTransform } from "motion/react";
import Chapter, { useChapterProgress } from "../story/Chapter";
import Beats from "../story/Beats";
import SunsetScene from "../story/SunsetScene";
import Lockup from "../components/Lockup";
import DecryptedText from "../components/DecryptedText";
import { event } from "../data/event";
import { device } from "../story/device";

function Scene() {
  const progress = useChapterProgress();
  // The sun goes down as you scroll: a dark overlay fades in (opacity is GPU-cheap; filters are not).
  const night = useTransform(progress, [0, 0.55, 1], [0, 0.45, 0.88]);
  // Phones show the whole picture, so no zoom (it would crop the edges again).
  const scale = useTransform(progress, [0, 1], device.small ? [1, 1] : [1.04, 1.16]);
  const hint = useTransform(progress, [0, 0.06], [1, 0]);

  return (
    <>
      <motion.div className="stage-art stage-art-bleed stage-art-hero" style={{ scale }}>
        <SunsetScene fit={device.small ? "contain" : "cover"} />
      </motion.div>
      <motion.div className="stage-night" style={{ opacity: night }} />
      <div className="stage-shade stage-shade-hero" />
      <div className="stage-copy stage-copy-left">
        <Beats
          beats={[
            {
              from: 0,
              to: 0.45,
              content: (
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
              ),
            },
          ]}
        />
      </div>
      <motion.p className="scroll-cue" style={{ opacity: hint }}>
        scroll to begin ↓
      </motion.p>
    </>
  );
}

export default function Prologue() {
  return (
    <Chapter id="prologue" length={2}>
      <Scene />
    </Chapter>
  );
}
