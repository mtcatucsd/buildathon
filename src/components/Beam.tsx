import { useEffect, useRef } from "react";
import { BEAM_WIDTH, beamAngle, lamp } from "./beamClock";

// The manara: a lamp that sweeps a cone of light across the static.
export default function Beam() {
  const lampRef = useRef<HTMLDivElement>(null);
  const coneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const r = lampRef.current!.getBoundingClientRect();
      lamp.x = r.left + r.width / 2;
      lamp.y = r.top + r.height / 2;
      coneRef.current!.style.transform = `translateX(-50%) rotate(${beamAngle(now)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const w = BEAM_WIDTH;
  return (
    <div className="beam" aria-hidden="true">
      <div
        ref={coneRef}
        className="beam-cone"
        style={{
          background: `conic-gradient(from ${180 - w}deg at 50% 0%, transparent 0deg, rgba(239,194,91,0.16) ${w * 0.7}deg, rgba(250,246,241,0.22) ${w}deg, rgba(239,194,91,0.16) ${w * 1.3}deg, transparent ${2 * w}deg, transparent 360deg)`,
        }}
      />
      <div ref={lampRef} className="beam-lamp" />
    </div>
  );
}
