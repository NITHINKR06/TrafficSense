import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient } from "@/lib/auth/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ ok: false, error: "Invalid incident id" }, { status: 400 });
    }

    const supabase = await createAuthClient(false);
    const { data, error } = await supabase
      .from("incidents")
      .select("id, photo_data_url, photo_confidence")
      .eq("id", id)
      .in("status", ["open", "cleared"])
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: "Incident not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      photo_data_url: data.photo_data_url ?? null,
      photo_confidence: data.photo_confidence ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch photo";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
