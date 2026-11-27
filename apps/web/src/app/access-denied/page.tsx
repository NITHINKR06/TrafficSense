import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="max-w-xl mx-auto py-8">
      <section className="rounded-[40px] bg-white border border-[#EEE9DC] p-8 lg:p-10 shadow-[0_18px_40px_rgba(17,20,26,0.08)] space-y-5">
        <div className="flex items-center justify-between gap-2">
          <span className="h-[28px] px-3 rounded-full bg-[#FF5B2E] text-[#11141A] inline-flex items-center font-mono text-[11px] font-semibold tracking-[0.08em]">
            ACCESS RESTRICTED
          </span>
          <span className="simulated-pill">SERVER ENFORCED</span>
        </div>
        <h1 className="font-display font-bold text-3xl lg:text-5xl leading-[0.98] tracking-[-0.04em] m-0 text-[#11141A]">
          This page is not available to your account<span className="text-[#FF5B2E]">.</span>
        </h1>
        <p className="text-sm lg:text-base text-[#4A505C] m-0">
          Access is determined by the role assigned on the server. Return to your account to see the views available to
          you.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link className="ts-btn-ink" href="/workspace" prefetch={false}>
            Return to your account
          </Link>
          <Link className="ts-btn-ghost" href="/traffic">
            Live map
          </Link>
        </div>
      </section>
    </div>
  );
}
