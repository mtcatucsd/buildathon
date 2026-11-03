import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { useChapterProgress } from "./Chapter";

export type Beat = { from: number; to: number; content: ReactNode };

// Narration lines that fade up in their own slice of the chapter's scroll.
export default function Beats({ beats, className = "" }: { beats: Beat[]; className?: string }) {
  const progress = useChapterProgress();
  return (
    <div className={`beats ${className}`}>
      {beats.map((b, i) => (
        <BeatLine key={i} beat={b} progress={progress} first={i === 0} last={i === beats.length - 1} />
      ))}
    </div>
  );
}

function BeatLine({ beat, progress, first, last }: { beat: Beat; progress: MotionValue<number>; first: boolean; last: boolean }) {
  const fade = Math.min(0.06, (beat.to - beat.from) / 4);
  const input = [beat.from, beat.from + fade, beat.to - fade, beat.to];
  const opacity = useTransform(progress, input, [first ? 1 : 0, 1, 1, last ? 1 : 0]);
  const y = useTransform(progress, input, [first ? 0 : 28, 0, 0, last ? 0 : -28]);
  const blur = useTransform(progress, input, [first ? 0 : 6, 0, 0, last ? 0 : 6], { clamp: true });
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  return (
    <motion.div className="beat" style={{ opacity, y, filter }}>
      {beat.content}
    </motion.div>
  );
}
