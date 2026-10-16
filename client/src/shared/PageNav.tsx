import type { ReactNode } from "react";

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

// A slim on-page nav that floats on the right edge, vertically centered.
// Icon-only at rest so it never competes with the page's own content —
// hovering or focusing a button reveals its label in a flyout to the left
// instead of growing the strip itself.
export function PageNav({ links }: Props) {
  if (links.length === 0) return null;

  return (
    <nav className="page-nav" aria-label="Page navigation">
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
