import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { spawnSync } from "child_process";
import path from "path";

const basePath = "/kasuminomori";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

/**
 * 開発サーバの起動時に、正本（src/content/pages・data）から manifest と検索索引を作り直す保険。
 * `npm run dev`（scripts/dev.mjs）は自分で作って変更も監視するので、ここでは何もしない（KN_CONTENT_READY）。
 * `npx next dev` を直接使ったときに、古い manifest のまま表示されるのを防ぐ（監視はしないので、変更後は再起動）。
 * next dev は設定を親プロセスと子プロセス（NEXT_PRIVATE_WORKER）で2回読むので、親だけで行う。
 */
function refreshContentOnDevStart() {
  if (process.env.KN_CONTENT_READY === "1" || process.env.NEXT_PRIVATE_WORKER) return;
  process.env.KN_CONTENT_READY = "1";
  const result = spawnSync(process.execPath, [path.join(process.cwd(), "scripts", "content.mjs")], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.warn("[content] manifest・検索索引の生成に失敗しました。前回の内容のまま起動します。");
  }
}

export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) refreshContentOnDevStart();
  return nextConfig;
}
