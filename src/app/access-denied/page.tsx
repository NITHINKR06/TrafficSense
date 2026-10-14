import Link from "next/link";

export default function AccessDeniedPage() {
  return <section className="panel narrow"><p className="eyebrow">Access restricted</p><h1>This page is not available to your account</h1><p>Access is determined by the role assigned on the server. Return to your account to see the access available to you.</p><Link className="button" href="/workspace">Return to your account</Link></section>;
}
