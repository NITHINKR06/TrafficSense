import Link from "next/link";

export default function Home() {
  return (
    <section className="hero">
      <p className="eyebrow">TrafficSense · development preview</p>
      <h1>Understand the disruption.<br />Share only what you choose.</h1>
      <p className="intro">A traffic project built around reporting, evidence, relevant alerts, and analysis. Explore the public preview without signing in; use an account only when you need account-based features.</p>
      <div className="actions"><Link className="button" href="/demo">Continue as guest</Link><Link className="button secondary" href="/login">Sign in — optional</Link><Link className="button secondary" href="/register">Create an account</Link></div>
      <div className="panel section-space">
        <h2>What is ready</h2>
        <p>A public guest preview and optional accounts are available. Account and organisation access remain protected by server-enforced roles and membership checks.</p>
        <h2>What is still planned</h2>
        <p>Traffic maps, incident reports, evidence verification, route alerts, consent-based employer sharing, and analytics. This preview does not show live traffic or collect your location.</p>
      </div>
    </section>
  );
}
