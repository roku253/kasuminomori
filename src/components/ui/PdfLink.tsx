import { ExternalLink } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { formatPdfInfo, getPdfMeta, NEW_TAB_TEXT } from "@/lib/content/pdf-links";
import { assetPath } from "@/lib/site";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target"> & {
  /** public/pdf/ の中のファイル名（例: gikai-dayori-098.pdf）。src/generated/pdf-meta.json に登録が要る */
  file: string;
  children: ReactNode;
};

/**
 * React から使う PDF リンク（ページ JSON の <a data-pdf> と同じ表示）。
 * 「（PDF：8ページ・3.1MB）」・読み上げ用の「（新しいタブで開きます）」・新しいタブのアイコンを付ける。
 * data-kn-story-clue などの属性はそのまま a に渡る。
 */
export function PdfLink({ file, children, className = "", rel = "noopener", ...rest }: Props) {
  const entry = getPdfMeta(file);
  if (!entry) throw new Error(`PdfLink: pdf-meta.json に ${file} がありません（npm run pdf:meta）`);
  return (
    <a
      {...rest}
      href={assetPath(`/pdf/${file}`)}
      target="_blank"
      rel={rel}
      data-pdf={file}
      className={`kn-pdf-link ${className}`.trim()}
    >
      {children}
      {formatPdfInfo(entry)}
      <span className="sr-only">{NEW_TAB_TEXT}</span>
      <ExternalLink size={14} aria-hidden focusable={false} className="kn-newtab-icon ml-[0.2em] inline-block align-[-0.125em]" />
    </a>
  );
}
