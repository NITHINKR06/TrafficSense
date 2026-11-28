import Link from "next/link";
import { getViewer } from "@/lib/auth/server";

const ROLE_LABELS: Record<string, string> = {
  commuter: "Commuter",
  employer: "Employer",
  authority: "Authority",
  admin: "Admin",
};

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams?: Promise<{ need?: string | string[] }>;
}) {
  let viewerRole = "Guest";
  try {
    const viewer = await getViewer();
    if (viewer?.role) {
      viewerRole = ROLE_LABELS[viewer.role] ?? viewer.role;
    }
  } catch {
    viewerRole = "Guest";
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const rawNeed = typeof resolvedParams?.need === "string" ? resolvedParams.need.trim().toLowerCase() : "";
  const requiredRole = ROLE_LABELS[rawNeed] ?? "Authority";

  return (
    <div className="relative w-full min-h-[70dvh] flex flex-col items-center justify-center py-10 px-4 overflow-hidden text-center text-[#11141A]">
      {/* Subtle concentric background rings (DeniedWeb.html) */}
      <svg
        viewBox="0 0 1440 900"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-90"
        aria-hidden="true"
      >
        <circle cx="720" cy="330" r="300" fill="none" stroke="#E3DDCE" strokeWidth="2" />
        <circle cx="720" cy="330" r="220" fill="none" stroke="#E3DDCE" strokeWidth="2" />
      </svg>

      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
        {/* 200px dark lock medallion */}
        <span className="w-36 h-36 sm:w-[200px] sm:h-[200px] rounded-full bg-[#11141A] flex items-center justify-center shadow-[0_22px_50px_rgba(17,20,26,0.28)]">
          <svg
            viewBox="0 0 24 24"
            width="96"
            height="96"
            className="w-16 h-16 sm:w-24 sm:h-24"
            fill="none"
            stroke="#FF5B2E"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3M12 15v2" />
          </svg>
        </span>

        <h1 className="mt-9 mb-0 font-display font-bold text-5xl sm:text-7xl lg:text-[96px] leading-[0.9] tracking-[-0.05em] text-[#11141A]">
          Not for this account<span className="text-[#FF5B2E]">.</span>
        </h1>

        {/* Current role -> Required role comparison pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <span className="h-14 px-6 rounded-full bg-white text-[#11141A] inline-flex items-center gap-2.5 text-base sm:text-[17px] font-semibold shadow-[0_6px_18px_rgba(17,20,26,0.06)]">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="#11141A"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 4a4 4 0 1 0 0 8 4 4 0 1 0 0-8M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>
            You: {viewerRole}
          </span>

          <svg
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="none"
            stroke="#4A505C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>

          <span className="h-14 px-6 rounded-full bg-[#11141A] text-[#F3EFE6] inline-flex items-center gap-2.5 text-base sm:text-[17px] font-semibold shadow-[0_10px_24px_rgba(17,20,26,0.16)]">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
            </svg>
            Needs: {requiredRole}
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/traffic"
            className="h-16 px-10 rounded-full bg-[#FF5B2E] text-[#11141A] inline-flex items-center justify-center text-lg sm:text-[19px] font-bold no-underline shadow-[0_12px_26px_rgba(255,91,46,0.35)] hover:brightness-95 transition"
          >
            Back to the map
          </Link>
          <Link
            href="/workspace"
            prefetch={false}
            className="h-16 px-9 rounded-full bg-white text-[#11141A] inline-flex items-center justify-center text-lg sm:text-[19px] font-bold no-underline shadow-[0_8px_22px_rgba(17,20,26,0.08)] hover:bg-[#FAF7F0] transition"
          >
            My workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
