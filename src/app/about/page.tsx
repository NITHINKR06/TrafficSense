import type { Metadata } from "next";
import Link from "next/link";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "Methodology & Verification Rules · TrafficSense Mangaluru",
  description:
    "Engineering methodology, verification ladder, incident lifecycle, route comparison rules, and privacy assurances for TrafficSense.",
};

export default function AboutPage() {
  return (
    <div className={styles.aboutContainer}>
      <header className={styles.header}>
        <div className="flex items-center gap-2 mb-2">
          <span className="simulated-pill">SYSTEM METHODOLOGY</span>
          <span className="text-xs text-on-surface-variant font-medium">Mangaluru Corridor Demonstration</span>
        </div>
        <h1 className={styles.title}>TrafficSense Methodology & System Rules</h1>
        <p className={styles.lead}>
          TrafficSense replaces ambiguous crowdsourcing with a verifiable, ladder-based evidence framework (L1–L6)
          grounded in statistical discipline, privacy preservation, and explicit uncertainty boundaries.
        </p>
        <div className="actions mt-3">
          <Link className="button" href="/traffic">
            Open Traffic Explorer →
          </Link>
          <Link className="button secondary" href="/">
            Return Home
          </Link>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="ladder-title">
        <h2 id="ladder-title" className={styles.sectionTitle}>
          1. Verification Evidence Ladder (L1–L6)
        </h2>
        <p className={styles.text}>
          Crowdsourced incident reports alone cannot prove road obstruction. TrafficSense structures evidence across six
          rigorous tiers:
        </p>
        <div className={styles.ladderGrid}>
          <div className={styles.ladderCard}>
            <div className={styles.ladderHeader}>
              <span className={styles.ladderBadgeActive}>L1</span>
              <h3>Reported</h3>
            </div>
            <p>
              An unconfirmed user report specifying a category and directed segment. Location is manually chosen by the
              reporter. Does not verify obstruction or cause.
            </p>
            <span className={styles.statusIndicatorActive}>● Active in demonstration</span>
          </div>

          <div className={styles.ladderCard}>
            <div className={styles.ladderHeader}>
              <span className={styles.ladderBadgePending}>L2</span>
              <h3>Location Support</h3>
            </div>
            <p>
              Confirmation that the report origin matches the selected road segment without collecting background GPS traces.
            </p>
            <span className={styles.statusIndicatorPending}>○ Planned specification</span>
          </div>

          <div className={styles.ladderCard}>
            <div className={styles.ladderHeader}>
              <span className={styles.ladderBadgeActive}>L3</span>
              <h3>Multiple Sources</h3>
            </div>
            <p>
              Requires at least three distinct reporting sources within a rolling 15-minute window on the same directed segment.
              Eliminates duplicate or repeat reports from the same device.
            </p>
            <span className={styles.statusIndicatorActive}>● Active in demonstration</span>
          </div>

          <div className={styles.ladderCard}>
            <div className={styles.ladderHeader}>
              <span className={styles.ladderBadgeActive}>L4</span>
              <h3>Slowdown Evidence</h3>
            </div>
            <p>
              Synchronized multi-source speed drop. Requires ≥3 independent sources across 6 consecutive 1-minute intervals (5
              full minutes) with speed &lt;40% of baseline.
            </p>
            <span className={styles.statusIndicatorActive}>● Active in demonstration</span>
          </div>

          <div className={styles.ladderCard}>
            <div className={styles.ladderHeader}>
              <span className={styles.ladderBadgePending}>L5</span>
              <h3>Media Verification</h3>
            </div>
            <p>
              Cryptographically signed, metadata-scrubbed photo/video evidence submitted with consensual spatial/temporal bounds.
            </p>
            <span className={styles.statusIndicatorPending}>○ Planned extension</span>
          </div>

          <div className={styles.ladderCard}>
            <div className={styles.ladderHeader}>
              <span className={styles.ladderBadgePending}>L6</span>
              <h3>Authority Action</h3>
            </div>
            <p>
              Official verification, on-site civic response, or dispatch logged by certified municipal traffic controllers.
            </p>
            <span className={styles.statusIndicatorPending}>○ Planned authority flow</span>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="speed-title">
        <h2 id="speed-title" className={styles.sectionTitle}>
          2. Speed Evidence & Observation Windows
        </h2>
        <ul className={styles.bulletList}>
          <li>
            <strong>Synchronized Cadence:</strong> Speed evaluations require observations at exact 60-second intervals across 5
            complete minutes (6 sample points). Missing samples or off-cadence ticks disqualify a source cohort.
          </li>
          <li>
            <strong>Strict Speed Threshold:</strong> Every speed sample in the qualifying window must fall strictly below 40% of
            the unrounded assumed segment baseline.
          </li>
          <li>
            <strong>Freshness Boundary:</strong> Samples are valid for 20 minutes from observation. Future-dated samples are
            rejected, and expired samples automatically lose evidence support.
          </li>
          <li>
            <strong>Independent Devices:</strong> Synthetic speed sources model independent telemetry streams bound to segment
            geometry, distinct from human user accounts.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="lifecycle-title">
        <h2 id="lifecycle-title" className={styles.sectionTitle}>
          3. Incident Lifecycle & Clearance Protocol
        </h2>
        <ul className={styles.bulletList}>
          <li>
            <strong>Automatic Lifecycle Inception:</strong> Persisted incidents originate when L4 slowdown evidence is sustained
            across the corridor, even in the absence of manual citizen reports.
          </li>
          <li>
            <strong>Verified Clearance:</strong> Recovery requires the same ≥3 sources across adjacent 5-minute slowdown and
            recovery windows, with speeds strictly above 70% of the baseline and no conflicting slowdown cohort.
          </li>
          <li>
            <strong>Reopenings:</strong> If slowdown recurs on the same segment after clearance, a new unique incident identifier is
            created referencing the prior incident lineage.
          </li>
          <li>
            <strong>No Silent Resets:</strong> Simulator resets, lack of fresh observations, or high speed without cohort continuity
            do not record clearance; status changes to unconfirmed or stale.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="routing-title">
        <h2 id="routing-title" className={styles.sectionTitle}>
          4. Route Intelligence & Alternative Route Alerts
        </h2>
        <ul className={styles.bulletList}>
          <li>
            <strong>Fixed Route Pairs:</strong> The system evaluates verified primary corridors against fixed alternative bypass
            routes with predefined baseline travel durations.
          </li>
          <li>
            <strong>300-Second (5-Minute) Advantage Threshold:</strong> An active route alert requires the completed primary duration
            to exceed the alternative by at least 300 seconds (5 minutes).
          </li>
          <li>
            <strong>Mandatory Abstention Rules:</strong> Route alerts abstain (refuse to recommend an alternative) if:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>No current supported incident or slowdown exists on the primary route.</li>
              <li>The time advantage is under 300 seconds.</li>
              <li>A supported slowdown or recent reported hazard exists on the alternative bypass route.</li>
            </ul>
          </li>
          <li>
            <strong>Independent Segment Sums:</strong> Travel durations compare completed segment traversals from retained simulation
            runs; they are not continuous personal journey measurements.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="episodes-title">
        <h2 id="episodes-title" className={styles.sectionTitle}>
          5. Report Grouping, Episodes & Rate Limits
        </h2>
        <ul className={styles.bulletList}>
          <li>
            <strong>Episode Clustering:</strong> Reports group chronologically by segment and direction. A gap of 20 minutes
            without reports seals the episode and begins a new successor episode.
          </li>
          <li>
            <strong>Anti-Spoofing Rate Limits:</strong> Each source is capped at 5 reports per 15 minutes. The global demo ceiling
            is 300 reports per hour, with 2,000 maximum retained reports.
          </li>
          <li>
            <strong>Idempotency:</strong> Re-submitting an identical report reference replays the stored outcome without inflating
            incident counts.
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="privacy-title">
        <h2 id="privacy-title" className={styles.sectionTitle}>
          6. Privacy, Anonymity & Data Ethics
        </h2>
        <ul className={styles.bulletList}>
          <li>
            <strong>Zero Device Tracking:</strong> TrafficSense never requests background geolocation, battery states, device IDs, or
            continuous movement trails.
          </li>
          <li>
            <strong>Ephemeral Guest Reporting:</strong> Guest sessions use temporary, non-identifying tokens stored in local browser
            cookies that expire after 24 hours.
          </li>
          <li>
            <strong>Consensual Employer Sharing:</strong> Commuter travel summaries are accessible to employers only with explicit,
            granular, revocable employee authorization.
          </li>
          <li>
            <strong>Truth in Labelling:</strong> All test corridor information is strictly designated <code>SIMULATED</code>. No
            fabricated confidence percentages or pseudo-probabilistic guarantees are shown.
          </li>
        </ul>
      </section>

      <footer className={styles.footer}>
        <p>TrafficSense Mangaluru · Prototype for verifiable civic traffic intelligence</p>
        <div className="actions mt-2">
          <Link href="/traffic">Back to Traffic Explorer</Link>
          <Link href="/demo">Guest Demo Overview</Link>
          <Link href="/">Home</Link>
        </div>
      </footer>
    </div>
  );
}
