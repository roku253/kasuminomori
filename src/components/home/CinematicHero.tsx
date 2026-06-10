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
    if (!rootRef.current) return;

    const root = rootRef.current;
    const showSlides = () => {
      root.querySelectorAll<HTMLElement>(".hero-slide-inner").forEach((el) => {
        gsap.set(el, { clearProps: "opacity,transform" });
      });
    };

    if (reduced) {
      const curtain = root.querySelector(".hero-curtain");
      if (curtain) gsap.set(curtain, { opacity: 0 });
      showSlides();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(".hero-curtain", { opacity: 1 }, { opacity: 0, duration: 1 })
        .fromTo(
          ".hero-slide.is-active .hero-slide-inner",
          { scale: 1.08 },
          { scale: 1, duration: 1.2 },
          0.12
        )
        .fromTo(".hero-caption", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7 }, 0.35)
        .fromTo(".hero-title", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, 0.45)
        .fromTo(".hero-glass", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.55);
    }, rootRef);
    return () => {
      ctx.revert();
      showSlides();
    };
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
      <div className="hero-curtain pointer-events-none absolute inset-0 z-30 bg-[#050a12]" style={reduced ? { opacity: 0 } : undefined} />
      {HERO_SLIDES.map((s, i) => (
        <div
          key={s.src}
          className={`hero-slide absolute inset-0 z-[1] transition-opacity duration-1000 ${
            i === index ? "is-active opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          <div className="hero-slide-inner relative h-full w-full origin-center">
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#001428]/75 via-[#001428]/40 to-[#0a0f14]/92" />
      <div className="hero-edge-vignette pointer-events-none absolute inset-0 z-[6]" aria-hidden />

      <div className="hero-shell relative z-10 mx-auto grid min-h-[min(100dvh,920px)] max-w-6xl grid-rows-[auto_auto_1fr_auto] gap-y-4 px-4 pb-8 pt-4 md:gap-y-5 md:px-8 md:pb-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <SiteLogo variant="hero" />
          <MegaMenu embeddedInHero />
        </div>

        <div className="hero-ui-layer hero-toolbar">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] md:grid-rows-[auto_1fr] md:items-stretch md:gap-x-6 md:gap-y-3">
            <h2 className="city-eyebrow m-0 text-white/95 md:col-start-1 md:row-start-1">よく使うページ</h2>
            <div className="hero-toolbar-block min-w-0 md:col-start-1 md:row-start-2">
              <PickupPills showLabel={false} />
            </div>
            <div className="hero-glass hero-toolbar-block flex w-full md:col-start-2 md:row-start-2">
              <TopSearch />
            </div>
          </div>
        </div>

        <div className="hero-ui-layer flex min-h-[120px] items-center justify-center px-2 py-2 md:min-h-[160px]">
          <h1
            id="city-main"
            className="hero-title m-0 text-center font-[family-name:var(--font-display)] text-[clamp(1.85rem,8vw,3rem)] font-black leading-tight tracking-[0.14em] md:text-[clamp(2.75rem,5vw,4.25rem)] md:tracking-[0.18em]"
          >
            霞ノ杜町
          </h1>
        </div>

        <div className="hero-ui-layer flex flex-col gap-3 pb-1 md:gap-4">
          <p
            className="hero-caption m-0 max-w-2xl font-[family-name:var(--font-display)] text-lg font-bold tracking-wide sm:text-xl md:text-2xl"
            aria-live="polite"
          >
            {slide.title}
          </p>
          <div className="flex items-center justify-between gap-4">
            <p className="m-0 text-xs text-white/75 md:text-sm">
              スライド {index + 1} / {HERO_SLIDES.length}
              <span className="hidden md:inline"> — {slide.title}</span>
            </p>
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
