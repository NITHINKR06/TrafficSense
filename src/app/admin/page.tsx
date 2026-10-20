import Link from "next/link";
import { requireRole } from "@/lib/auth/server";

export default async function AdminPage() {
  await requireRole("admin");
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow m-0">Admin access</p>
        <span className="simulated-pill">DEMO ADMIN</span>
      </div>
      <h1>Demo administration</h1>
      <p>Your admin role is verified on the server. This role does not grant access to employer organisations or private commuter data.</p>
      <p className="notice">Account administration tools are not available in this build.</p>
      <div className="pt-4 border-t border-surface-container-high">
        <Link href="/workspace">← Back to your account</Link>
      </div>
    </section>
  );
}
