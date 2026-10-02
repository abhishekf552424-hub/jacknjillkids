/**
 * Re-mounts on every page change, so each page fades softly in.
 * The animation leaves no transform behind, so sticky/fixed bars keep working.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
