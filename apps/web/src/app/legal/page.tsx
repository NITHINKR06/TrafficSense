import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="w-full max-w-[1040px] mx-auto space-y-6 pb-8 text-[#11141A]">
      <header className="space-y-3">
        <span className="h-[28px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.08em]">
          PRIVACY &amp; TERMS
        </span>
        <h1 className="font-display font-bold text-4xl sm:text-6xl leading-[0.95] tracking-[-0.04em] m-0">
          Privacy Policy &amp; Terms<span className="text-[#FF5B2E]">.</span>
        </h1>
        <p className="text-sm sm:text-base text-[#4A505C] m-0 max-w-2xl">
          How TrafficSense Mangaluru handles location, photos, accounts, and what this civic demonstration provides.
        </p>
      </header>

      <section
        id="privacy"
        className="scroll-mt-24 rounded-[36px] bg-white border border-[#EEE9DC] p-7 sm:p-9 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-[-0.02em] m-0">
            Privacy Policy
          </h2>
          <span className="font-mono text-[10px] font-semibold tracking-[0.08em] px-2.5 py-1 rounded-full bg-[#EFF9C4] text-[#11141A]">
            PRIVACY BY ARCHITECTURE
          </span>
        </div>
        <ul className="m-0 pl-5 space-y-2.5 text-sm text-[#4A505C] leading-relaxed">
          <li>
            <strong className="text-[#11141A]">No background GPS tracking:</strong> Your location is only read when you explicitly choose a start point or drop a report pin.
          </li>
          <li>
            <strong className="text-[#11141A]">No public reporter identity:</strong> Public incident feeds and maps never expose email addresses, user IDs, or personal details.
          </li>
          <li>
            <strong className="text-[#11141A]">Photo evidence handling:</strong> Uploaded photos are checked for road-hazard relevance (L5 verification) and never tied to your public identity.
          </li>
          <li>
            <strong className="text-[#11141A]">Consent-based employer sharing:</strong> Organisation visibility is strictly opt-in per journey and stops immediately when ended or revoked.
          </li>
        </ul>
      </section>

      <section
        id="terms"
        className="scroll-mt-24 rounded-[36px] bg-white border border-[#EEE9DC] p-7 sm:p-9 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-[-0.02em] m-0">
            Terms &amp; Conditions
          </h2>
          <span className="font-mono text-[10px] font-semibold tracking-[0.08em] px-2.5 py-1 rounded-full bg-[#F3EFE6] text-[#4A505C]">
            PROTOTYPE NOTICE
          </span>
        </div>
        <ul className="m-0 pl-5 space-y-2.5 text-sm text-[#4A505C] leading-relaxed">
          <li>
            <strong className="text-[#11141A]">Not an official emergency or traffic service:</strong> TrafficSense Mangaluru is a civic demonstration prototype. Always follow official traffic police signage and emergency instructions.
          </li>
          <li>
            <strong className="text-[#11141A]">Simulated vs. real data:</strong> Corridor speeds, historical baselines, and delay hours marked <em>SIMULATED</em> are synthetic fixtures; community incident reports and OpenStreetMap/OSRM routes are live estimates.
          </li>
          <li>
            <strong className="text-[#11141A]">Responsible reporting:</strong> Submit accurate road-condition reports only. False or abusive submissions may be rejected by civic authorities.
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/about" className="ts-btn-ink">
          Read Trust &amp; Provenance →
        </Link>
        <Link href="/traffic" className="ts-btn-ghost">
          Open Live Map
        </Link>
      </div>
    </div>
  );
}
