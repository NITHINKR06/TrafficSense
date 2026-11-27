import Link from "next/link";
import { SimulatedBanner } from "@/components/simulated-banner";

export default function GuestDemoPage() {
  return (
    <div className="max-w-[1360px] mx-auto space-y-6 pt-2">
      <SimulatedBanner />

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <span className="h-[34px] px-3.5 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em]">
            <span className="w-2 h-2 rounded-full bg-[#D5F75A]" />
            GUEST · NO SIGN-IN
          </span>

          <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-[88px] leading-[0.88] tracking-[-0.055em] text-[#11141A] m-0">
            Look
            <br />
            around<span className="text-[#FF5B2E]">.</span>
          </h1>

          <p className="text-base text-[#4A505C] max-w-xl m-0 leading-relaxed">
            Browse freely without an account. TrafficSense never requests background geolocation, runs tracking cookies,
            or accesses private data.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link className="ts-btn-primary" href="/traffic">
              Browse live map →
            </Link>
            <Link className="ts-btn-ink" href="/report">
              Submit a traffic report
            </Link>
            <Link className="ts-btn-ghost" href="/about">
              How it works
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3">
          {[
            "No background GPS",
            "No tracking cookies",
            "24-hour guest report visibility",
          ].map((item) => (
            <div
              key={item}
              className="h-[72px] rounded-full bg-white border border-[#EEE9DC] px-4 flex items-center gap-4 shadow-[0_8px_20px_rgba(17,20,26,0.04)]"
            >
              <span className="w-11 h-11 rounded-full bg-[#F3EFE6] flex items-center justify-center text-[#11141A] font-bold shrink-0">
                ✓
              </span>
              <span className="text-base font-semibold text-[#11141A]">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[36px] bg-white border border-[#EEE9DC] p-8 space-y-2">
          <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#FF5B2E]">
            CORRIDOR SIMULATION
          </span>
          <h2 className="font-display text-2xl font-bold m-0 text-[#11141A]">Demonstration features</h2>
          <p className="text-sm text-[#4A505C] m-0 leading-relaxed">
            Explore the Mangaluru test corridor with interactive map visualization, segment status chips, and route alert
            evaluations.
          </p>
        </div>

        <div className="rounded-[36px] bg-white border border-[#EEE9DC] p-8 space-y-2">
          <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#2B4BFF]">
            PRIVACY &amp; ACCOUNTS
          </span>
          <h2 className="font-display text-2xl font-bold m-0 text-[#11141A]">Optional sign-in</h2>
          <p className="text-sm text-[#4A505C] m-0 leading-relaxed">
            Your guest report stays visible for 24 hours. Signing in is optional and only required for role-based
            features (Employer, Authority). See the{" "}
            <Link href="/about#privacy-title" className="font-semibold text-[#11141A] underline">
              Privacy &amp; Verification Policy
            </Link>{" "}
            for complete rules.
          </p>
        </div>
      </div>
    </div>
  );
}
