import Image from "next/image";
import top from "@/content/data/top.json";
import { assetPath } from "@/lib/site";

/**
 * トップの写真（静止画1枚。自動のスライドはやめた＝WCAG 2.2.2。UX-02・B-3）。
 * 写真の上に文字やボタンを重ねない（UX-04）。町の規模に合う穏やかな町並みの写真（data/top.json）。
 */
export function TopVisual() {
  return (
    <section className="kn-top-visual" aria-label={top.visual.label}>
      <Image
        src={assetPath(top.visual.src)}
        alt={top.visual.alt}
        fill
        priority
        sizes="(min-width: 1280px) 1280px, 100vw"
        className="object-cover"
        style={{ objectPosition: top.visual.position }}
      />
    </section>
  );
}
