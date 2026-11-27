import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";
import { StylisedCityMap } from "@/components/map/stylised-city-map";
import { authConfig } from "@/lib/auth/config";
import { getViewer } from "@/lib/auth/server";

export async function AuthScreen({
  mode,
  revocationUnconfirmed = false,
}: {
  mode: "login" | "register";
  revocationUnconfirmed?: boolean;
}) {
  await connection();
  const registration = mode === "register";

  if (!authConfig()) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 pt-24 pb-12">
        <section className="max-w-lg w-full rounded-[40px] bg-white border border-[#EEE9DC] p-8 lg:p-10 shadow-[0_24px_60px_rgba(17,20,26,0.12)] space-y-4">
          <p className="eyebrow m-0">Setup required</p>
          <h1 className="font-display font-bold text-3xl lg:text-4xl m-0">
            Authentication is not configured
          </h1>
          <p className="text-sm text-[#4A505C] m-0">
            Configure the local Supabase connection using the development instructions, then restart the app. Sign-in is
            unavailable until setup is complete.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link className="ts-btn-ink" href="/demo">
              Continue as guest
            </Link>
            <Link className="ts-btn-ghost" href="/">
              Return home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (await getViewer()) redirect("/workspace");

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center px-4 pt-28 pb-16 overflow-hidden">
      <div className="absolute inset-0">
        <StylisedCityMap />
      </div>

      <section className="relative z-10 w-full max-w-[520px] rounded-[40px] bg-[#F3EFE6]/92 backdrop-blur-2xl border border-white/80 p-7 lg:p-10 shadow-[0_24px_60px_rgba(17,20,26,0.22)] space-y-6">
        <div className="flex items-center justify-between gap-2">
          <span className="h-[28px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.08em]">
            ACCOUNT ACCESS
          </span>
          <span className="simulated-pill">DEMO AUTH</span>
        </div>

        <div>
          <h1 className="font-display font-bold text-4xl lg:text-[48px] leading-[0.95] tracking-[-0.04em] m-0 text-[#11141A]">
            {registration ? "Create account" : "Welcome back"}
            <span className="text-[#FF5B2E]">.</span>
          </h1>
          <p className="text-sm text-[#4A505C] mt-2.5 mb-0">
            {registration
              ? "Start with commuter access. Employer and authority permissions are assigned separately on the server."
              : "Sign in to view the access assigned to your account."}
          </p>
        </div>

        {process.env.DEMO_MODE === "true" && (
          <p className="notice text-xs m-0">
            Local demo: use synthetic details only. Email confirmation is disabled for local testing. No location or
            journey data is collected.
          </p>
        )}

        {!registration && revocationUnconfirmed && (
          <p className="notice text-xs m-0" role="status">
            This browser is signed out. Server-side session revocation was not confirmed; previously copied tokens may
            still be usable.
          </p>
        )}

        <AuthForm mode={mode} />

        <div className="pt-2 border-t border-[#11141A]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="m-0 text-[#4A505C]">
            {registration ? "Already have an account? " : "New here? "}
            <Link href={registration ? "/login" : "/register"} className="font-bold text-[#11141A] underline">
              {registration ? "Sign in" : "Create a commuter account"}
            </Link>
          </p>
          <Link href="/demo" className="font-semibold text-[#11141A] hover:underline no-underline">
            Guest preview →
          </Link>
        </div>
      </section>
    </div>
  );
}
