import Link from "next/link";

export default function NotFound() {
  return <section className="panel narrow"><p className="eyebrow">404</p><h1>Page not found</h1><p>This page does not exist or is not available to your account.</p><Link href="/workspace">Return to your account</Link></section>;
}
