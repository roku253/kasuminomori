"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { HERO_SLIDES } from "@/lib/hero-slides";
import { assetPath } from "@/lib/site";
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
              src={assetPath(s.src)}
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
      <div className="hero-edge-vignette pointer-events-none absolute inset-0 z-[6]" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-[min(100dvh,920px)] max-w-6xl flex-col px-4 pb-8 pt-4 md:relative md:px-8 md:pb-10">
        <header className="z-20 grid w-full shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <SiteLogo variant="hero" />
          <MegaMenu embeddedInHero />
          <div className="hero-glass hero-ui-layer col-span-2 w-full max-w-lg justify-self-stretch sm:justify-self-end sm:max-w-sm">
            <TopSearch />
          </div>
        </header>
        <div className="hero-glass hero-pickup-pills hero-ui-layer z-20 mt-4 max-w-xl shrink-0 md:mt-5">
          <PickupPills />
        </div>
        <h1
          id="city-main"
          className="hero-title hero-ui-layer relative z-10 my-6 w-full shrink-0 text-center font-[family-name:var(--font-display)] text-[clamp(1.75rem,9vw,2.75rem)] font-black leading-tight tracking-[0.12em] md:pointer-events-none md:absolute md:left-1/2 md:top-[40%] md:my-0 md:w-[92%] md:max-w-none md:-translate-x-1/2 md:-translate-y-1/2 md:text-[clamp(2.5rem,5vw,4.5rem)] md:tracking-[0.18em] lg:top-[42%]"
        >
          霞ノ杜町
        </h1>
        <div className="hero-ui-layer relative z-20 mt-auto flex shrink-0 flex-col gap-4 pb-2 pt-2 md:gap-6 md:pb-4">
          <p
            className="hero-caption m-0 font-[family-name:var(--font-display)] text-xl font-bold tracking-wide sm:text-2xl md:text-3xl"
            aria-live="polite"
          >
            {slide.title}
          </p>
          <div className="flex items-center justify-between gap-4 md:justify-end">
            <p className="m-0 text-xs text-white/70 md:hidden">スライド {index + 1} / {HERO_SLIDES.length}</p>
            <div className="flex gap-2" role="tablist" aria-label="スライド選択">
              {HERO_SLIDES.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={s.title}
                  className={`h-2.5 min-w-[32px] rounded-full border-0 transition ${
                    i === index ? "bg-white" : "bg-white/35 hover:bg-white/55"
                  }`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
