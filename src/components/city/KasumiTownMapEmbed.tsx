import { ExternalLink } from "lucide-react";
import { gougleMapEmbedUrl } from "@/lib/gougle-map";
import { GougleWordmark } from "@/components/city/GougleWordmark";

export function KasumiTownMapEmbed() {
  const embedSrc = gougleMapEmbedUrl();
  const expandHref = gougleMapEmbedUrl({ expand: true });

  return (
    <figure className="town-map town-map--gougle">
      <div className="town-map__viewport">
        <iframe
          src={embedSrc}
          title="霞ノ杜町内マップ"
          className="town-map__frame"
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen"
        />
        <div className="town-map__brand" aria-hidden="true">
          <GougleWordmark />
        </div>
      </div>
      <figcaption className="town-map__caption">
        <a href={expandHref} target="_blank" rel="noopener noreferrer" className="town-map__expand">
          別タブで拡大表示
          <ExternalLink size={13} aria-hidden className="ml-1 inline-block align-text-bottom" />
        </a>
        <span className="town-map__note">地図の表示範囲は霞ノ杜町内に限られます。</span>
      </figcaption>
    </figure>
  );
}
