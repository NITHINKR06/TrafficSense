import Link from "next/link";
import { requireRole } from "@/lib/auth/server";

export default async function AuthorityPage() {
  await requireRole("authority");
  return <section className="panel"><p className="eyebrow">Authority access</p><h1>Read-only authority account</h1><p>Your authority role is verified on the server. Traffic analytics and monthly reports are not implemented yet.</p><p className="notice">No authority-confirmation or incident-editing actions are available.</p><Link href="/workspace">Back to your account</Link></section>;
}
