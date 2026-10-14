import Link from "next/link";
import { requireRole } from "@/lib/auth/server";

export default async function EmployerPage() {
  const { supabase } = await requireRole("employer");
  const { data, error } = await supabase.from("organisations").select("id,name").order("name");
  if (error) throw new Error("Organisation access is unavailable.");
  return (
    <section className="panel">
      <p className="eyebrow">Employer access</p><h1>Your organisations</h1>
      <p>Only organisations linked to your account appear here. Employee journeys and sharing are not implemented; membership alone never grants location access.</p>
      {data.length ? <ul className="organisation-list">{data.map((org) => <li key={org.id}><Link href={`/employer/${org.id}`}>{org.name}</Link></li>)}</ul> : <p className="notice">No organisation memberships are assigned to this account.</p>}
      <Link href="/workspace">Back to your account</Link>
    </section>
  );
}
