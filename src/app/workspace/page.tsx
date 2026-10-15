import Link from "next/link";
import { requireViewer } from "@/lib/auth/server";
import { SignOut } from "@/components/sign-out";

export default async function WorkspacePage() {
  const viewer = await requireViewer();
  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow m-0">Your account</p>
        <span className="simulated-pill">ROLE: {viewer.role.toUpperCase()}</span>
      </div>
      <h1>Account workspace</h1>
      <p className="account-email">Signed in as <strong>{viewer.email}</strong></p>
      <dl className="facts">
        <div>
          <dt>Assigned role</dt>
          <dd>{viewer.role}</dd>
        </div>
        <div>
          <dt>Location sharing</dt>
          <dd>Off · no collection implemented</dd>
        </div>
      </dl>
      {process.env.DEMO_MODE === "true" && (
        <p className="notice">SIMULATED demo accounts. Authentication and access checks use the local Supabase service.</p>
      )}
      <h2>Available access</h2>
      {viewer.role === "commuter" && (
        <p>Your commuter account is ready. Traffic reporting, maps, and journeys are not implemented yet.</p>
      )}
      {viewer.role === "employer" && (
        <Link className="button" href="/employer">View your organisations</Link>
      )}
      {viewer.role === "authority" && (
        <Link className="button" href="/authority">Open authority access</Link>
      )}
      {viewer.role === "admin" && (
        <Link className="button" href="/admin">Open admin access</Link>
      )}
      <div className="section-space">
        <SignOut />
      </div>
    </section>
  );
}
