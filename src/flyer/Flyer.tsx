import { useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import Beam from "../components/Beam";
import Lockup from "../components/Lockup";
import StaticCity from "../components/StaticCity";
import { freezeBeam } from "../components/beamClock";
import { event, tracks } from "../data/event";

export type FlyerFormat = "post" | "story";

const SIZES: Record<FlyerFormat, { w: number; h: number }> = {
  post: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

export default function Flyer({ format }: { format: FlyerFormat }) {
  useEffect(() => {
    freezeBeam(-14);
    return () => freezeBeam(null);
  }, []);
  const { w, h } = SIZES[format];

  return (
    <div className={`flyer flyer-${format}`} style={{ width: w, height: h }}>
      <StaticCity interactive={false} />
      <Beam />
      <div className="flyer-inner">
        <p className="prompt">&gt; replit x manara_west x mtc</p>
        <Lockup />
        <h1 className="hero-title">BUILDATHON</h1>
        <p className="hero-sub">
          @ UCSD<span className="cursor">_</span>
        </p>
        <p className="flyer-meta">
          {event.date} · {event.time}
          <br />
          {event.venue}
        </p>
        <ul className="flyer-tracks">
          {tracks.map((t) => (
            <li key={t.path}>~{t.path}</li>
          ))}
        </ul>
        <div className="flyer-foot">
          <p className="flyer-facts">
            {event.capacity} spots
            <br />
            {event.prizePool} in prizes
            <br />
            {event.food.toLowerCase()}
            <br />
            teams of 2–3
          </p>
          <div className="flyer-qr">
            <QRCodeSVG value={event.registerUrl} size={format === "story" ? 220 : 180} bgColor="#FAF6F1" fgColor="#191818" marginSize={2} />
            <span>&gt; register on luma</span>
          </div>
        </div>
      </div>
    </div>
  );
}
