"use client";

import Link from "next/link";
import { SignOut } from "@/components/sign-out";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="panel narrow"><p className="eyebrow">Service unavailable</p><h1>Account access could not be loaded</h1><p>The authentication service or account data is unavailable. No private data is shown. Check the local service, then try again.</p><div className="actions"><button className="button" onClick={reset}>Try again</button><Link href="/">Return home</Link></div><div className="section-space"><SignOut /></div></section>;
}
