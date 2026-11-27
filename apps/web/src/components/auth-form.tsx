"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login, register } from "@/app/auth-actions";
import { signInWithGoogle } from "@/app/login/google-auth";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registration = mode === "register";
  const [state, action, pending] = useActionState(registration ? register : login, {});
  const [googleState, googleAction, googlePending] = useActionState(signInWithGoogle, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [demoAccounts, setDemoAccounts] = useState<
    Array<{ label: string; role: string; email: string; password: string }>
  >([]);

  const busy = pending || googlePending;

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
    <div className="flex flex-col gap-6">
      {/* Google */}
      <form action={googleAction} className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={busy}
          className="w-full h-14 px-6 rounded-full bg-white border border-[#E3DDCE] text-[#11141A] font-bold text-base cursor-pointer inline-flex items-center justify-center gap-3 hover:bg-[#F8F5EE] disabled:opacity-60"
        >
          <GoogleLogo />
          <span>{googlePending ? "Opening Google…" : "Continue with Google"}</span>
        </button>
        {googleState.error && (
          <p className="error m-0" role="alert">
            {googleState.error}
          </p>
        )}
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="flex-1 h-px bg-[#11141A]/10" />
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-[#4A505C]">
          OR WITH EMAIL
        </span>
        <span className="flex-1 h-px bg-[#11141A]/10" />
      </div>

      {/* Email + password */}
      <form ref={formRef} action={action} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4A505C]"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            className="w-full h-14 px-5 rounded-full bg-[#F8F5EE] border border-[#E3DDCE] text-base text-[#11141A] focus:outline-none focus:border-[#11141A]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="block font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4A505C]"
          >
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
            className="w-full h-14 px-5 rounded-full bg-[#F8F5EE] border border-[#E3DDCE] text-base text-[#11141A] focus:outline-none focus:border-[#11141A]"
          />
          {registration && (
            <p id="password-help" className="text-xs text-[#4A505C] leading-relaxed m-0 px-1">
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
          className="w-full h-14 rounded-full bg-[#FF5B2E] text-[#11141A] font-bold text-base border-0 cursor-pointer shadow-[0_10px_24px_rgba(255,91,46,0.3)] disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {pending ? "Please wait…" : registration ? "Create commuter account" : "Sign in"}
        </button>
      </form>

      {/* Demo sign-in: hidden in a closed dropdown, one click to open */}
      {demoAccounts.length > 0 && (
        <details className="group rounded-[28px] bg-[#F8F5EE] border border-[#EEE9DC]">
          <summary className="list-none cursor-pointer h-14 px-5 flex items-center justify-between gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4A505C] [&::-webkit-details-marker]:hidden">
            <span>Demo sign-in</span>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-open:rotate-180"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <div className="px-5 pb-5 flex flex-col gap-3">
            <p className="m-0 text-xs text-[#4A505C] leading-relaxed">
              One click signs you in with a demo account.
            </p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  disabled={busy}
                  onClick={() => quickSignIn(a)}
                  className="h-10 px-4 rounded-full bg-white border border-[#E3DDCE] text-[#11141A] text-[13px] font-semibold hover:bg-[#11141A] hover:text-[#F3EFE6] cursor-pointer disabled:opacity-60"
                  title={`${a.role} · ${a.email}`}
                >
                  {roleTitle(a)}
                </button>
              ))}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}