import Link from "next/link";
import { CorridorPreview } from "@/components/corridor-preview";
import { FeatureIcon } from "@/components/feature-icon";

export default function Home() {
  return (
    <div className="landing">
      <section className="landing-hero" aria-labelledby="hero-title">
        <div>
          <p className="simulated-pill">Synthetic demonstration · in development</p>
          <h1 id="hero-title">Understand the disruption.<br /><span>Share only what you choose.</span></h1>
          <p className="intro">A traffic project for Mangaluru, built around reporting, evidence, relevant alerts and analysis. Explore without signing in. Use an account only when you need private account features.</p>
          <div className="actions">
            <Link className="button" href="/demo">Continue as guest <span aria-hidden="true">→</span></Link>
            <Link className="button secondary" href="/login">Sign in — optional</Link>
          </div>
          <p className="hero-note">Public preview · No location collection · No live traffic</p>
        </div>
        <CorridorPreview />
      </section>

      <section className="landing-section" aria-labelledby="features-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Report → Verify → Alert → Analyse</p>
            <h2 id="features-title">Traffic information, with its limits in view</h2>
          </div>
          <p>Accounts and protected organisation access work today. The traffic features below are planned, not available services.</p>
        </div>
        <div className="cards-grid">
          <article className="value-card" data-feature="evidence">
            <div className="card-icon teal"><FeatureIcon name="evidence" /></div>
            <h3>1. Report and examine evidence</h3>
            <p>Report a disruption, then see which observations support congestion. A reported cause is not a confirmed cause.</p>
            <div className="feature-detail">
              <p className="detail-label">Planned evidence indicators</p>
              <ul className="evidence-list">
                <li><code>L1</code> Reported</li>
                <li><code>L2</code> Location support</li>
                <li><code>L3</code> Multiple sources</li>
                <li><code>L4</code> Slowdown support</li>
              </ul>
            </div>
            <p className="card-note">No confidence percentages. Distinct accounts do not prove independent witnesses.</p>
          </article>
          <article className="value-card" data-feature="alerts">
            <div className="card-icon violet"><FeatureIcon name="route" /></div>
            <h3>2. Find relevant alternatives</h3>
            <p>Compare a fixed alternative only when fresh, comparable evidence supports an alert for your selected route.</p>
            <div className="feature-detail">
              <p className="detail-label">Planned route comparison</p>
              <dl className="preview-facts">
                <div><dt>Traffic inputs</dt><dd>Not connected</dd></div>
                <div><dt>Estimated savings</dt><dd>Unavailable</dd></div>
                <div><dt>Route alerts</dt><dd>Not implemented</dd></div>
              </dl>
            </div>
            <p className="card-note">Synthetic estimates will be labelled. An alternative is not a safety guarantee.</p>
          </article>
          <article className="value-card" data-feature="analytics">
            <div className="card-icon amber"><FeatureIcon name="analysis" /></div>
            <h3>3. Investigate recurring hotspots</h3>
            <p>Explore recurring disruptions and monthly trends from a shared, clearly labelled synthetic history.</p>
            <div className="feature-detail">
              <p className="detail-label">Planned analysis</p>
              <ul className="analysis-list">
                <li>Hotspots and peak periods</li>
                <li>Reported causes, including unknown</li>
                <li>Monthly totals with defined units</li>
              </ul>
            </div>
            <p className="card-note">No statistics are loaded yet. Patterns suggest investigation, not confirmed causes.</p>
          </article>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="roles-title">
        <div className="section-heading">
          <div><p className="eyebrow">Public preview & account access</p><h2 id="roles-title">Choose how to explore</h2></div>
          <p>Guest browsing is open to everyone. Employer and authority pages require the matching server-assigned role.</p>
        </div>
        <div className="cards-grid role-cards">
          <article className="value-card" data-role="commuter">
            <div className="card-icon violet"><FeatureIcon name="commuter" /></div>
            <h3>For commuters</h3>
            <p>Browse the public preview without an account. Reporting, saved journeys and separate sharing controls are planned.</p>
            <Link className="button" href="/demo">Explore the guest preview <span aria-hidden="true">→</span></Link>
          </article>
          <article className="value-card" data-role="employer">
            <div className="card-icon violet"><FeatureIcon name="employer" /></div>
            <h3>For employers</h3>
            <p>View your assigned organisations. Employee travel summaries are planned and will require explicit commuter sharing.</p>
            <Link className="button" href="/employer" prefetch={false}>Open employer access <span aria-hidden="true">→</span></Link>
          </article>
          <article className="value-card" data-role="authority">
            <div className="card-icon violet"><FeatureIcon name="evidence" /></div>
            <h3>For authorities</h3>
            <p>Open the read-only account foundation. Hotspot analytics are planned; no incident confirmation actions are available.</p>
            <Link className="button" href="/authority" prefetch={false}>Open authority access <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>

      <aside className="extension-note" aria-labelledby="extension-title">
        <div><h2 id="extension-title">Delay receipts — planned extension</h2><p>After the core traffic and sharing flows, a receipt could summarize permitted evidence. It would not prove GPS truth or why someone arrived late. No receipts can be issued here.</p></div>
        <Link className="button secondary" href="/register">Create an account</Link>
      </aside>
    </div>
  );
}
