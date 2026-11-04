import { motion, useTransform } from "motion/react";
import Chapter, { useChapterProgress } from "../story/Chapter";
import Beats from "../story/Beats";
import BubbleScene from "../story/BubbleScene";

// The rule both tracks share: step outside your own head and talk to the judges.
function Scene() {
  const progress = useChapterProgress();
  const power = useTransform(progress, [0.05, 0.85], [0, 1]);
  return (
    <>
      <div className="stage-art stage-art-right-wide">
        <BubbleScene power={power} />
      </div>
      <div className="stage-copy stage-copy-left stage-copy-narrow">
        <Beats
          beats={[
            {
              from: 0,
              to: 0.45,
              content: (
                <>
                  <p className="eyebrow">٥ · Beyond the Bubble</p>
                  <p className="serif-xl dropcap">Great ideas don't come from inside a bubble.</p>
                </>
              ),
            },
            {
              from: 0.45,
              to: 1,
              content: (
                <>
                  <p className="serif-lg">
                    Both tracks share one rule: <em>talk to at least two judges</em>, and show how their feedback shaped
                    what you built.
                  </p>
                  <p className="facts">
                    Judge office hours · 4:00 – 5:30 PM
                  </p>
                </>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}

export default function BeyondTheBubble() {
  return (
    <Chapter id="beyond-the-bubble" length={2.2} snaps={[0, 0.6, 1]}>
      <Scene />
    </Chapter>
  );
}
