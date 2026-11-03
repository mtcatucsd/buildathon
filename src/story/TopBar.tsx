import { ExternalLink } from "lucide-react";
import { event } from "../data/event";
import { scrollToId } from "./smoothScroll";

export default function TopBar() {
  return (
    <header className="topbar">
      <a
        href="#prologue"
        className="topbar-mark"
        onClick={(e) => {
          e.preventDefault();
          scrollToId("prologue");
        }}
      >
        Buildathon <span>@ UCSD</span>
      </a>
      <span className="topbar-date">{event.date} · {event.time}</span>
      <a className="topbar-cta" href={event.registerUrl} target="_blank" rel="noopener noreferrer">
        Register <ExternalLink size={12} />
      </a>
    </header>
  );
}
