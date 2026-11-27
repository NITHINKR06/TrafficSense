"use client";

import { useActionState } from "react";
import { logout } from "@/app/auth-actions";

export function SignOut() {
  const [state, action, pending] = useActionState(logout, {});
  return (
    <form action={action}>
      <button
        className="h-11 px-5 rounded-full bg-[#1B2029] text-[#F3EFE6] border border-[#2A303C] text-xs font-semibold hover:bg-[#2A303C] transition cursor-pointer disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {state.error && <p className="notice error" role="alert">{state.error}</p>}
    </form>
  );
}
