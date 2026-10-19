import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authorityUpdateIncident, submitIncidentReport, getActiveLiveIncidents, type SubmitIncidentInput } from "@/lib/incidents/server";
import type { ReportCategory } from "@/lib/reports/rules";

async function getSupabase() {
  const cookieStore = await cookies();
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY!;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}

export async function GET() {
  try {
    const supabase = await getSupabase();
    const incidents = await getActiveLiveIncidents(supabase);
    return NextResponse.json({ ok: true, incidents });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch incidents";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();

    // Ensure session (sign in anonymously if not signed in)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        return NextResponse.json(
          { ok: false, error: "Anonymous guest session required to submit reports." },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const { category, lat, lng, gps_accuracy_m, gps_fix_at, note } = body;

    if (!category || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: category, lat, lng" },
        { status: 400 }
      );
    }

    const input: SubmitIncidentInput = {
      category: category as ReportCategory,
      lat,
      lng,
      gps_accuracy_m: typeof gps_accuracy_m === "number" ? gps_accuracy_m : null,
      gps_fix_at: typeof gps_fix_at === "string" ? gps_fix_at : null,
      note: typeof note === "string" ? note.slice(0, 300) : null,
    };

    const result = await submitIncidentReport(supabase, input);

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const incidentId = body?.incident_id;
    const action = body?.action;
    if (
      typeof incidentId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(incidentId) ||
      (action !== "confirm" && action !== "resolve")
    ) {
      return NextResponse.json({ ok: false, error: "A valid incident and review action are required." }, { status: 400 });
    }

    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.is_anonymous) {
      return NextResponse.json({ ok: false, error: "Authority sign-in is required." }, { status: 401 });
    }

    const result = await authorityUpdateIncident(supabase, incidentId, action);
    return NextResponse.json(result, { status: result.ok ? 200 : 403 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not update this incident." }, { status: 500 });
  }
}
