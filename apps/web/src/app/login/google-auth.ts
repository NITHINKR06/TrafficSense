"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/auth/server";

type GoogleState = { error?: string };

// Starts Supabase Google OAuth and sends the browser to Google.
// Needs: Google provider enabled in Supabase, and a /auth/callback route
// that exchanges the returned code for a session.
export async function signInWithGoogle(_prev: GoogleState, _formData: FormData): Promise<GoogleState> {
  const supabase = await createAuthClient();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${proto}://${host}/auth/callback` },
  });

  if (error || !data?.url) {
    return { error: "Google sign-in isn't available right now. Please use email instead." };
  }

  redirect(data.url);
}
