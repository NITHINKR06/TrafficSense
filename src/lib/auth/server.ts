import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { authConfig, authCookieOptions, authFetch } from "./config";
import { canAccessRole, isRole, type Role } from "./rules";

export async function createAuthClient(writableCookies = false) {
  const store = await cookies();
  const config = authConfig();
  if (!config) throw new Error("Authentication is not configured.");
  return createServerClient(config.url, config.key, {
    cookieOptions: authCookieOptions,
    global: { fetch: authFetch },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (updates) => {
        // Read-only Server Components rely on the proxy to refresh cookies.
        if (!writableCookies) return;
        for (const { name, value, options } of updates) store.set(name, value, options);
      },
    },
  });
}

export const getViewer = cache(async () => {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error && error.status !== 400 && error.status !== 401 && error.status !== 403) {
    throw new Error("Authentication service unavailable.");
  }
  if (!data.user) return null;
  const profile = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile.error || !isRole(profile.data?.role)) throw new Error("Account access unavailable.");
  return { id: data.user.id, email: data.user.email, role: profile.data.role, supabase };
});

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireRole(role: Role) {
  const viewer = await requireViewer();
  if (!canAccessRole(viewer.role, role)) redirect("/access-denied");
  return viewer;
}
