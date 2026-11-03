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
  const textY = useTransform(progress, [0, 0.25, 1], [80, 0, -40]);
  const textOpacity = useTransform(progress, [0, 0.18, 0.9, 1], [0, 1, 1, 0]);
  const artScale = useTransform(progress, [0, 1], [0.92, 1.06]);
  const artOpacity = useTransform(progress, [0, 0.12, 0.92, 1], [0, 1, 1, 0.3]);
  const Art = SCENES[track.id];

  return (
    <div className={`track track-${track.side}`}>
      <motion.div className="track-art" style={{ scale: artScale, opacity: artOpacity }}>
        <Art power={power} />
      </motion.div>
      <motion.div className="track-copy" style={{ y: textY, opacity: textOpacity }}>
        <p className="eyebrow">
          {track.numeral} · {track.track}
        </p>
        <h2 className="serif-xl dropcap">{track.title}</h2>
        <p className="track-subtitle">{track.subtitle}</p>
        <p className="track-hook">{track.hook}</p>
        <p className="track-blurb">{track.blurb}</p>
        <p className="track-rule">Consult at least two judges and show how their feedback shaped your prototype.</p>
      </motion.div>
    </div>
  );
}

export default function TrackChapter({ track }: { track: Track }) {
  return (
    <Chapter id={track.id} length={2}>
      <Scene track={track} />
    </Chapter>
  );
}
