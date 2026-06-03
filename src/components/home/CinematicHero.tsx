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

const SLIDE_MS = 8000;

export function CinematicHero() {
  const rootRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!rootRef.current || reduced) {
      const curtain = rootRef.current?.querySelector(".hero-curtain");
      if (curtain) gsap.set(curtain, { opacity: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".hero-curtain", { opacity: 1 }, { opacity: 0, duration: 1 })
        .fromTo(
          ".hero-slide.is-active .hero-slide-inner",
          { scale: 1.08, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2 },
          0.12
        )
        .fromTo(".hero-caption", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7 }, 0.35)
        .fromTo(".hero-title", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, 0.45)
        .fromTo(".hero-glass", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.55);
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  useLayoutEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [reduced, paused]);

  useLayoutEffect(() => {
    if (!rootRef.current || reduced) return;
    const inner = rootRef.current.querySelector(".hero-slide.is-active .hero-slide-inner");
    if (!inner) return;
    gsap.fromTo(inner, { scale: 1 }, { scale: 1.04, duration: 20, ease: "none", overwrite: true });
  }, [index, reduced]);

  const slide = HERO_SLIDES[index];

  return (
    <section
      ref={rootRef}
      className="relative min-h-[min(100dvh,920px)] overflow-hidden text-white"
      aria-label="メインビジュアル"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <a
        href="#top-news"
        className="city-skip absolute -left-[9999px] z-[40] bg-white px-3 py-2 text-sm font-medium text-[var(--kasumi-blue)] focus:left-3 focus:top-3 focus:rounded"
      >
        お知らせへスキップ
      </a>
      <div className="hero-curtain pointer-events-none absolute inset-0 z-30 bg-[#050a12]" style={reduced ? { opacity: 0 } : undefined} />
      {HERO_SLIDES.map((s, i) => (
        <div
          key={s.src}
          className={`hero-slide absolute inset-0 transition-opacity duration-1000 ${
            i === index ? "is-active opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <div className="hero-slide-inner absolute inset-0 origin-center">
            <Image
              src={s.src}
              alt={i === index ? s.alt : ""}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[#001428]/70 via-[#001428]/35 to-[#0a0f14]/90" />
      <div className="relative z-10 mx-auto flex min-h-[min(100dvh,920px)] max-w-6xl flex-col px-4 pb-8 pt-4 md:px-8 md:pb-10">
        <header className="flex flex-wrap items-start gap-3">
          <SiteLogo variant="hero" />
          <div className="hero-glass ml-auto w-full max-w-sm">
            <TopSearch />
          </div>
          <MegaMenu embeddedInHero />
        </header>
        <div className="hero-glass mt-5 max-w-xl">
          <PickupPills />
        </div>
        <div className="mt-auto flex flex-col gap-6 pb-4 md:flex-row md:items-end md:justify-between">
          <p className="hero-caption m-0 font-[family-name:var(--font-display)] text-2xl font-bold tracking-wide md:text-3xl" aria-live="polite">
            {slide.title}
          </p>
          <div className="flex gap-2" role="tablist" aria-label="スライド選択">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.title}
                className={`h-2 w-8 rounded-full border-0 transition ${
                  i === index ? "bg-white" : "bg-white/35 hover:bg-white/55"
                }`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </div>
        <h1
          id="city-main"
          className="hero-title pointer-events-none absolute left-1/2 top-[42%] w-[92%] -translate-x-1/2 -translate-y-1/2 text-center font-[family-name:var(--font-display)] text-4xl font-black tracking-[0.18em] md:text-6xl lg:text-7xl"
        >
          霞ノ杜町
        </h1>
      </div>
    </section>
  );
}
