/**
 * Hand-drawn line-art map of the Shahupuri store and a few Kolhapur
 * landmarks, in the same navy line style as the "Shop by age" icons.
 * Stylised (not to scale): it shows where the shop is at a glance; the
 * "Get directions" button opens the real Google Maps route.
 * Pure SVG + CSS animation — no map library, no extra requests.
 */
const INK = "#354275";
const PAPER = "#FFF8EC";
const LINE = { fill: "none", stroke: INK, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

// The route a visitor coming from the station takes; the little rickshaw drives along it.
const ROUTE = "M262 146 C330 150 392 152 414 168 C424 178 422 210 422 250 C422 274 430 292 470 296";

function Road({ d, w = 26 }: { d: string; w?: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={PAPER} strokeWidth={w - 5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={INK} strokeOpacity="0.35" strokeWidth="1.6" strokeDasharray="9 11" strokeLinecap="round" />
    </g>
  );
}

function Tree({ x, y, s = 1, tint = "#DDEBC8" }: { x: number; y: number; s?: number; tint?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="-16" r="13" fill={tint} />
      <circle {...LINE} cx="0" cy="-16" r="13" />
      <path {...LINE} d="M0 -6V10M0 2l-5 -5M0 -2l5 -5" />
    </g>
  );
}

function Label({ x, y, children, anchor = "middle", size = 21 }: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end"; size?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className="font-hand" fontSize={size} fill={INK} stroke={PAPER} strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">
      {children}
    </text>
  );
}

export default function StoreMap({ className = "", fit = "meet" }: { className?: string; fit?: "meet" | "slice" }) {
  return (
    <svg viewBox="0 0 1000 620" preserveAspectRatio={fit === "slice" ? "xMidYMid slice" : "xMinYMid meet"} className={className} role="img" aria-label="Map: Jack & Jill is in Shahupuri, opposite Shahaji Law College, a short ride from Kolhapur station">
      <defs>
        <pattern id={`jjm-dots-${fit}`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill={INK} fillOpacity="0.09" />
        </pattern>
      </defs>
      <rect width="1000" height="620" fill={PAPER} />
      <rect width="1000" height="620" fill={`url(#jjm-dots-${fit})`} />

      {/* Rankala lake */}
      <g>
        <path d="M-10 520 C40 470 150 470 210 505 C260 535 250 600 190 630 L-10 630 Z" fill="#E6EDF8" />
        <path {...LINE} d="M-10 520 C40 470 150 470 210 505 C260 535 250 600 190 630" />
        <path {...LINE} strokeWidth="1.8" strokeOpacity="0.55" d="M40 540c10-6 20-6 30 0s20 6 30 0M95 575c10-6 20-6 30 0s20 6 30 0M30 600c10-6 20-6 30 0s20 6 30 0" />
        <path {...LINE} strokeWidth="1.8" d="M150 548 l14 -16 l4 16 Z M164 532 V552" />
        <Label x={110} y={500}>Rankala Lake</Label>
      </g>

      {/* Roads */}
      <Road d="M-30 150 C250 128 520 172 1030 136" />
      <Road d="M420 -30 C408 180 438 390 418 650" />
      <Road d="M-30 418 C220 396 600 452 1030 404" w={22} />
      <Road d="M418 330 C340 372 300 440 300 520" w={18} />
      <path {...LINE} strokeWidth="1.8" strokeOpacity="0.5" d="M600 150 C610 260 590 330 600 430 M780 140 C770 230 800 330 785 410 M120 150 C130 250 110 330 120 410" />
      <Label x={640} y={128} size={19}>Station Road</Label>
      <text x={448} y={470} className="font-hand" fontSize="19" fill={INK} transform="rotate(-86 448 470)" stroke={PAPER} strokeWidth="5" paintOrder="stroke">Shahupuri</text>

      {/* Railway + station */}
      <g>
        <path {...LINE} d="M-20 62 H560" />
        <path {...LINE} d="M-20 76 H560" />
        <path {...LINE} strokeWidth="1.8" d="M10 58v22M40 58v22M70 58v22M100 58v22M130 58v22M340 58v22M370 58v22M400 58v22M430 58v22M460 58v22M490 58v22M520 58v22" />
        <rect x="186" y="84" width="112" height="52" rx="6" fill="#FFF3C4" />
        <rect {...LINE} x="186" y="84" width="112" height="52" rx="6" />
        <path {...LINE} d="M178 88 L242 60 L306 88" />
        <circle cx="242" cy="104" r="11" fill="#fff" />
        <circle {...LINE} cx="242" cy="104" r="11" />
        <path {...LINE} strokeWidth="1.8" d="M242 97v7l5 3" />
        <path {...LINE} d="M204 136v-16h14v16M266 136v-16h14v16" />
        <Label x={242} y={40}>Kolhapur Station</Label>
      </g>

      {/* Shahaji Law College (opposite the shop) */}
      <g>
        <rect x="292" y="252" width="96" height="58" rx="4" fill="#E6EDF8" />
        <path {...LINE} d="M286 252 L340 226 L394 252 Z" />
        <rect {...LINE} x="292" y="252" width="96" height="58" rx="2" />
        <path {...LINE} d="M306 262v40M326 262v40M354 262v40M374 262v40M286 310h108" />
        <Label x={300} y={346} anchor="middle" size={19}>Shahaji Law College</Label>
      </g>

      {/* Mahalaxmi Mandir */}
      <g>
        <path d="M600 560 V520 L618 486 L636 520 V560 Z" fill="#FDE4E1" />
        <path {...LINE} d="M580 560 H700 M590 560 V528 H690 V560 M600 528 L618 486 L636 528 M646 528 L664 470 L682 528 M664 470 V456 M658 462 h12" />
        <path {...LINE} strokeWidth="1.8" d="M630 560 v-16 a6 6 0 0 1 12 0 v16" />
        <path d="M664 456 l8 4 l-8 4 Z" fill="#EA4137" />
        <Label x={640} y={596}>Mahalaxmi Mandir</Label>
      </g>

      {/* Trees */}
      <Tree x={120} y={260} />
      <Tree x={168} y={300} s={0.8} tint="#FFF3C4" />
      <Tree x={540} y={250} />
      <Tree x={560} y={360} s={0.85} tint="#FDE4E1" />
      <Tree x={700} y={300} />
      <Tree x={860} y={260} s={0.9} tint="#FFF3C4" />
      <Tree x={900} y={520} />
      <Tree x={820} y={560} s={0.8} tint="#FDE4E1" />
      <Tree x={360} y={560} s={0.85} />

      {/* Birds + compass */}
      <path {...LINE} strokeWidth="1.8" d="M660 44 q8 -8 16 0 q8 -8 16 0 M710 70 q6 -6 12 0 q6 -6 12 0" />
      <g transform="translate(930 72)">
        <circle {...LINE} r="30" />
        <path d="M0 -24 L7 0 L0 24 L-7 0 Z" fill="#FCD325" />
        <path {...LINE} strokeWidth="1.8" d="M0 -24 L7 0 L0 24 L-7 0 Z M-24 0 H-14 M14 0 H24" />
        <text y="-36" textAnchor="middle" className="font-hand" fontSize="20" fill={INK}>N</text>
      </g>

      {/* Route from the station + the rickshaw driving it */}
      <path d={ROUTE} fill="none" stroke="#F38838" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 14" className="jjm-route" />
      <g className="jjm-rick" style={{ offsetPath: `path('${ROUTE}')` }}>
        <g transform="translate(-20 -26)">
          <path d="M6 30 V14 C6 8 12 4 20 4 H32 C36 4 38 8 38 12 V30 Z" fill="#FCD325" />
          <path {...LINE} strokeWidth="2" d="M6 30 V14 C6 8 12 4 20 4 H32 C36 4 38 8 38 12 V30 Z M6 18 H38 M22 4 V30" />
          <circle cx="12" cy="32" r="5" fill="#fff" />
          <circle {...LINE} strokeWidth="2" cx="12" cy="32" r="5" />
          <circle cx="34" cy="32" r="5" fill="#fff" />
          <circle {...LINE} strokeWidth="2" cx="34" cy="32" r="5" />
        </g>
      </g>

      {/* The shop */}
      <g transform="translate(486 300)">
        <ellipse cx="0" cy="4" rx="26" ry="8" fill={INK} fillOpacity="0.15" />
        <circle className="jjm-pulse" cx="0" cy="0" r="22" fill="#EA4137" fillOpacity="0.25" />
        <g className="jjm-pin">
          <path d="M0 0 C-6 -16 -26 -30 -26 -50 A26 26 0 0 1 26 -50 C26 -30 6 -16 0 0 Z" fill="#EA4137" />
          <path {...LINE} stroke="#A9251F" strokeWidth="2" d="M0 0 C-6 -16 -26 -30 -26 -50 A26 26 0 0 1 26 -50 C26 -30 6 -16 0 0 Z" />
          <circle cx="0" cy="-50" r="15" fill="#fff" />
          <text x="0" y="-44" textAnchor="middle" fontSize="15" fontWeight="800" fill={INK} className="font-display">J&amp;J</text>
        </g>
        <g transform="translate(34 -88)">
          <rect width="176" height="58" rx="14" fill="#fff" />
          <rect {...LINE} width="176" height="58" rx="14" />
          <text x="16" y="25" className="font-display" fontSize="19" fontWeight="700" fill={INK}>Jack &amp; Jill</text>
          <text x="16" y="45" fontSize="13" fill="#5B6280">Kids store · since 2003</text>
        </g>
      </g>
    </svg>
  );
}
