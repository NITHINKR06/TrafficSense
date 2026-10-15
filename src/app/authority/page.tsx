import Link from "next/link";
import { requireRole } from "@/lib/auth/server";

export default async function AuthorityPage() {
  await requireRole("authority");
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow m-0">Authority access</p>
        <span className="simulated-pill">CIVIC AUTHORITY</span>
      </div>
      <h1>Read-only authority account</h1>
      <p>Your authority role is verified on the server. Traffic analytics and monthly reports are not implemented yet.</p>
      <p className="notice">No authority-confirmation or incident-editing actions are available.</p>
      <div className="pt-4 border-t border-surface-container-high">
        <Link href="/workspace">← Back to your account</Link>
      </div>
    </section>
  );
}
