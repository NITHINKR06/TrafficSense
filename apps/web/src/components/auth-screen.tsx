import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";
import { StylisedCityMap } from "@/components/map/stylised-city-map";
import { authConfig } from "@/lib/auth/config";
import { getViewer } from "@/lib/auth/server";

const REGISTER_PERKS = [
  "Report problems under your own account",
  "Save your regular routes",
  "Get alerts only when you'd save 5+ min",
];

const LOGIN_PERKS = [
  "Pick up your saved routes",
  "See the tools your role unlocks",
  "Keep your reports in one place",
];

const STATS = [
  { value: "6", label: "TRUST LEVELS" },
  { value: "5+", label: "MIN PER ALERT" },
  { value: "0", label: "PHOTOS KEPT" },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="#11141A"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

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
      <div className="min-h-dvh flex items-center justify-center px-4 pt-24 pb-12 bg-[#F3EFE6]">
        <section className="max-w-lg w-full rounded-[40px] bg-[#11141A] text-[#F3EFE6] p-8 lg:p-10 space-y-4">
          <span className="h-[28px] px-3 rounded-full bg-[#D5F75A] text-[#11141A] inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em]">
            SETUP REQUIRED
          </span>
          <h1 className="font-display font-bold text-4xl lg:text-5xl leading-[0.95] tracking-[-0.04em] m-0">
            Sign-in isn&apos;t
            <br />
            set up yet<span className="text-[#FF5B2E]">.</span>
          </h1>
          <p className="text-[15px] text-[#B9BDC6] leading-relaxed m-0 font-medium">
            Authentication isn&apos;t configured. Connect the local Supabase project by following the development
            instructions, then restart the app. Until then, sign-in stays off, but you can still look around as a
            guest.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/demo"
              className="h-12 px-6 rounded-full bg-[#FF5B2E] text-[#11141A] inline-flex items-center font-bold no-underline"
            >
              Continue as guest
            </Link>
            <Link
              href="/"
              className="h-12 px-6 rounded-full bg-[#F3EFE6] text-[#11141A] inline-flex items-center font-bold no-underline"
            >
              Return home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (await getViewer()) redirect("/workspace");

  const perks = registration ? REGISTER_PERKS : LOGIN_PERKS;

  return (
    <div className="relative min-h-dvh w-full bg-[#0D1822] overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0D1822]">
        <StylisedCityMap />
      </div>

      <div className="relative z-10 max-w-[1384px] mx-auto px-4 lg:px-7 pt-[104px] lg:pt-[132px] pb-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_520px] gap-4 lg:gap-6 items-start">
        {/* Left: hero + bento */}
        <div className="flex flex-col gap-4 order-2 lg:order-1">
          <div className="rounded-[36px] lg:rounded-[44px] bg-[#F3EFE6]/90 backdrop-blur-2xl border border-white/80 shadow-[0_24px_60px_rgba(17,20,26,0.2)] p-7 lg:p-10">
            <span className="h-[30px] px-3 rounded-full bg-[#11141A] text-[#D5F75A] inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.08em]">
              <span className="w-[7px] h-[7px] rounded-full bg-[#FF5B2E]" />
              {registration ? "NEW ACCOUNT · MANGALURU" : "ACCOUNT ACCESS · MANGALURU"}
            </span>

            <h1 className="mt-5 mb-0 font-display font-bold text-5xl sm:text-7xl lg:text-[88px] leading-[0.9] tracking-[-0.05em] text-[#11141A]">
              {registration ? (
                <>
                  Join the
                  <br />
                  road
                </>
              ) : (
                <>
                  Welcome
                  <br />
                  back
                </>
              )}
              <span className="text-[#FF5B2E]">.</span>
            </h1>

            <p className="mt-6 mb-0 max-w-[480px] text-base lg:text-[18px] leading-snug font-medium text-[#4A505C]">
              {registration
                ? "Every account starts as a commuter. Employer and authority access is granted separately by the server, never at sign-up."
                : "Sign in to pick up where you left off. You'll see the tools your account has been given."}
            </p>

            <ul className="mt-7 mb-0 p-0 list-none flex flex-col gap-3">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-base lg:text-[17px] font-semibold text-[#11141A]">
                  <span className="w-7 h-7 rounded-full bg-[#D5F75A] inline-flex items-center justify-center flex-none">
                    <CheckIcon />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>

            <div className="mt-8 grid grid-cols-3 border-t border-[#11141A]/15 pt-5 gap-4">
              {STATS.map((s, i) => (
                <div key={s.label} className={i > 0 ? "border-l border-[#11141A]/15 pl-5" : ""}>
                  <div className="font-display font-bold text-4xl lg:text-[44px] leading-none tracking-[-0.04em]">
                    {s.value}
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.08em] text-[#4A505C]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-[32px] lg:rounded-[40px] bg-[#FF5B2E] p-7 flex flex-col justify-between min-h-[190px]">
              <span className="w-14 h-14 rounded-full bg-[#11141A] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="none"
                  stroke="#F3EFE6"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7" />
                </svg>
              </span>
              <div className="mt-5 font-display font-bold text-[26px] leading-none tracking-[-0.03em] text-[#11141A]">
                Photos are checked,
                <br />
                then discarded.
              </div>
            </div>

            <div className="rounded-[32px] lg:rounded-[40px] bg-[#11141A] text-[#F3EFE6] p-7 flex flex-col justify-between min-h-[190px]">
              <span className="w-14 h-14 rounded-full bg-[#1B2029] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="none"
                  stroke="#D5F75A"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
                </svg>
              </span>
              <div className="mt-5 font-display font-bold text-[26px] leading-none tracking-[-0.03em]">
                No background
                <br />
                tracking<span className="text-[#D5F75A]">.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: form card */}
        <section className="order-1 lg:order-2 rounded-[36px] lg:rounded-[44px] bg-white border border-[#EEE9DC] shadow-[0_24px_60px_rgba(17,20,26,0.22)] p-7 lg:p-10 flex flex-col gap-7">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#4A505C]">
              {registration ? "CREATE ACCOUNT" : "SIGN IN"}
            </span>
            <span className="simulated-pill">DEMO AUTH</span>
          </div>

          <h2 className="m-0 font-display font-bold text-3xl lg:text-[40px] leading-[0.95] tracking-[-0.04em] text-[#11141A]">
            {registration ? "Start as a commuter" : "Good to see you"}
            <span className="text-[#FF5B2E]">.</span>
          </h2>

          {!registration && revocationUnconfirmed && (
            <p className="notice text-xs m-0" role="status">
              You&apos;re signed out in this browser, but we couldn&apos;t confirm the session was closed on the
              server. Any tokens copied earlier may still work.
            </p>
          )}

          <AuthForm mode={mode} />

          <div className="pt-7 border-t border-[#11141A]/10 flex flex-col gap-4">
            <p className="m-0 text-sm text-[#4A505C]">
              {registration ? "Already have an account? " : "New here? "}
              <Link href={registration ? "/login" : "/register"} className="font-bold text-[#11141A] underline">
                {registration ? "Sign in" : "Create a commuter account"}
              </Link>
            </p>
            <Link
              href="/demo"
              className="h-12 px-5 rounded-full bg-[#11141A] text-[#F3EFE6] inline-flex items-center justify-between gap-3 w-full font-bold text-[15px] no-underline hover:bg-[#2A303C]"
            >
              <span>Just looking? Try as guest</span>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="h-8 px-3 rounded-full border-[1.5px] border-[#11141A] inline-flex items-center font-mono text-[10px] font-semibold tracking-[0.08em] text-[#11141A]">
              SIMULATED DATA
            </span>
            <span className="h-8 px-3 rounded-full bg-[#F3EFE6] inline-flex items-center text-xs font-semibold text-[#11141A]">
              Not an official service
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}