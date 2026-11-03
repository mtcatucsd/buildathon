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
                  <p className="serif-xl dropcap">The world got loud.</p>
                </>
              ),
            },
            { from: 0.3, to: 0.55, content: <p className="serif-lg">Endless feeds. Borrowed ideas. Screens that never sleep.</p> },
            { from: 0.55, to: 0.78, content: <p className="serif-lg">Problems nobody in the room is solving.</p> },
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
