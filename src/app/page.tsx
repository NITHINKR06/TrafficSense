import Link from "next/link";

export default function Home() {
  return (
    <section className="hero">
      <p className="eyebrow">TrafficSense · development preview</p>
      <h1>Understand the disruption.<br />Share only what you choose.</h1>
      <p className="intro">A traffic project built around reporting, evidence, relevant alerts, and analysis. We are starting with accounts and controlled access.</p>
      <div className="actions"><Link className="button" href="/login">Sign in</Link><Link className="button secondary" href="/register">Create an account</Link></div>
      <div className="panel section-space">
        <h2>What is ready</h2>
        <p>Account registration, sign-in, and server-enforced roles are the first foundation. Organisation access is restricted to assigned members.</p>
        <h2>What is still planned</h2>
        <p>Traffic maps, incident reports, evidence verification, route alerts, consent-based employer sharing, and analytics. This preview does not show live traffic or collect your location.</p>
      </div>
    </section>
  );
}
