/** Gougle Map（霞ノ杜町 embed）の公開 URL */
export const GOUGLE_MAP_ORIGIN =
  process.env.NEXT_PUBLIC_GOUGLE_MAP_ORIGIN ?? "https://roku253.github.io/gougle-map";

export type GougleMapEmbedOptions = {
  /** 別タブ向け: 町全体表示・パン／ズーム可（範囲制限あり） */
  expand?: boolean;
};

export function gougleMapEmbedUrl(options: GougleMapEmbedOptions = {}): string {
  const url = new URL(GOUGLE_MAP_ORIGIN.endsWith("/") ? GOUGLE_MAP_ORIGIN : `${GOUGLE_MAP_ORIGIN}/`);
  url.searchParams.set("embed", "kasumi");
  if (options.expand) url.searchParams.set("expand", "1");
  return url.toString();
}
