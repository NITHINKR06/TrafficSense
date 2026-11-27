import Link from "next/link";
import { SimulatedBanner } from "@/components/simulated-banner";

export default function GuestDemoPage() {
  return (
    <div className="space-y-6">
      <SimulatedBanner />

      <section className="rounded-[40px] bg-[#11141A] text-[#F3EFE6] p-8 lg:p-12 shadow-[0_24px_60px_rgba(17,20,26,0.18)]">
        <span className="h-[30px] px-3 rounded-full bg-[#1B2029] text-[#D5F75A] inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em]">
          <span className="w-2 h-2 rounded-full bg-[#FF5B2E]" />
          PUBLIC PREVIEW · NO SIGN-IN REQUIRED
        </span>

        <h1 className="font-display font-bold text-4xl lg:text-[64px] leading-[0.95] tracking-[-0.04em] mt-5 mb-0">
          Explore TrafficSense
          <br />
          as a guest<span className="text-[#FF5B2E]">.</span>
        </h1>
        <p className="text-base lg:text-lg text-[#B9BDC6] mt-4 max-w-2xl mb-0">
          Browse freely without an account. TrafficSense never requests background geolocation, runs tracking cookies,
          or accesses private data.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="ts-btn-primary" href="/traffic">
            Browse live map →
          </Link>
          <Link
            className="h-[52px] px-6 rounded-full bg-[#1B2029] text-[#F3EFE6] border border-[#2A303C] inline-flex items-center font-semibold text-sm no-underline hover:bg-[#2A303C]"
            href="/reports/new"
          >
            Submit a traffic report
          </Link>
          <Link
            className="h-[52px] px-6 rounded-full bg-transparent text-[#D5F75A] border border-[#2A303C] inline-flex items-center font-semibold text-sm no-underline hover:bg-[#1B2029]"
            href="/about"
          >
            How it works
          </Link>
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
