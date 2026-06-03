import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(ROOT, "..");

const REMOVE_DIRS = [
  "kurashi",
  "anzen",
  "kodomo",
  "fukushi",
  "sangyo",
  "bunka",
  "shisei",
  "spot",
  "guide",
  "history",
  "blog",
  "access",
  "contact",
  "events",
  "documents",
  "css",
  "js",
  "partials",
];

const REMOVE_FILES = ["index.html", "token-gate.js"];

function rm(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
  console.log("removed", path.relative(ROOT_DIR, target));
}

for (const d of REMOVE_DIRS) rm(path.join(ROOT_DIR, d));
for (const f of REMOVE_FILES) rm(path.join(ROOT_DIR, f));
if (fs.existsSync(path.join(ROOT_DIR, "img"))) {
  rm(path.join(ROOT_DIR, "img"));
}
console.log("Legacy HTML cleanup done. Content: src/content/pages/*.json");
