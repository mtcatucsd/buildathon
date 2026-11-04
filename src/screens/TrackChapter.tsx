import { motion, useTransform, type MotionValue } from "motion/react";
import Chapter, { useChapterProgress } from "../story/Chapter";
import ScaleScene from "../story/ScaleScene";
import CampusScene from "../story/CampusScene";
import type { TrackChapter as Track } from "../data/story";

const SCENES: Record<Track["id"], (p: { power: MotionValue<number> }) => React.JSX.Element> = {
  "bridging-campuses": CampusScene,
  "deen-and-dunya": ScaleScene,
};

function Scene({ track }: { track: Track }) {
  const progress = useChapterProgress();
  const power = useTransform(progress, [0.08, 0.8], [0, 1]);
  const textY = useTransform(progress, [0, 1], [0, -30]);
  const artScale = useTransform(progress, [0, 1], [0.96, 1.05]);
  // On phones the card shows the hook first, then the full description; laptops show both at once.
  const hookOpacity = useTransform(progress, [0.3, 0.45], [1, 0]);
  const detailOpacity = useTransform(progress, [0.35, 0.5], [0, 1]);
  const Art = SCENES[track.id];

  return (
    <div className={`track track-${track.side}`}>
      <motion.div className="track-art" style={{ scale: artScale }}>
        <Art power={power} />
      </motion.div>
      <motion.div className="track-copy" style={{ y: textY }}>
        <p className="eyebrow">
          {track.numeral} · {track.track}
        </p>
        <h2 className="serif-xl dropcap">{track.title}</h2>
        <p className="track-subtitle">{track.subtitle}</p>
        <div className="track-swap">
          <motion.div className="track-a" style={{ opacity: hookOpacity }}>
            <p className="track-hook">{track.hook}</p>
          </motion.div>
          <motion.div className="track-b" style={{ opacity: detailOpacity }}>
            <p className="track-blurb">{track.blurb}</p>
            <p className="track-rule">Consult at least two judges and show how their feedback shaped your prototype.</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function TrackChapter({ track }: { track: Track }) {
  return (
    <Chapter id={track.id} length={2} snaps={[0.1, 0.6, 1]}>
      <Scene track={track} />
    </Chapter>
  );
}
