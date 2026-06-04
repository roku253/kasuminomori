"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { assetPath } from "@/lib/site";
import { SiteLogo } from "./SiteLogo";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

const PHOTOS = {
  large: { src: "/img/placeholders/instagram-01.svg", alt: "町民祭" },
  small: [
    { src: "/img/placeholders/instagram-02.svg", alt: "春の霧" },
    { src: "/img/placeholders/instagram-03.svg", alt: "吊り橋" },
    { src: "/img/placeholders/instagram-04.svg", alt: "神社" },
    { src: "/img/placeholders/instagram-05.svg", alt: "足湯" },
  ],
};

const BANNERS = [
  { src: "/img/placeholders/banner-01.svg", alt: "杜の湯 足湯" },
  { src: "/img/placeholders/banner-02.svg", alt: "霧見茶房" },
  { src: "/img/placeholders/banner-03.svg", alt: "三日月町商店会" },
  { src: "/img/placeholders/banner-04.svg", alt: "霞ノ杜診療所" },
  { src: "/img/placeholders/banner-05.svg", alt: "杜川工房" },
];

type Props = {
  variant?: "top" | "inner";
  enableScrollMotion?: boolean;
};

export function SiteFooter({ variant = "inner", enableScrollMotion = false }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!enableScrollMotion || !rootRef.current || reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(".footer-photo-mosaic__grid figure", {
        opacity: 0,
        y: 32,
        stagger: 0.12,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".footer-photo-mosaic__grid",
          start: "top 85%",
        },
      });
      gsap.to(".footer-banner-row", {
        x: -24,
        ease: "none",
        scrollTrigger: {
          trigger: ".footer-banners",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      });
      gsap.from(".footer-symbol", {
        opacity: 0,
        rotation: -3,
        duration: 1,
        scrollTrigger: {
          trigger: ".footer-bottom",
          start: "top 88%",
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [enableScrollMotion, reduced]);

  const bg = variant === "top" ? "bg-[#f4f6f8]" : "bg-[#eef1f4]";

  return (
    <footer ref={rootRef} className={`${bg} text-[#222]`}>
      <section className="footer-photo-section mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-8">
          <h2 className="city-heading-display m-0 text-2xl md:text-[1.65rem]">フォトギャラリー</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            霞ノ杜町公式フォトギャラリー　ID{" "}
            <span className="font-mono text-[13px] text-[var(--color-text)]">kasuminomori_photo</span>
          </p>
        </div>
        <div className="footer-photo-mosaic">
          <figure className="footer-photo-mosaic__lead footer-photo-large">
            <Image src={assetPath(PHOTOS.large.src)} alt={PHOTOS.large.alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 480px" />
          </figure>
          <div className="footer-photo-mosaic__grid footer-photo-small">
            {PHOTOS.small.map((p) => (
              <figure key={p.src}>
                <Image src={assetPath(p.src)} alt={p.alt} fill className="object-cover" sizes="(max-width:768px) 45vw, 220px" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="footer-banners border-t border-[#dde3e8] bg-white/60 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-sm font-bold tracking-widest text-[#1a4d80]">バナー広告</h2>
          <p className="mt-2">
            <Link
              href="/shisei/koho/"
              className="inline-block rounded border border-[#1a4d80] px-4 py-2 text-sm text-[#1a4d80] no-underline hover:bg-[#e8f0fa]"
            >
              霞ノ杜町ホームページ掲載広告の募集
            </Link>
          </p>
          <ul className="footer-banner-row m-0 mt-6 flex list-none flex-wrap gap-4 p-0">
            {BANNERS.map((b) => (
              <li key={b.src}>
                <Image src={assetPath(b.src)} alt={b.alt} width={200} height={56} className="h-14 w-auto rounded border border-[#dde3e8]" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="footer-bottom mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1fr_1.2fr_auto]">
        <div className="flex items-start gap-3">
          <SiteLogo variant="footer" />
        </div>
        <address className="not-italic text-sm leading-relaxed text-[#444]">
          <strong className="text-[#222]">霞ノ杜町役場 三日月庁舎</strong>
          <br />
          〒029-17XX 吾妻郡霞ノ杜町三日月中央2-8-1
          <br />
          代表電話 0123-45-6700（平日 8:30〜17:15）
        </address>
        <Image
          src={assetPath("/img/kasuminomori-mon.png")}
          alt="霞ノ杜町のシンボルマーク"
          width={200}
          height={200}
          className="footer-symbol mx-auto md:mx-0"
        />
      </div>
      <nav className="mx-auto max-w-6xl border-t border-[#dde3e8] px-4 py-4 text-center text-sm" aria-label="フッターメニュー">
        <ul className="m-0 flex flex-wrap justify-center gap-x-4 gap-y-2 p-0 list-none">
          <li><Link href="/shisei/yakuba/" className="text-[var(--kasumi-blue)] no-underline hover:underline">庁舎案内</Link></li>
          <li><Link href="/contact/" className="text-[var(--kasumi-blue)] no-underline hover:underline">お問い合わせ</Link></li>
          <li><Link href="/guide/" className="text-[var(--kasumi-blue)] no-underline hover:underline">町のご案内</Link></li>
          <li><Link href="/shisei/koho/" className="text-[var(--kasumi-blue)] no-underline hover:underline">サイトのご利用について</Link></li>
        </ul>
      </nav>
      <p className="border-t border-[#dde3e8] py-4 text-center text-xs text-[#888]">
        Copyright © Kasuminomori Town All Rights Reserved.
      </p>
      <p className="px-4 pb-8 text-center text-xs text-[#999]">
        ※本サイトは謎解き作品のための<strong>架空サイト</strong>です。記載内容はフィクションであり、実在の団体・地名とは無関係です。
      </p>
    </footer>
  );
}
