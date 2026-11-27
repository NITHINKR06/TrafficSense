"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login, register } from "@/app/auth-actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registration = mode === "register";
  const [state, action, pending] = useActionState(registration ? register : login, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [demoAccounts, setDemoAccounts] = useState<
    Array<{ label: string; role: string; email: string; password: string }>
  >([]);

  useEffect(() => {
    if (registration) return;
    let cancelled = false;
    fetch("/api/demo-accounts", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok && Array.isArray(data.accounts)) setDemoAccounts(data.accounts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [registration]);

  function quickSignIn(account: { email: string; password: string }) {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = account.email;
    (form.elements.namedItem("password") as HTMLInputElement).value = account.password;
    form.requestSubmit();
  }

  const roleTitle = (a: { label: string; role: string }) =>
    a.label.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-5">
      {demoAccounts.length > 0 && (
        <div className="p-4 rounded-[24px] bg-[#F8F5EE] border border-[#EEE9DC] space-y-2.5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#4A505C] m-0">
            Quick Demo Sign-In (1-Click)
          </p>
          <div className="flex flex-wrap gap-2">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                disabled={pending}
                onClick={() => quickSignIn(a)}
                className="h-9 px-3.5 rounded-full bg-white border border-[#E3DDCE] text-[#11141A] text-xs font-semibold hover:bg-[#11141A] hover:text-[#F3EFE6] cursor-pointer transition"
                title={`${a.role} · ${a.email}`}
              >
                {roleTitle(a)}
              </button>
            ))}
          </div>
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4A505C] mb-1.5">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            className="w-full h-12 px-4 rounded-2xl bg-[#F8F5EE] border border-[#E3DDCE] text-sm text-[#11141A] focus:outline-none focus:border-[#11141A]"
          />
        </div>

        <div>
          <label htmlFor="password" className="block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4A505C] mb-1.5">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={registration ? "new-password" : "current-password"}
            minLength={registration ? 12 : 1}
            maxLength={128}
            required
            aria-describedby={registration ? "password-help" : undefined}
            className="w-full h-12 px-4 rounded-2xl bg-[#F8F5EE] border border-[#E3DDCE] text-sm text-[#11141A] focus:outline-none focus:border-[#11141A]"
          />
          {registration && (
            <p id="password-help" className="text-xs text-[#4A505C] mt-1.5 mb-0">
              Use 12–128 characters. New accounts receive commuter access only.
            </p>
          )}
        </div>

        {state.error && (
          <p className="error m-0" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="notice m-0" role="status">
            {state.message}
          </p>
        )}

        <button
          className="w-full h-14 rounded-full bg-[#FF5B2E] text-[#11141A] font-bold text-base border-0 cursor-pointer shadow-[0_10px_24px_rgba(255,91,46,0.3)] hover:-translate-y-0.5 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Please wait…" : registration ? "Create commuter account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
