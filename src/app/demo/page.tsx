import Link from "next/link";

export default function GuestDemoPage() {
  return (
    <section className="hero">
      <div className="flex items-center gap-2 mb-2">
        <span className="simulated-pill">
          <span className="pulse-dot"></span>
          Public preview · no sign-in needed
        </span>
      </div>
      <h1>Explore TrafficSense as a guest</h1>
      <p className="intro">
        An account is optional. This public preview does not start a journey, collect your location, or give access to anyone’s private information.
      </p>

      <div className="panel section-space">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
          <h2 className="text-lg font-bold text-on-surface m-0">Public traffic features — planned</h2>
        </div>
        <p className="text-sm mt-2 text-on-surface-variant">
          Traffic maps, incident details, and relevant route alerts will be available to browse without signing in. These features are not implemented yet; this page does not show live traffic.
        </p>

        <div className="pt-4 mt-4 border-t border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
            <h2 className="text-lg font-bold text-on-surface m-0">When an account is useful</h2>
          </div>
          <p className="text-sm mt-2 text-on-surface-variant">
            Sign in for your account and assigned organisation access. Saved journeys and sharing with an employer are planned account-based features; sharing will require your explicit permission.
          </p>
          <p className="text-sm mt-2 text-on-surface-variant">
            You can return to the public preview at any time. Browsing as a guest does not assign an employer, authority, or administrator role.
          </p>
        </div>
      </div>

      <div className="actions section-space">
        <Link className="button secondary" href="/login">Sign in — optional</Link>
        <Link className="button secondary" href="/register">Create an account — optional</Link>
        <Link href="/">Return home</Link>
      </div>
    </section>
  );
}
