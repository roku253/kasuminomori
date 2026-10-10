import { defineConfig, devices } from "@playwright/test";

/**
 * e2e の配信先は2つ（project）。
 *
 * - **chrome**（既定）: 開発サーバ `npm run dev`（port PW_PORT＝3456）。起動中なら再利用し、無ければ起動する。
 *     npx playwright test
 * - **static**: `next build` の書き出し `out/` を `scripts/serve-out.mjs` で basePath `/kasuminomori` 付きで配る
 *   （port PW_STATIC_PORT＝3457）。本番相当（TokenGate が開発モードの bypass に頼らない・icon.png・コンソールエラー）と
 *   全ページ巡回はこちらで回す。先に開発サーバを止めて `npm run build` で out/ を作ること（段階3）。
 *     npx playwright test --project=static        （または PW_TARGET=static npx playwright test）
 *   両方: npx playwright test --project=chrome --project=static
 *
 * Playwright の webServer は project ごとに持てないので、選ばれた project（--project か PW_TARGET）から
 * 起動するサーバを決める。選ばれていない project は一覧に入れない（static 用のサーバが無いのに回って落ちるのを防ぐ）。
 * 選んだ値は環境変数 PW_TARGET に入れ、ワーカー（argv を受け取らない）にも同じ一覧を見せる。
 *
 * spec の置き分け: `*.static.spec.ts` は static だけで回す（TokenGate の本番挙動・全ページ巡回など）。
 * それ以外の spec は両方で回せるように書く（`page.goto(sitePath(...))`、origin は `baseURL` から取る）。
 */

const BASE_PATH = "/kasuminomori";
const DEV_PORT = process.env.PW_PORT ?? "3456";
const STATIC_PORT = process.env.PW_STATIC_PORT ?? "3457";
// 末尾スラッシュ必須（無いと ./kurashi/ が /kurashi/ に解決される）
const devBaseURL = `http://localhost:${DEV_PORT}${BASE_PATH}/`;
const staticBaseURL = `http://localhost:${STATIC_PORT}${BASE_PATH}/`;

const STATIC_ONLY = /\.static\.spec\.ts$/;

function projectsFromArgv(argv: string[]): string[] {
  const names: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--project" && argv[i + 1]) names.push(argv[i + 1]);
    else if (argv[i].startsWith("--project=")) names.push(argv[i].slice("--project=".length));
  }
  return names;
}

if (!process.env.PW_TARGET) {
  const requested = projectsFromArgv(process.argv);
  if (requested.length) process.env.PW_TARGET = requested.join(",");
}
const TARGETS = new Set(
  (process.env.PW_TARGET || "chrome")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .map((s) => (s === "dev" ? "chrome" : s))
    .filter(Boolean)
);

const commonUse = {
  ...devices["Desktop Chrome"],
  // 内蔵 Chromium のダウンロード（~180MB）を避け、インストール済み Chrome を使用
  channel: "chrome",
  locale: "ja-JP",
  timezoneId: "Asia/Tokyo",
  // 本番の書き出しは資格情報がないと本文を隠す。検査は作者と同じ解除キーで中身を見る。
  storageState: "e2e/storage-state.json",
};

const allProjects = [
  {
    name: "chrome",
    testIgnore: STATIC_ONLY,
    use: { ...commonUse, baseURL: devBaseURL },
  },
  {
    name: "static",
    use: { ...commonUse, baseURL: staticBaseURL },
  },
];

const servers = {
  chrome: {
    // npm run dev は正本（pages・data）から manifest と検索索引を作ってから next dev を起動し、変更を監視する
    command: `npm run dev -- -p ${DEV_PORT}`,
    url: devBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe" as const,
    stderr: "pipe" as const,
  },
  static: {
    // out/ が無ければ serve-out が理由を出して終了する（npm run build を先に）
    command: `node scripts/serve-out.mjs --port ${STATIC_PORT}`,
    url: staticBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: "pipe" as const,
    stderr: "pipe" as const,
  },
};

const projects = allProjects.filter((p) => TARGETS.has(p.name));
const webServer = projects.map((p) => servers[p.name as keyof typeof servers]);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [["html", { open: "never" }], ["list"]],
  outputDir: "test-results",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    trace: "on-first-retry",
    // 動画は PW_VIDEO=1 時のみ（ffmpeg 要・ディスク不足時は off 推奨）
    video: process.env.PW_VIDEO === "1" ? "on" : "off",
    screenshot: "only-on-failure",
    headless: process.env.PW_HEADED !== "1",
  },
  projects,
  webServer,
});
