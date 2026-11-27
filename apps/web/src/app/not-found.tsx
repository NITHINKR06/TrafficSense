import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-8">
      <section className="rounded-[40px] bg-[#11141A] text-[#F3EFE6] p-8 lg:p-12 shadow-[0_24px_60px_rgba(17,20,26,0.2)] space-y-5">
        <span className="font-mono text-xs font-semibold tracking-[0.08em] text-[#FF5B2E]">
          404 · DEAD END
        </span>
        <h1 className="font-display font-bold text-5xl lg:text-7xl leading-[0.95] tracking-[-0.05em] m-0">
          Page not found<span className="text-[#D5F75A]">.</span>
        </h1>
        <p className="text-sm lg:text-base text-[#B9BDC6] m-0">
          This route does not exist or is not available to your account.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link className="ts-btn-primary" href="/traffic">
            Open live map
          </Link>
          <Link
            className="h-[52px] px-6 rounded-full bg-[#1B2029] text-[#F3EFE6] border border-[#2A303C] inline-flex items-center font-semibold text-sm no-underline hover:bg-[#2A303C]"
            href="/"
          >
            Return home
          </Link>
        </div>
      </section>
    </div>
  );
}
