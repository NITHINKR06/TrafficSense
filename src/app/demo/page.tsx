import Link from "next/link";

export default function GuestDemoPage() {
  return (
    <section className="hero">
      <p className="eyebrow">Public preview · no sign-in needed</p>
      <h1>Explore TrafficSense as a guest</h1>
      <p className="intro">An account is optional. This public preview does not start a journey, collect your location, or give access to anyone’s private information.</p>
      <div className="panel section-space">
        <h2>Public traffic features — planned</h2>
        <p>Traffic maps, incident details, and relevant route alerts will be available to browse without signing in. These features are not implemented yet; this page does not show live traffic.</p>
        <h2>When an account is useful</h2>
        <p>Sign in for your account and assigned organisation access. Saved journeys and sharing with an employer are planned account-based features; sharing will require your explicit permission.</p>
        <p>You can return to the public preview at any time. Browsing as a guest does not assign an employer, authority, or administrator role.</p>
      </div>
      <div className="actions section-space">
        <Link className="button secondary" href="/login">Sign in — optional</Link>
        <Link className="button secondary" href="/register">Create an account — optional</Link>
        <Link href="/">Return home</Link>
      </div>
    </section>
  );
}
