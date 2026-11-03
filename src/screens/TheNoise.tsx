import { useTransform } from "motion/react";
import Chapter, { useChapterProgress } from "../story/Chapter";
import Beats from "../story/Beats";
import CityScene from "../story/CityScene";

function Scene() {
  const progress = useChapterProgress();
  const power = useTransform(progress, [0.1, 0.85], [1, 0]);
  return (
    <>
      <div className="stage-art stage-art-bleed stage-art-scene">
        <CityScene power={power} />
      </div>
      <div className="stage-shade" />
      <div className="stage-copy stage-copy-left">
        <Beats
          beats={[
            {
              from: 0,
              to: 0.3,
              content: (
                <>
                  <p className="eyebrow">١ · The Noise</p>
                  <p className="serif-xl dropcap">In a world filled with distractions and noise,</p>
                </>
              ),
            },
            { from: 0.3, to: 0.55, content: <p className="serif-lg">how many ideas did you scroll past today?</p> },
            {
              from: 0.55,
              to: 0.78,
              content: <p className="serif-lg">Endless feeds. Borrowed dreams. And real problems in your own community, still waiting for someone to solve them.</p>,
            },
            { from: 0.78, to: 1, content: <p className="serif-xl">One by one, the lights went out.</p> },
          ]}
        />
      </div>
    </>
  );
}

export default function TheNoise() {
  return (
    <Chapter id="the-noise" length={2.4}>
      <Scene />
    </Chapter>
  );
}
