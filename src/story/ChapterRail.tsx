import { useEffect, useState } from "react";
import { chapters } from "../data/story";
import { scrollToId } from "./smoothScroll";

// Table of contents pinned bottom-left, like the index of a book.
export default function ChapterRail() {
  const [active, setActive] = useState(chapters[0].id);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    document.querySelectorAll("[data-chapter]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="rail" aria-label="Chapters">
      <ol>
        {chapters.map((c) => (
          <li key={c.id} className={c.id === active ? "active" : ""}>
            <a
              href={`#${c.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToId(c.id);
              }}
            >
              <span className="rail-name">{c.name}</span>
              <span className="rail-dots" />
              <span className="rail-num">{c.numeral}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
