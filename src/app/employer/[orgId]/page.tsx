import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/server";

export default async function OrganisationPage({ params }: PageProps<"/employer/[orgId]">) {
  const { supabase } = await requireRole("employer");
  const { orgId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orgId)) notFound();
  const { data, error } = await supabase.from("organisations").select("id,name").eq("id", orgId).maybeSingle();
  if (error) throw new Error("Organisation access is unavailable.");
  if (!data) notFound();
  return (
    <section className="panel">
      <p className="eyebrow">Organisation membership</p><h1>{data.name}</h1>
      <p>Your current membership permits access to this organisation. No employee information is available in this foundation.</p>
      <p className="notice">Journey sharing and employer dashboards remain planned. Employees must explicitly choose to share before any travel information can be shown.</p>
      <Link href="/employer">Back to your organisations</Link>
    </section>
  );
}
