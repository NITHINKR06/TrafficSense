'use client';

import React, { useEffect, useId, useState } from "react";

/**
 * Animated traffic map for the site background. Pure SVG + SMIL + CSS: no libraries.
 *
 * WHAT MOVES
 *  - Small arrow vehicles drive along every corridor in a seamless loop.
 *  - Two crash events repeat on their own timers: two vehicles converge, collide,
 *    a burst appears, a "reported" pin pops in, the road jams red, then it clears.
 *  - South-west flood: the water edge slowly rises and recedes, waves flow toward
 *    the sea, and the river channel flows.
 *
 * THEMING
 *  Follows your theme switcher through CSS variables: light by default, dark when an
 *  ancestor has class="dark" or data-theme="dark", and the OS setting when no theme
 *  class is set (system mode). Force with tone="light" | "dark". Override any colour on
 *  the className, e.g. className="[--cm-bg:#f3efe6]".
 *
 * MOTION
 *  Respects prefers-reduced-motion: vehicles stop rendering and crash pins show static.
 */

type Tone = "light" | "dark" | "auto";
type Pt = [number, number];

const LIGHT = `
  --cm-bg:#ECE6D8; --cm-sea:#C9D9DC; --cm-contour:#9DB9C0; --cm-park:#D3DEBC;
  --cm-block:#E2DBCA; --cm-casing:#BDB4A0; --cm-road:#FBF8F0; --cm-ink:#1B1F26;
  --cm-label:#6D6A62; --cm-chip:#FBF8F0; --cm-chip-stroke:#1B1F26; --cm-chip-text:#1B1F26;
  --cm-grid:#D4CCBA; --cm-node:#FBF8F0; --cm-node-ring:#1B1F26; --cm-vehicle:#1B1F26;
  --cm-free:#2E9E72; --cm-slow:#E2A81C; --cm-jam:#E0482C; --cm-water:#2D5BD6;
  --cm-grain:.16;
`;

const DARK = `
  --cm-bg:#14181E; --cm-sea:#10222B; --cm-contour:#27505E; --cm-park:#17261F;
  --cm-block:#1B222B; --cm-casing:#0C0F13; --cm-road:#3A4756; --cm-ink:#0C0F13;
  --cm-label:#7C8A99; --cm-chip:#1B222B; --cm-chip-stroke:#8A97A6; --cm-chip-text:#E6ECF2;
  --cm-grid:#202831; --cm-node:#14181E; --cm-node-ring:#8A97A6; --cm-vehicle:#F1F5F9;
  --cm-free:#35B085; --cm-slow:#E0AE2E; --cm-jam:#EA5A3F; --cm-water:#4B7BEA;
  --cm-grain:.10;
`;

/* ---------- geometry ---------- */

const R: Record<string, Pt[]> = {
  A: [[320, 740], [440, 740], [640, 540], [860, 540], [1010, 390], [1200, 390]],
  B: [[520, 0], [520, 150], [600, 230], [600, 470], [520, 550], [520, 800]],
  C: [[280, 330], [430, 330], [500, 400], [800, 400], [880, 320], [1200, 320]],
  D: [[780, 0], [780, 110], [880, 210], [880, 320]],
  E: [[1060, 800], [1060, 600], [930, 470]],
  F: [[300, 550], [520, 550]],
};

const toD = (pts: Pt[]) => "M" + pts.map((p) => p.join(" ")).join("L");
const rev = (pts: Pt[]) => [...pts].reverse();
const len = (pts: Pt[]) =>
  pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

const JUNCTIONS: Pt[] = [
  [520, 660], [600, 400], [500, 400], [880, 320],
  [930, 470], [640, 540], [600, 230], [520, 550],
];

// Ambient traffic: road, reversed?, speed (px/s), start offset (s)
const AMBIENT: [string, boolean, number, number][] = [
  ["A", false, 80, 0], ["A", true, 70, 7], ["A", false, 58, 19],
  ["B", false, 75, 3], ["B", true, 64, 11],
  ["C", false, 85, 5], ["C", true, 60, 14], ["C", false, 50, 22],
  ["D", false, 70, 2], ["D", true, 55, 9],
  ["E", true, 60, 4], ["E", false, 50, 12],
  ["F", false, 40, 1],
];

const ICON = {
  accident: "M5 16v-5l2-5h10l2 5v5M3 16h18M7.5 16v3M16.5 16v3",
  pulse: "M3 12h4l2-4 4 8 2-4h6",
  water: "M3 9c3 2 5-2 9 0s6 2 9 0M3 15c3 2 5-2 9 0s6 2 9 0",
  notice: "M4 10v4h3l8 4V6L7 10zM18 9a4 4 0 0 1 0 6",
};

const VEHICLE = "M-5.5 -3.8L6 0L-5.5 3.8L-2.8 0Z";

// Flood outline in two states with identical structure so the edge can morph.
const FLOOD_LOW =
  "M300 640C360 620 450 640 520 680C570 720 560 770 520 800H312C300 740 290 690 300 640Z";
const FLOOD_HIGH =
  "M296 632C360 604 470 626 548 676C604 716 596 776 552 800H310C292 740 282 690 296 632Z";

const wavePath = (x0: number, y: number, w: number) =>
  `M${x0} ${y} q 15 -6 30 0` + " t 30 0".repeat(Math.floor(w / 30) - 1);

/* ---------- small pieces ---------- */

function PinBody({
  fill, fg, icon, label, ring,
}: { fill: string; fg: string; icon: string; label: string; ring?: boolean }) {
  const w = label.length * 6.4 + 16;
  return (
    <>
      {ring && <circle r="27" fill="none" stroke={fill} strokeWidth="1.6" strokeDasharray="3 4" />}
      <circle r="16" cx="2.5" cy="3" fill="var(--cm-ink)" opacity=".35" />
      <circle r="16" fill={fill} stroke="var(--cm-ink)" strokeWidth="2.2" />
      <path
        d={icon}
        transform="translate(-9 -9) scale(.75)"
        fill="none"
        stroke={fg}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g transform="translate(25 -11)">
        <rect x="2" y="2" width={w} height="22" fill="var(--cm-ink)" opacity=".3" />
        <rect width={w} height="22" fill="var(--cm-chip)" stroke="var(--cm-chip-stroke)" strokeWidth="1.4" />
        <text
          x={w / 2}
          y="15"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--cm-chip-text)"
          style={{ fontFamily: "var(--font-body, 'Instrument Sans', system-ui, sans-serif)" }}
        >
          {label}
        </text>
      </g>
    </>
  );
}

function Pin(props: { x: number; y: number; fill: string; fg: string; icon: string; label: string; ring?: boolean }) {
  const { x, y, ...rest } = props;
  return (
    <g transform={`translate(${x} ${y})`}>
      <PinBody {...rest} />
    </g>
  );
}

/** One car travelling a road, looping seamlessly (fades in and out at the ends). */
function Car({ pts, speed, offset }: { pts: Pt[]; speed: number; offset: number }) {
  const dur = `${(len(pts) / speed).toFixed(2)}s`;
  const begin = `${-offset}s`;
  return (
    <g opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.06;.94;1" dur={dur} begin={begin} repeatCount="indefinite" />
      <animateMotion path={toD(pts)} dur={dur} begin={begin} repeatCount="indefinite" rotate="auto" />
      <path d="M-6 0H-17" stroke="var(--cm-vehicle)" strokeWidth="2" strokeLinecap="round" opacity=".3" />
      <path d={VEHICLE} fill="var(--cm-vehicle)" stroke="var(--cm-road)" strokeWidth=".8" strokeLinejoin="round" />
    </g>
  );
}

/**
 * A repeating crash. Timeline (fraction of one cycle):
 *  0.00-0.04 vehicles fade in   0.40 impact   0.43-0.47 report pin pops in
 *  0.46-0.55 road jams red      0.80-0.88 vehicles clear   0.84-0.90 pin and jam fade
 */
function Crash({
  animated, cycle, offset, at, a, b, jam, label,
}: {
  animated: boolean; cycle: number; offset: number; at: Pt;
  a: Pt[]; b: Pt[]; jam: string[]; label: string;
}) {
  const dur = `${cycle}s`;
  const begin = `${-offset}s`;
  const base = { dur, begin, repeatCount: "indefinite" as const };
  const pin = <PinBody fill="var(--cm-jam)" fg="var(--cm-ink)" icon={ICON.accident} label={label} ring />;

  if (!animated) {
    return (
      <g>
        {jam.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--cm-jam)" strokeWidth="7.5" strokeLinecap="butt" strokeLinejoin="round" />
        ))}
        <g transform={`translate(${at[0]} ${at[1]})`}>{pin}</g>
      </g>
    );
  }

  const vehicle = (pts: Pt[], tilt: number) => (
    <g opacity="0">
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.04;.8;.88;1" {...base} />
      <animateMotion
        path={toD(pts)}
        rotate="auto"
        calcMode="linear"
        keyPoints="0;1;1"
        keyTimes="0;.4;1"
        {...base}
      />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values={`0;0;${tilt};${tilt}`}
          keyTimes="0;.4;.46;1"
          {...base}
        />
        <path d={VEHICLE} fill="var(--cm-vehicle)" stroke="var(--cm-jam)" strokeWidth="1.4" strokeLinejoin="round" />
      </g>
    </g>
  );

  return (
    <g>
      {/* congestion building up behind the crash */}
      <g fill="none" strokeLinejoin="round" opacity="0">
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.46;.55;.84;.92;1" {...base} />
        {jam.map((d, i) => (
          <g key={i}>
            <path d={d} stroke="var(--cm-jam)" strokeWidth="17" opacity=".14" />
            <path d={d} stroke="var(--cm-ink)" strokeWidth="11" opacity=".55" />
            <path d={d} stroke="var(--cm-jam)" strokeWidth="7.5" />
          </g>
        ))}
      </g>

      {vehicle(a, 32)}
      {vehicle(b, -38)}

      <g transform={`translate(${at[0]} ${at[1]})`}>
        {/* shock ring */}
        <circle r="6" fill="none" stroke="var(--cm-jam)" strokeWidth="2.4" opacity="0">
          <animate attributeName="r" values="6;6;6;40;40" keyTimes="0;.4;.41;.54;1" {...base} />
          <animate attributeName="opacity" values="0;0;.9;0;0" keyTimes="0;.4;.41;.54;1" {...base} />
        </circle>
        {/* sparks */}
        <g opacity="0" stroke="var(--cm-jam)" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;.4;.41;.5;1" {...base} />
          <animateTransform attributeName="transform" type="scale" values=".6;.6;1.8;1.8" keyTimes="0;.4;.5;1" {...base} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <path key={deg} d="M9 0H17" transform={`rotate(${deg})`} />
          ))}
        </g>
        {/* report pin pops in, holds, fades */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.43;.47;.84;.9;1" {...base} />
          <g>
            <animateTransform attributeName="transform" type="scale" values=".2;.2;1.15;1;1" keyTimes="0;.43;.48;.52;1" {...base} />
            {pin}
          </g>
        </g>
      </g>
    </g>
  );
}

/* ---------- main component ---------- */

export function StylisedCityMap({
  className = "",
  tone = "auto",
  showLabels = true,
}: {
  className?: string;
  tone?: Tone;
  showLabels?: boolean;
}) {
  const uid = "cm" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [animated, setAnimated] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimated(!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  const roads = Object.values(R).map(toD);

  const traffic = [
    { d: "M440 740L640 540H720", c: "var(--cm-jam)", cls: "slow" },
    { d: "M500 400H800L880 320", c: "var(--cm-slow)", cls: "" },
    { d: "M600 230V470", c: "var(--cm-slow)", cls: "" },
    { d: "M860 540L1010 390H1200", c: "var(--cm-free)", cls: "fast" },
    { d: "M520 0V150L600 230", c: "var(--cm-free)", cls: "fast" },
    { d: "M880 320H1200", c: "var(--cm-free)", cls: "fast" },
  ];

  const floodMorph = animated ? (
    <animate
      attributeName="d"
      values={`${FLOOD_LOW};${FLOOD_HIGH};${FLOOD_LOW}`}
      dur="14s"
      repeatCount="indefinite"
      calcMode="spline"
      keyTimes="0;.5;1"
      keySplines=".45 0 .55 1;.45 0 .55 1"
    />
  ) : null;

  return (
    <div
      data-tone={tone}
      className={`${uid} relative w-full h-full overflow-hidden ${className}`}
      style={{ background: "var(--cm-bg)", fontFamily: "var(--font-body)" }}
    >
      <style>{`
        .${uid} { ${LIGHT} }
        :is(.dark, [data-theme="dark"]) .${uid} { ${DARK} }
        @media (prefers-color-scheme: dark) {
          :root:not(.light):not(.dark):not([data-theme]) .${uid} { ${DARK} }
        }
        .${uid}[data-tone="light"] { ${LIGHT} }
        .${uid}[data-tone="dark"] { ${DARK} }

        .${uid}-flow { stroke-dasharray: 1 15; animation: ${uid}-dash 2.4s linear infinite; }
        .${uid}-flow.fast { animation-duration: 1.4s; }
        .${uid}-flow.slow { animation-duration: 4.5s; }
        @keyframes ${uid}-dash { to { stroke-dashoffset: -16; } }

        .${uid}-river { animation: ${uid}-river 2.6s linear infinite; }
        @keyframes ${uid}-river { to { stroke-dashoffset: 10; } }

        .${uid}-wave { animation: ${uid}-wave 7s linear infinite; }
        .${uid}-wave.w1 { animation-duration: 9s; }
        .${uid}-wave.w2 { animation-duration: 11s; }
        @keyframes ${uid}-wave { to { transform: translateX(-60px); } }

        .${uid}-ripple { transform-box: fill-box; transform-origin: center; animation: ${uid}-ripple 3.6s ease-out infinite; }
        @keyframes ${uid}-ripple { 0% { transform: scale(.6); opacity: .5; } 100% { transform: scale(2.2); opacity: 0; } }

        @media (prefers-reduced-motion: reduce) {
          .${uid}-flow, .${uid}-river, .${uid}-wave, .${uid}-ripple { animation: none; }
          .${uid}-ripple { opacity: 0; }
        }
      `}</style>

      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="Animated traffic map of Mangaluru: vehicles moving, crashes being reported, and a flooded area"
      >
        <defs>
          <pattern id={`${uid}-dots`} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="var(--cm-grid)" />
          </pattern>
          <pattern id={`${uid}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--cm-contour)" strokeWidth="1.2" />
          </pattern>
          <radialGradient id={`${uid}-vig`} cx="58%" cy="48%" r="78%">
            <stop offset="0.6" stopColor="var(--cm-bg)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--cm-bg)" stopOpacity="0.85" />
          </radialGradient>
          <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
            <feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.2 -.1" />
          </filter>
          <path
            id={`${uid}-coast`}
            d="M0 0H230C270 140 210 240 262 340C314 440 236 530 286 640C316 720 292 780 308 800"
          />
          <clipPath id={`${uid}-flood`}>
            <path d={FLOOD_LOW}>{floodMorph}</path>
          </clipPath>
        </defs>

        <rect width="1200" height="800" fill="var(--cm-bg)" />
        <rect width="1200" height="800" fill={`url(#${uid}-dots)`} />

        {/* Sea + contours */}
        <path
          d="M0 0H230C270 140 210 240 262 340C314 440 236 530 286 640C316 720 292 780 308 800H0Z"
          fill="var(--cm-sea)"
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <use
            key={i}
            href={`#${uid}-coast`}
            transform={`translate(${-(i + 1) * 26} 0)`}
            fill="none"
            stroke="var(--cm-contour)"
            strokeWidth="1.3"
            opacity={0.8 - i * 0.14}
          />
        ))}
        <use href={`#${uid}-coast`} fill="none" stroke="var(--cm-contour)" strokeWidth="2.2" />

        {/* River, flowing west toward the sea */}
        <path d="M290 610C500 560 640 690 900 700S1150 660 1200 670" fill="none" stroke="var(--cm-sea)" strokeWidth="34" strokeLinecap="round" />
        <path
          d="M290 610C500 560 640 690 900 700S1150 660 1200 670"
          fill="none"
          stroke="var(--cm-contour)"
          strokeWidth="1.6"
          strokeDasharray="2 8"
          className={`${uid}-river`}
        />

        {/* Districts and parks */}
        <rect x="660" y="250" width="150" height="110" fill="var(--cm-block)" />
        <rect x="660" y="250" width="150" height="110" fill={`url(#${uid}-hatch)`} opacity=".45" />
        <rect x="360" y="440" width="120" height="80" fill="var(--cm-block)" />
        <rect x="360" y="440" width="120" height="80" fill={`url(#${uid}-hatch)`} opacity=".45" />
        <rect x="940" y="520" width="130" height="90" fill="var(--cm-block)" />
        <rect x="560" y="90" width="110" height="80" rx="24" fill="var(--cm-park)" />
        <rect x="930" y="160" width="130" height="100" rx="30" fill="var(--cm-park)" />
        <rect x="780" y="570" width="110" height="60" rx="22" fill="var(--cm-park)" />

        {/* Corridors */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {roads.map((d, i) => <path key={`c${i}`} d={d} stroke="var(--cm-casing)" strokeWidth="15" />)}
          {roads.map((d, i) => <path key={`r${i}`} d={d} stroke="var(--cm-road)" strokeWidth="9" />)}
        </g>

        {/* Traffic state: faint glow, ink outline, flat colour, slow dashes */}
        <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
          {traffic.map((s, i) => (
            <g key={i}>
              <path d={s.d} stroke={s.c} strokeWidth="17" opacity=".14" />
              <path d={s.d} stroke="var(--cm-ink)" strokeWidth="11" opacity=".55" />
              <path d={s.d} stroke={s.c} strokeWidth="7.5" />
              <path d={s.d} stroke="var(--cm-road)" strokeWidth="2" opacity=".55" className={`${uid}-flow ${s.cls}`} />
            </g>
          ))}
        </g>

        {/* Junctions */}
        {JUNCTIONS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6.5" fill="var(--cm-node)" stroke="var(--cm-node-ring)" strokeWidth="2.2" />
        ))}

        {/* Flood: rising/receding edge, waves flowing toward the sea */}
        <g>
          <path d={FLOOD_LOW} fill="var(--cm-water)" opacity=".26">{floodMorph}</path>
          <g clipPath={`url(#${uid}-flood)`} fill="none" stroke="var(--cm-water)" strokeLinecap="round">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <g key={i} className={`${uid}-wave w${i % 3}`}>
                <path d={wavePath(240, 646 + i * 22, 520)} strokeWidth="1.7" opacity={0.7 - (i % 3) * 0.15} />
              </g>
            ))}
          </g>
          <path d={FLOOD_LOW} fill="none" stroke="var(--cm-water)" strokeWidth="1.8" strokeDasharray="5 4" opacity=".85">
            {floodMorph}
          </path>
        </g>

        {/* Labels */}
        {showLabels && (
          <g
            fontSize="10.5"
            fontWeight="600"
            fill="var(--cm-label)"
            letterSpacing="1.6"
            style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)" }}
          >
            <text x="648" y="128">LADYHILL</text>
            <text x="372" y="428">KSRTC</text>
            <text x="540" y="612">HAMPANKATTA</text>
            <text x="760" y="674">PUMPWELL</text>
            <text x="112" y="420" textAnchor="middle" fontStyle="italic" fill="var(--cm-contour)" letterSpacing="2.5">
              ARABIAN SEA
            </text>
          </g>
        )}

        {/* Survey-sheet details */}
        <g stroke="var(--cm-label)" strokeWidth="1.2" fill="none" opacity=".8">
          {[[40, 40], [1160, 40], [40, 760], [1160, 760]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <path d="M-9 0H9M0 -9V9" />
              <circle r="4" />
            </g>
          ))}
          <g transform="translate(980 742)">
            <path d="M0 0H120M0 -4V4M30 -3V3M60 -4V4M90 -3V3M120 -4V4" />
            <text x="0" y="-10" fontSize="9.5" fill="var(--cm-label)" stroke="none" letterSpacing="1.2"
              style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)" }}>
              2 KM
            </text>
          </g>
          <g transform="translate(1128 690)">
            <path d="M0 -18L7 8L0 3L-7 8Z" fill="var(--cm-label)" stroke="none" />
            <text y="22" textAnchor="middle" fontSize="10" fill="var(--cm-label)" stroke="none"
              style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', ui-monospace, monospace)" }}>
              N
            </text>
          </g>
        </g>

        {/* Ambient vehicles */}
        {animated &&
          AMBIENT.map(([road, reversed, speed, offset], i) => (
            <Car key={i} pts={reversed ? rev(R[road]) : R[road]} speed={speed} offset={offset} />
          ))}

        {/* Crash events (each loops on its own timer) */}
        <Crash
          animated={animated}
          cycle={16}
          offset={0}
          at={[600, 400]}
          a={[[520, 0], [520, 150], [600, 230], [600, 400]]}
          b={[[280, 330], [430, 330], [500, 400], [600, 400]]}
          jam={["M600 250V400", "M500 400H600"]}
          label="Collision reported"
        />
        <Crash
          animated={animated}
          cycle={18}
          offset={9}
          at={[930, 470]}
          a={[[440, 740], [640, 540], [860, 540], [930, 470]]}
          b={[[1060, 800], [1060, 600], [930, 470]]}
          jam={["M860 540L930 470", "M1060 600L930 470"]}
          label="Crash reported"
        />

        {/* Standing markers */}
        <Pin x={800} y={400} fill="var(--cm-slow)" fg="var(--cm-ink)" icon={ICON.pulse} label="Heavy traffic" />
        <Pin x={880} y={265} fill="var(--cm-road)" fg="var(--cm-ink)" icon={ICON.notice} label="Advisory" />
        <g transform="translate(380 740)">
          <circle r="16" fill="none" stroke="var(--cm-water)" strokeWidth="1.6" className={`${uid}-ripple`} />
          <circle r="16" fill="none" stroke="var(--cm-water)" strokeWidth="1.6" className={`${uid}-ripple`} style={{ animationDelay: "1.8s" }} />
          <PinBody fill="var(--cm-water)" fg="#FFFFFF" icon={ICON.water} label="Waterlogging" />
        </g>

        {/* Edge fade + print grain */}
        <rect width="1200" height="800" fill={`url(#${uid}-vig)`} />
        <rect width="1200" height="800" filter={`url(#${uid}-grain)`} style={{ opacity: "var(--cm-grain)", mixBlendMode: "overlay" }} />
      </svg>
    </div>
  );
}