// Specification of L1–L6 verification levels aligned with Traffic JAM brief §4.

export type VerificationLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6";

export type LadderTier = {
  level: VerificationLevel;
  name: string;
  source: string;
  status: "implemented" | "planned";
  achieved: boolean;
  description: string;
};

export const LADDER_SPEC: Record<VerificationLevel, {
  name: string;
  source: string;
  status: "implemented" | "planned";
  description: string;
}> = {
  L1: {
    name: "Reported",
    source: "Citizen Report",
    status: "implemented",
    description: "Initial user report with manually selected category and segment. Unconfirmed cause.",
  },
  L2: {
    name: "Location Support",
    source: "Spatial Match",
    status: "planned",
    description: "Spatial verification that report matches current road segment without GPS tracking.",
  },
  L3: {
    name: "Multiple Sources",
    source: "Corroboration",
    status: "implemented",
    description: "≥3 independent reporting sources within rolling 15-minute window on same segment.",
  },
  L4: {
    name: "Speed Slowdown",
    source: "Telemetry (Simulated)",
    status: "implemented",
    description: "≥3 synchronized sources across 5 minutes with speed <40% of baseline.",
  },
  L5: {
    name: "Photo Evidence",
    source: "Media Upload",
    status: "planned",
    description: "Cryptographically verified, metadata-scrubbed photo/video proof.",
  },
  L6: {
    name: "Authority Action",
    source: "Civic Command",
    status: "planned",
    description: "Official municipal traffic police on-site confirmation or dispatch action.",
  },
};

export function evaluateSegmentLadder(params: {
  hasReport: boolean;
  isMultipleSources: boolean;
  isSlowdownSupported: boolean;
}): {
  currentLevel: VerificationLevel | null;
  currentLabel: string;
  tiers: LadderTier[];
} {
  const l1Achieved = params.hasReport;
  const l2Achieved = false; // Planned specification
  const l3Achieved = params.isMultipleSources;
  const l4Achieved = params.isSlowdownSupported;
  const l5Achieved = false; // Planned extension
  const l6Achieved = false; // Planned authority action

  const tiers: LadderTier[] = [
    { ...LADDER_SPEC.L6, level: "L6", achieved: l6Achieved },
    { ...LADDER_SPEC.L5, level: "L5", achieved: l5Achieved },
    { ...LADDER_SPEC.L4, level: "L4", achieved: l4Achieved },
    { ...LADDER_SPEC.L3, level: "L3", achieved: l3Achieved },
    { ...LADDER_SPEC.L2, level: "L2", achieved: l2Achieved },
    { ...LADDER_SPEC.L1, level: "L1", achieved: l1Achieved },
  ];

  let currentLevel: VerificationLevel | null = null;
  let currentLabel = "Normal baseline flow";

  if (l4Achieved) {
    currentLevel = "L4";
    currentLabel = "L4 Speed Slowdown Supported";
  } else if (l3Achieved) {
    currentLevel = "L3";
    currentLabel = "L3 Multiple Sources Confirmed";
  } else if (l1Achieved) {
    currentLevel = "L1";
    currentLabel = "L1 Reported, Unconfirmed";
  }

  return { currentLevel, currentLabel, tiers };
}
