/**
 * Hand-drawn style line icons for "Shop by age" — one simple object per age,
 * drawn in navy with a single soft brand-colour fill. Same 48×48 grid, same
 * stroke weight and rounded ends, so they read as one family.
 */
type P = { accent: string };

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** 0–12 months: baby bodysuit */
function Onesie({ accent }: P) {
  return (
    <>
      <path fill={accent} d="M18 8C20 11 22 12 24 12S28 11 30 8L38 12L35 19L32 17.5V32C32 35 30 37 28 38V41H20V38C18 37 16 35 16 32V17.5L13 19L10 12Z" />
      <path {...S} d="M18 8C20 11 22 12 24 12S28 11 30 8L38 12L35 19L32 17.5V32C32 35 30 37 28 38V41H20V38C18 37 16 35 16 32V17.5L13 19L10 12Z" />
      <path {...S} d="M21 22.5C22 24 26 24 27 22.5" />
      <circle cx="22.5" cy="38.6" r="0.9" fill="currentColor" />
      <circle cx="25.5" cy="38.6" r="0.9" fill="currentColor" />
    </>
  );
}

/** 1–2 years: stacking blocks */
function Blocks({ accent }: P) {
  return (
    <>
      <rect x="17" y="10" width="13" height="13" rx="2.5" transform="rotate(-8 23.5 16.5)" fill={accent} />
      <rect {...S} x="17" y="10" width="13" height="13" rx="2.5" transform="rotate(-8 23.5 16.5)" />
      <rect {...S} x="9" y="26" width="14" height="14" rx="2.5" />
      <rect {...S} x="25" y="26" width="14" height="14" rx="2.5" />
      <circle {...S} cx="16" cy="33" r="3" />
      <path {...S} d="M32 29.5L35.5 36H28.5Z" />
      <path {...S} d="M21.5 15.5l4 2" />
    </>
  );
}

/** 2–4 years: teddy bear */
function Teddy({ accent }: P) {
  return (
    <>
      <circle {...S} cx="14.5" cy="15" r="5" />
      <circle {...S} cx="33.5" cy="15" r="5" />
      <circle cx="14.5" cy="15" r="2.2" fill={accent} />
      <circle cx="33.5" cy="15" r="2.2" fill={accent} />
      <circle cx="24" cy="26" r="12.5" fill="#fff" />
      <circle {...S} cx="24" cy="26" r="12.5" />
      <ellipse cx="24" cy="30.5" rx="5.5" ry="4.2" fill={accent} />
      <circle cx="19.5" cy="23.5" r="1.3" fill="currentColor" />
      <circle cx="28.5" cy="23.5" r="1.3" fill="currentColor" />
      <ellipse cx="24" cy="28.6" rx="1.7" ry="1.2" fill="currentColor" />
      <path {...S} d="M24 29.8V31.4M21.6 32.2C23 33.6 25 33.6 26.4 32.2" />
    </>
  );
}

/** 4–6 years: tricycle */
function Tricycle({ accent }: P) {
  return (
    <>
      <circle cx="31" cy="31" r="8.5" fill={accent} />
      <circle {...S} cx="31" cy="31" r="8.5" />
      <circle {...S} cx="12.5" cy="35" r="4.5" />
      <circle cx="31" cy="31" r="1.4" fill="currentColor" />
      <path {...S} d="M12.5 35H21L31 31" />
      <path {...S} d="M21 35L19.5 25" />
      <path {...S} d="M16 25H23" />
      <path {...S} d="M31 31L27.5 15.5" />
      <path {...S} d="M24.5 15.5H31.5" />
    </>
  );
}

/** 6–8 years: school backpack */
function Backpack({ accent }: P) {
  return (
    <>
      <path {...S} d="M20 14V11.5A4 4 0 0 1 28 11.5V14" />
      <rect {...S} x="12.5" y="14" width="23" height="27" rx="7" />
      <rect x="17" y="27" width="14" height="10" rx="3" fill={accent} />
      <rect {...S} x="17" y="27" width="14" height="10" rx="3" />
      <path {...S} d="M17 31.5H31" />
      <path {...S} d="M18 21H30" />
    </>
  );
}

/** 8–10 years: kite (Makar Sankranti favourite) */
function Kite({ accent }: P) {
  return (
    <>
      <path d="M24 6L12 20H24Z" fill={accent} />
      <path d="M24 20H36L24 34Z" fill={accent} />
      <path {...S} d="M24 6L36 20L24 34L12 20Z" />
      <path {...S} d="M24 6V34M12 20H36" />
      <path {...S} d="M24 34C21 37 27 39 24 42C22.5 43.5 23.5 45 25 45.5" />
      <path {...S} d="M20.5 38.5L23 39.5L20.5 41M27.5 41L25.5 42.5L28 43.5" />
    </>
  );
}

/** 10+ years: headphones */
function Headphones({ accent }: P) {
  return (
    <>
      <path {...S} d="M11 30V25A13 13 0 0 1 37 25V30" />
      <rect x="8" y="27" width="7.5" height="12.5" rx="3.5" fill={accent} />
      <rect x="32.5" y="27" width="7.5" height="12.5" rx="3.5" fill={accent} />
      <rect {...S} x="8" y="27" width="7.5" height="12.5" rx="3.5" />
      <rect {...S} x="32.5" y="27" width="7.5" height="12.5" rx="3.5" />
      <path {...S} d="M22 36.5V28.5L28 27V35" />
      <circle cx="20.4" cy="36.6" r="1.7" fill="currentColor" />
      <circle cx="26.4" cy="35.1" r="1.7" fill="currentColor" />
    </>
  );
}

const BY_SLUG: Record<string, (p: P) => React.ReactElement> = {
  "0-12m": Onesie,
  "1-2y": Blocks,
  "2-4y": Teddy,
  "4-6y": Tricycle,
  "6-8y": Backpack,
  "8-10y": Kite,
  "10y-plus": Headphones,
};
const IN_ORDER = [Onesie, Blocks, Teddy, Tricycle, Backpack, Kite, Headphones];

/** Picks the icon by age slug; any new age falls back to its position in the list. */
export default function AgeIcon({ slug, index, accent, className = "" }: { slug: string; index: number; accent: string; className?: string }) {
  const Icon = BY_SLUG[slug] ?? IN_ORDER[index % IN_ORDER.length];
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <Icon accent={accent} />
    </svg>
  );
}
