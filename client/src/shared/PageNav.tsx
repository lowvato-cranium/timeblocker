import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface PageNavLink {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface Props {
  links: PageNavLink[];
}

export function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

export function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h4l2 3h4l2-3h4" />
      <path d="M5.5 5h13l2.5 7v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7l2.5-7z" />
    </svg>
  );
}

export function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21V4" />
      <path d="M5 4h13l-3 4.5L18 13H5" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.5-4.5" />
    </svg>
  );
}

const MATCH_CLASS = "search-match";

// Every term must appear in an element's text; elements that aren't
// currently rendered (hidden or collapsed) are skipped.
function findMatches(query: string): HTMLElement[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return Array.from(document.querySelectorAll<HTMLElement>("[data-searchable]")).filter((el) => {
    if (el.getClientRects().length === 0) return false;
    const text = (el.textContent ?? "").toLowerCase();
    return terms.every((t) => text.includes(t));
  });
}

function clearHighlight() {
  document.querySelectorAll(`.${MATCH_CLASS}`).forEach((el) => el.classList.remove(MATCH_CLASS));
}

// A slim on-page nav that floats on the right edge, vertically centered.
// Icon-only at rest so it never competes with the page's own content —
// hovering or focusing a button reveals its label in a flyout to the left
// instead of growing the strip itself.
export function PageNav({ links }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Index of the match last scrolled to, so repeated Enter presses cycle.
  const cursorRef = useRef(-1);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    cursorRef.current = -1;
    clearHighlight();
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      closeSearch();
      return;
    }
    if (e.key !== "Enter") return;
    const matches = findMatches(query);
    clearHighlight();
    if (matches.length === 0) return;
    cursorRef.current = (cursorRef.current + 1) % matches.length;
    const target = matches[cursorRef.current];
    target.classList.add(MATCH_CLASS);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (links.length === 0) return null;

  return (
    <nav className="page-nav" aria-label="Page navigation">
      <div className="page-nav-search">
        {searchOpen && (
          <input
            ref={inputRef}
            className="page-nav-search-input"
            type="text"
            value={query}
            placeholder="Search..."
            aria-label="Search items"
            onChange={(e) => {
              setQuery(e.target.value);
              cursorRef.current = -1;
            }}
            onKeyDown={handleSearchKeyDown}
          />
        )}
        <button
          type="button"
          className="page-nav-btn"
          onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
          aria-label="Search"
          aria-expanded={searchOpen}
        >
          <SearchIcon />
          <span className="page-nav-label">Search</span>
        </button>
      </div>
      {links.map((link) => (
        <button
          key={link.key}
          type="button"
          className="page-nav-btn"
          onClick={link.onClick}
          aria-label={link.label}
        >
          {link.icon}
          <span className="page-nav-label">{link.label}</span>
        </button>
      ))}
    </nav>
  );
}
