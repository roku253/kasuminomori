import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PW_PORT ?? "3456";
const BASE_PATH = "/kasuminomori";
// 末尾スラッシュ必須（無いと ./kurashi/ が /kurashi/ に解決される）
const baseURL = `http://localhost:${PORT}${BASE_PATH}/`;

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
    baseURL,
    trace: "on-first-retry",
    // 動画は PW_VIDEO=1 時のみ（ffmpeg 要・ディスク不足時は off 推奨）
    video: process.env.PW_VIDEO === "1" ? "on" : "off",
    screenshot: "only-on-failure",
    headless: process.env.PW_HEADED !== "1",
    ...devices["Desktop Chrome"],
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  },
  // 内蔵 Chromium のダウンロード（~180MB）を避け、インストール済み Chrome を使用
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
