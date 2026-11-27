import React from "react";

export function StylisedCityMap({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#ECE6D8] ${className}`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="Stylised map of Mangaluru"
      >
        <defs>
          <radialGradient id="ts-hg" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#FF5B2E" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FF5B2E" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="800" fill="#ECE6D8" />
        {/* Arabian Sea + Gurupura/Netravati river curve */}
        <path
          d="M0 0H250C300 120 230 220 280 330C330 440 250 520 300 640C330 720 300 780 320 800H0Z"
          fill="#BCD3DA"
        />
        <path
          d="M300 640C520 590 640 710 900 720S1150 690 1200 700"
          fill="none"
          stroke="#BCD3DA"
          strokeWidth="30"
          strokeLinecap="round"
        />
        {/* Parks */}
        <rect x="560" y="110" width="130" height="90" rx="26" fill="#D6E2BD" />
        <rect x="830" y="430" width="160" height="120" rx="30" fill="#D6E2BD" />
        <rect x="400" y="580" width="100" height="70" rx="22" fill="#D6E2BD" />
        <rect x="930" y="170" width="120" height="100" rx="28" fill="#D6E2BD" />

        {/* Subtle street grid */}
        <g transform="rotate(-16 600 400)" stroke="#FBF9F3" strokeWidth="5" fill="none">
          <path d="M-300 60H1500M-300 130H1500M-300 200H1500M-300 270H1500M-300 340H1500M-300 410H1500M-300 480H1500M-300 550H1500M-300 620H1500M-300 690H1500M-300 760H1500M-300 830H1500" />
          <path d="M120 -200V1000M210 -200V1000M300 -200V1000M390 -200V1000M480 -200V1000M570 -200V1000M660 -200V1000M750 -200V1000M840 -200V1000M930 -200V1000M1020 -200V1000M1110 -200V1000M1200 -200V1000" />
        </g>

        {/* Arterial roads */}
        <g fill="none" strokeLinecap="round">
          <path d="M0 700C300 640 500 420 1200 180" stroke="#E9B764" strokeWidth="15" />
          <path d="M0 700C300 640 500 420 1200 180" stroke="#F7D18E" strokeWidth="10" />
          <path d="M280 300C450 320 620 280 780 340S1050 420 1200 400" stroke="#D9D1BF" strokeWidth="17" />
          <path d="M280 300C450 320 620 280 780 340S1050 420 1200 400" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M520 0C540 200 600 380 590 560S640 720 660 800" stroke="#D9D1BF" strokeWidth="17" />
          <path d="M520 0C540 200 600 380 590 560S640 720 660 800" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M300 560C500 520 700 560 900 500S1100 470 1200 520" stroke="#D9D1BF" strokeWidth="17" />
          <path d="M300 560C500 520 700 560 900 500S1100 470 1200 520" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M780 0C760 120 800 260 780 340" stroke="#D9D1BF" strokeWidth="15" />
          <path d="M780 0C760 120 800 260 780 340" stroke="#FFFFFF" strokeWidth="10" />
        </g>

        {/* Corridor labels */}
        <g
          fontFamily="'JetBrains Mono',monospace"
          fontSize="11"
          fontWeight="600"
          fill="#6B7180"
          letterSpacing="1.5"
        >
          <text x="620" y="125" textAnchor="middle">LADYHILL</text>
          <text x="720" y="660" textAnchor="middle">PUMPWELL</text>
          <text x="440" y="440" textAnchor="middle">KSRTC</text>
          <text x="590" y="560" textAnchor="middle">HAMPANKATTA</text>
        </g>
        <text
          x="110"
          y="420"
          fontFamily="'Instrument Sans',sans-serif"
          fontSize="15"
          fontStyle="italic"
          fill="#7C98A2"
          textAnchor="middle"
        >
          Arabian Sea
        </text>

        {/* Incident Marker Pins */}
        <g transform="translate(600 170)">
          <circle r="18" fill="#FF5B2E" stroke="#FFFFFF" strokeWidth="3.5" />
          <path
            d="M5 16v-5l2-5h10l2 5v5M3 16h18M7.5 16v3M16.5 16v3"
            transform="translate(-9 -9) scale(.75)"
            fill="none"
            stroke="#11141A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(760 300)">
          <circle r="18" fill="#F5B700" stroke="#FFFFFF" strokeWidth="3.5" />
          <path
            d="M3 12h4l2-4 4 8 2-4h6"
            transform="translate(-9 -9) scale(.75)"
            fill="none"
            stroke="#11141A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(500 395)">
          <circle r="18" fill="#11141A" stroke="#FFFFFF" strokeWidth="3.5" />
          <path
            d="M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M5.6 5.6l12.8 12.8"
            transform="translate(-9 -9) scale(.75)"
            fill="none"
            stroke="#F3EFE6"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(700 610)">
          <circle r="18" fill="#2B4BFF" stroke="#FFFFFF" strokeWidth="3.5" />
          <path
            d="M3 9c3 2 5-2 9 0s6 2 9 0M3 15c3 2 5-2 9 0s6 2 9 0"
            transform="translate(-9 -9) scale(.75)"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(560 520)">
          <circle r="18" fill="#FF5B2E" stroke="#FFFFFF" strokeWidth="3.5" />
          <path
            d="M5 16v-5l2-5h10l2 5v5M3 16h18M7.5 16v3M16.5 16v3"
            transform="translate(-9 -9) scale(.75)"
            fill="none"
            stroke="#11141A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(440 250)">
          <circle r="18" fill="#F3EFE6" stroke="#FFFFFF" strokeWidth="3.5" />
          <path
            d="M4 10v4h3l8 4V6L7 10zM18 9a4 4 0 0 1 0 6"
            transform="translate(-9 -9) scale(.75)"
            fill="none"
            stroke="#11141A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
