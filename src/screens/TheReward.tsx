import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import Reveal from "../components/Reveal";
import { faq, prizes } from "../data/event";

// The appendix: a calm paper page for the details, after the spectacle.
export default function TheReward() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="the-reward" className="paper" data-chapter>
      <div className="paper-inner">
        <Reveal>
          <p className="eyebrow">٧ · The Reward</p>
          <h2 className="serif-xl dropcap">One thousand dollars in prizes.</h2>
          <p className="paper-lede">
            Every track competes for the same pool. Judges score impact, creativity, execution, and the demo.
          </p>
        </Reveal>
        <div className="prizes">
          {prizes.map((p, i) => (
            <Reveal key={p.place} delay={i * 0.08}>
              <article className={`prize prize-${i + 1}`}>
                <span className="prize-place">{p.place}</span>
                <span className="prize-amount">{p.amount}</span>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="rules">
            <div>
              <h3>Teams</h3>
              <p>Two or three people. Coming alone? We form teams right after the opening.</p>
            </div>
            <div>
              <h3>Build</h3>
              <p>Everything is built during the event, on Replit. No code experience required.</p>
            </div>
            <div>
              <h3>Ship</h3>
              <p>Code freeze at 6:30, then a judging expo. Show a working demo and tell its story.</p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <h3 className="faq-heading">Questions</h3>
          <div className="faq">
            {faq.map((item, i) => (
              <div key={item.q} className={`faq-item ${open === i ? "open" : ""}`}>
                <button className="faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  {item.q}
                  <Plus size={18} className="faq-icon" />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.p
                      className="faq-a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {item.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
