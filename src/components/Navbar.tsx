import { type MouseEvent, useState } from "react";
import { Menu, X, ExternalLink } from "lucide-react";
import { event } from "../data/event";

type SectionLink = { id: string; label: string; external?: boolean };

const NAV_HEIGHT = 64;

const sectionLinks: SectionLink[] = [
  { id: "about", label: "About" },
  { id: "tracks", label: "Tracks" },
  { id: "schedule", label: "Schedule" },
  { id: "prizes", label: "Prizes" },
  { id: "faq", label: "FAQ" },
  { id: event.registerUrl, label: "Register", external: true },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, id: string, external?: boolean) => {
    setIsMenuOpen(false);
    if (external) return;
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    window.scrollTo({ top: Math.max(target.offsetTop - NAV_HEIGHT, 0), behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav className={`navbar ${isMenuOpen ? "open" : ""}`} aria-label="Primary">
      <div className="navbar-links">
        {sectionLinks.map(({ id, label, external }) => (
          <a
            key={id}
            href={external ? id : `#${id}`}
            className={`navbar-link ${external ? "navbar-link-cta" : ""}`}
            onClick={(e) => handleLinkClick(e, id, external)}
            {...(external && { target: "_blank", rel: "noopener noreferrer" })}
          >
            {label}
            {external && <ExternalLink size={12} style={{ marginLeft: 6 }} />}
          </a>
        ))}
      </div>
      <button
        className="navbar-menu-button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </nav>
  );
}
