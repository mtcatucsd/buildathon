import { useRef } from "react";
import { useScroll, useTransform } from "motion/react";
import Reveal from "../components/Reveal";
import TorchScene from "../story/TorchScene";
import { event, socials } from "../data/event";

export default function Epilogue() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const power = useTransform(scrollYProgress, [0.1, 0.75], [0, 1]);

  return (
    <section id="epilogue" ref={ref} className="epilogue" data-chapter>
      <div className="epilogue-grid">
        <Reveal>
          <p className="eyebrow">٨ · Epilogue</p>
          <p className="serif-xl">Every lighthouse starts with one light.</p>
          <p className="serif-xl gold">What will you build?</p>
          <a className="cta cta-lg" href={event.registerUrl} target="_blank" rel="noopener noreferrer">
            &gt; claim one of {event.capacity} spots
          </a>
          <p className="meta">
            {event.date} · {event.time} · {event.venue}
          </p>
        </Reveal>
        <div className="epilogue-hand">
          <TorchScene power={power} />
        </div>
      </div>

      <div className="partners">
        <a href={socials.manara.url} target="_blank" rel="noopener noreferrer" aria-label="Manara West on Instagram">
          <img src="/brand/manara-light.webp" alt="Manara West" className="partners-manara" />
        </a>
        <a href={socials.replit.url} target="_blank" rel="noopener noreferrer" aria-label="Replit on Instagram">
          <img src="/brand/replit-lockup-pill.svg" alt="Replit" className="partners-replit" />
        </a>
        <a href={socials.mtc.url} target="_blank" rel="noopener noreferrer" aria-label="MTC at UCSD on Instagram">
          <img src="/brand/mtc.png" alt="Muslim Tech Collaborative at UCSD" className="partners-mtc" />
        </a>
      </div>

      <footer className="madeby">
        made with love by{" "}
        <a href={socials.mtc.url} target="_blank" rel="noopener noreferrer">
          @mtcatucsd
        </a>
      </footer>
    </section>
  );
}
