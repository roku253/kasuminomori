"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { HERO_SLIDES } from "@/lib/hero-slides";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { PickupPills } from "./PickupPills";
import { TopSearch } from "./TopSearch";

const SLIDE_MS = 6000;

export function CinematicHero() {
  const rootRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!rootRef.current || reduced) {
      const curtain = rootRef.current?.querySelector(".hero-curtain");
      if (curtain) gsap.set(curtain, { opacity: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".hero-curtain", { opacity: 1 }, { opacity: 0, duration: 1.1 })
        .fromTo(
          ".hero-slide.is-active .hero-slide-inner",
          { scale: 1.14, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.4 },
          0.15
        )
        .fromTo(".hero-caption", { x: -28, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9 }, 0.35)
        .fromTo(
          ".hero-title",
          { letterSpacing: "0.35em", opacity: 0, y: 24 },
          { letterSpacing: "0.2em", opacity: 1, y: 0, duration: 1 },
          0.5
        )
        .fromTo(".hero-glass", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.65);
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  useLayoutEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [reduced]);

  useLayoutEffect(() => {
    if (!rootRef.current || reduced) return;
    const inner = rootRef.current.querySelector(".hero-slide.is-active .hero-slide-inner");
    if (!inner) return;
    gsap.fromTo(inner, { scale: 1 }, { scale: 1.06, duration: 18, ease: "none", overwrite: true });
  }, [index, reduced]);

  const slide = HERO_SLIDES[index];

  return (
    <section
      ref={rootRef}
      className="relative min-h-[100dvh] overflow-hidden text-white"
      aria-label="メインビジュアル"
    >
      <div className="hero-curtain pointer-events-none absolute inset-0 z-30 bg-[#050a12]" style={reduced ? { opacity: 0 } : undefined} />
      {HERO_SLIDES.map((s, i) => (
        <div
          key={s.src}
          className={`hero-slide absolute inset-0 transition-opacity duration-[1200ms] ${
            i === index ? "is-active opacity-100" : "opacity-0"
          }`}
        >
          <div className="hero-slide-inner absolute inset-0 origin-center">
            <Image src={s.src} alt="" fill priority={i === 0} className="object-cover" sizes="100vw" />
          </div>
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#001428]/80 via-[#001428]/30 to-black/20" />
      <div className="relative z-10 flex min-h-[100dvh] flex-col px-4 pb-12 pt-4 md:px-8">
        <header className="city-top-header flex flex-wrap items-start gap-3">
          <SiteLogo variant="hero" />
          <div className="hero-glass ml-auto w-full max-w-xs md:max-w-sm">
            <TopSearch />
          </div>
          <MegaMenu embeddedInHero />
        </header>
        <div className="hero-glass mt-4 max-w-lg">
          <PickupPills />
        </div>
        <p
          className="hero-caption mt-auto max-h-[50vh] pb-6 pl-2 font-[family-name:var(--font-display)] text-xl font-bold tracking-widest md:text-3xl"
          style={{ writingMode: "vertical-rl" }}
          aria-live="polite"
        >
          {slide.title}
        </p>
        <h1
          id="city-main"
          className="hero-title pointer-events-none absolute left-1/2 top-[46%] w-[90%] max-w-none -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-[family-name:var(--font-display)] text-4xl font-black tracking-[0.2em] md:text-7xl lg:text-8xl"
        >
          霞ノ杜町
        </h1>
      </div>
    </section>
  );
}
