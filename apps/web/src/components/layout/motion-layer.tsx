"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    gsap?: {
      registerPlugin: (plugin: unknown) => void;
      timeline: (opts?: Record<string, unknown>) => {
        fromTo: (t: unknown, f: Record<string, unknown>, to: Record<string, unknown>) => ReturnType<NonNullable<Window["gsap"]>["timeline"]>;
        to: (t: unknown, to: Record<string, unknown>) => ReturnType<NonNullable<Window["gsap"]>["timeline"]>;
      };
      to: (t: unknown, to: Record<string, unknown>) => void;
      fromTo: (t: unknown, f: Record<string, unknown>, to: Record<string, unknown>) => void;
    };
    DrawSVGPlugin?: unknown;
  }
}

const animatedSvgs = new WeakSet<SVGSVGElement>();

function initTrafficSenseMotion() {
  const gsap = window.gsap;
  if (!gsap) return false;
  if (window.DrawSVGPlugin) {
    gsap.registerPlugin(window.DrawSVGPlugin);
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

  const SEL = "path,line,circle,rect,polyline";
  document.querySelectorAll<SVGSVGElement>('svg[fill="none"][viewBox="0 0 24 24"]').forEach((svg) => {
    if (animatedSvgs.has(svg)) return;
    const w = parseFloat(svg.getAttribute("width") || "0");
    if (!w || w > 64) return;
    const parts = svg.querySelectorAll(SEL);
    if (!parts.length) return;

    animatedSvgs.add(svg);
    const disc = svg.parentElement;
    const isLogo =
      disc?.tagName === "SPAN" &&
      disc.classList.contains("ts-brand-disc") &&
      Boolean(svg.querySelector('path[d^="M3 12h4"]'));

    if (isLogo && disc) {
      gsap
        .timeline({ repeat: -1 })
        .fromTo(parts, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.9, ease: "power2.inOut" })
        .to(parts, { duration: 1.3 })
        .to(parts, { drawSVG: "100% 100%", duration: 0.9, ease: "power2.inOut" });
      gsap.to(disc, { scale: 1.07, duration: 1.6, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.fromTo(
        disc,
        { boxShadow: "0 0 0 0 rgba(255,91,46,.45)" },
        { boxShadow: "0 0 0 14px rgba(255,91,46,0)", duration: 1.6, ease: "power1.out", repeat: -1, repeatDelay: 1.6 }
      );
      return;
    }

    gsap.fromTo(parts, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1, ease: "power2.inOut", stagger: 0.04, delay: 0.15 });
    const host = svg.closest("a,button");
    if (!host) return;
    const over = () => {
      gsap.to(svg, { scale: 1.14, rotation: -6, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      gsap.fromTo(parts, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.8, ease: "power2.inOut", overwrite: true });
    };
    const out = () => {
      gsap.to(svg, { scale: 1, rotation: 0, duration: 0.5, ease: "power3.inOut", overwrite: "auto" });
    };
    host.addEventListener("mouseenter", over);
    host.addEventListener("mouseleave", out);
    host.addEventListener("focus", over);
    host.addEventListener("blur", out);
  });
  return true;
}

export function MotionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryRun = () => {
      const done = initTrafficSenseMotion();
      if (!done && attempts < 12) {
        attempts += 1;
        timer = setTimeout(tryRun, 150);
      }
    };

    // Defer slightly so streamed Suspense boundaries finish hydrating before GSAP mutates SVG stroke styles
    timer = setTimeout(tryRun, 120);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
