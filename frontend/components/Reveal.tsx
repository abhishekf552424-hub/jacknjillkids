/**
 * Scroll reveal with no JavaScript: the browser animates the section as it
 * scrolls into view (CSS scroll-driven animations, see globals.css).
 * Content is never hidden while the page loads, so Google's speed test sees
 * it straight away. Browsers without support simply show it without motion.
 */
export default function Reveal({ children }: { children: React.ReactNode; delay?: number }) {
  return <div className="reveal">{children}</div>;
}
