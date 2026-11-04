import { motion, useTransform } from "motion/react";
import Chapter, { useChapterProgress } from "../story/Chapter";
import Beats from "../story/Beats";
import LighthouseScene from "../story/LighthouseScene";
import { event } from "../data/event";

function Scene() {
  const progress = useChapterProgress();
  const power = useTransform(progress, [0.18, 0.4], [0, 1]);
  const sceneOpacity = useTransform(progress, [0, 0.1], [0.4, 1]);

  return (
    <>
      <motion.div className="stage-art stage-art-bleed stage-art-scene" style={{ opacity: sceneOpacity }}>
        <LighthouseScene power={power} />
      </motion.div>
      <div className="stage-copy stage-copy-left">
        <Beats
          beats={[
            {
              from: 0,
              to: 0.36,
              content: (
                <>
                  <p className="eyebrow">٢ · The Signal</p>
                  <p className="arabic" lang="ar">
                    منارة
                  </p>
                  <p className="definition">
                    <em>manāra</em> (n.) — a lighthouse; a minaret; a place the light comes from.
                  </p>
                  <p className="serif-lg">Every age needs one.</p>
                </>
              ),
            },
            { from: 0.36, to: 0.66, content: <p className="serif-xl">On November 6, at UCSD, we're turning one on.</p> },
            {
              from: 0.66,
              to: 1,
              content: (
                <>
                  <p className="serif-xl">
                    Two tracks. One afternoon. <em>Pick the light you want to carry.</em>
                  </p>
                  <p className="facts">
                    {event.capacity} builders · teams of 2–3 · {event.prizePool} in prizes · dinner on us
                  </p>
                  <a className="cta" href={event.registerUrl} target="_blank" rel="noopener noreferrer">
                    &gt; register on luma
                  </a>
                </>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}

export default function TheSignal() {
  return (
    <Chapter id="the-signal" length={2.2} phoneTravel={130} snaps={[0, 0.51, 1]}>
      <Scene />
    </Chapter>
  );
}
