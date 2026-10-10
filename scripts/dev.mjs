/**
 * 開発サーバ（`npm run dev`）。
 *   1. 正本から manifest と検索索引を作る（scripts/content.mjs）
 *   2. `next dev -p 3456` を起動する（`npm run dev -- -p 3000` でポートを変えられる）
 *   3. 正本（src/content/pages・src/content/data・public/pdf・src/generated/pdf-meta.json）を監視し、
 *      変わったら 1 をやり直す → manifest.json が変わり、開発サーバの画面に反映される（再読み込みで出る）
 *
 * `npx next dev` を直接使った場合も、起動時に一度だけ 1 が走る（next.config.ts）。ただし監視はしない。
 */
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const require = createRequire(import.meta.url);
const NEXT_BIN = require.resolve("next/dist/bin/next");
const CONTENT_SCRIPT = path.join(ROOT, "scripts", "content.mjs");

const WATCH_TARGETS = [
  "src/content/pages",
  "src/content/data",
  "public/pdf",
  "src/generated/pdf-meta.json",
];

const userArgs = process.argv.slice(2);
const hasPort = userArgs.some((a) => a === "-p" || a === "--port" || a.startsWith("--port="));
const nextArgs = ["dev", ...(hasPort ? [] : ["-p", "3456"]), ...userArgs];

function runContent(reason) {
  const started = Date.now();
  const r = spawnSync(process.execPath, [CONTENT_SCRIPT], { cwd: ROOT, stdio: "inherit" });
  const ms = Date.now() - started;
  if (r.status === 0) {
    if (reason) console.log(`[content] ${reason} → 作り直しました（${ms}ms）`);
  } else {
    console.error(`[content] 生成に失敗しました${reason ? `（${reason}）` : ""}。画面は前回の内容のままです。`);
  }
}

runContent();

const child = spawn(process.execPath, [NEXT_BIN, ...nextArgs], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, KN_CONTENT_READY: "1" },
});

const watchers = [];
let timer = null;
const changed = new Set();
function schedule(name) {
  changed.add(name);
  clearTimeout(timer);
  timer = setTimeout(() => {
    const list = [...changed].slice(0, 3).join(", ") + (changed.size > 3 ? ` ほか${changed.size - 3}件` : "");
    changed.clear();
    runContent(list);
  }, 300);
}

for (const rel of WATCH_TARGETS) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const isDir = fs.statSync(full).isDirectory();
  try {
    const w = fs.watch(full, { recursive: isDir }, (_event, filename) => {
      const name = isDir ? `${rel}/${String(filename || "").replace(/\\/g, "/")}` : rel;
      if (/(^|\/)\.|~$|\.tmp$/.test(name)) return; // エディタの一時ファイル
      schedule(name);
    });
    watchers.push(w);
  } catch (e) {
    console.warn(`[content] ${rel} を監視できません: ${e.message}`);
  }
}

function shutdown(code) {
  for (const w of watchers) w.close();
  clearTimeout(timer);
  process.exit(code);
}

child.on("exit", (code, signal) => shutdown(code ?? (signal ? 1 : 0)));
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    if (!child.killed) child.kill(sig);
  });
}
