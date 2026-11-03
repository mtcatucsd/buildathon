import { useEffect, useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { event } from "../data/event";
import { chapters } from "../data/story";
import { lockScroll, scrollToId } from "./smoothScroll";

export default function TopBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    // Let the sheet start closing and scrolling unlock before jumping.
    requestAnimationFrame(() => scrollToId(id));
  };

  return (
    <>
      <header className="topbar">
        <a
          href="#prologue"
          className="topbar-mark"
          onClick={(e) => {
            e.preventDefault();
            go("prologue");
          }}
        >
          Buildathon <span>@ UCSD</span>
        </a>
        <span className="topbar-date">
          {event.date} · {event.time}
        </span>
        <a className="topbar-cta" href={event.registerUrl} target="_blank" rel="noopener noreferrer">
          Register <ExternalLink size={12} />
        </a>
        <button className="topbar-menu" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Menu size={20} />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="menu-scrim"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.nav
              className="menu"
              aria-label="Sections"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="menu-head">
                <span className="menu-title">Buildathon</span>
                <button className="menu-close" onClick={() => setOpen(false)} aria-label="Close menu">
                  <X size={22} />
                </button>
              </div>
              <ol className="menu-list">
                {chapters.map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.03 }}
                  >
                    <a
                      href={`#${c.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(c.id);
                      }}
                    >
                      <span>{c.menu}</span>
                      <span className="menu-num">{c.numeral}</span>
                    </a>
                  </motion.li>
                ))}
              </ol>
              <p className="menu-foot">
                {event.date} · {event.time}
                <br />
                {event.venue}
              </p>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
