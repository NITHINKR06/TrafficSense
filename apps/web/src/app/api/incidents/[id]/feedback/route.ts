import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authConfig, authCookieOptions, authFetch } from "@/lib/auth/config";
import { createAuthClient } from "@/lib/auth/server";
import { submitIncidentFeedback } from "@/lib/incidents/server";

async function getSupabase(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (authorization) {
    const config = authConfig();
    if (!config) throw new Error("Authentication is not configured.");
    return createServerClient(config.url, config.key, {
      cookieOptions: authCookieOptions,
      global: {
        headers: { Authorization: authorization },
        fetch: authFetch,
      },
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    });
  }
  return createAuthClient(true);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabase(req);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.is_anonymous) {
      return NextResponse.json(
        { ok: false, error: "Sign in with a commuter account to confirm or clear incidents." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const vote = body?.vote;
    if (vote !== "confirm" && vote !== "clear") {
      return NextResponse.json(
        { ok: false, error: "Invalid feedback vote. Expected 'confirm' or 'clear'." },
        { status: 400 }
      );
    }

    const result = await submitIncidentFeedback(supabase, id, vote);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit incident feedback";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
