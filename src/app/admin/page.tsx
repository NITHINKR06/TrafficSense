import Link from "next/link";
import { requireRole } from "@/lib/auth/server";

export default async function AdminPage() {
  await requireRole("admin");
  return <section className="panel"><p className="eyebrow">Admin access</p><h1>Demo administration</h1><p>Your admin role is verified on the server. This role does not grant access to employer organisations or private commuter data.</p><p className="notice">Synthetic account setup is available only through local development tooling. No browser seed, reset, or role-assignment actions are exposed.</p><Link href="/workspace">Back to your account</Link></section>;
}
