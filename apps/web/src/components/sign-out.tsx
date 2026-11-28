"use client";

import { useActionState } from "react";
import { logout } from "@/app/auth-actions";

export function SignOut({ fullWidth = false }: { fullWidth?: boolean }) {
  const [state, action, pending] = useActionState(logout, {});
  return (
    <form action={action} className={fullWidth ? "w-full" : undefined}>
      <button
        className={
          fullWidth
            ? "mt-2.5 w-full h-14 rounded-full bg-[#1B2029] text-[#F3EFE6] border-0 flex items-center justify-center gap-2.5 text-base font-bold hover:bg-[#2A303C] transition cursor-pointer disabled:opacity-50"
            : "h-11 px-5 rounded-full bg-[#1B2029] text-[#F3EFE6] border border-[#2A303C] text-xs font-semibold hover:bg-[#2A303C] transition cursor-pointer disabled:opacity-50"
        }
        disabled={pending}
        type="submit"
      >
        {fullWidth && (
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />
          </svg>
        )}
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
