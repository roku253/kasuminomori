import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let patched = 0;

function menuSrc(relPath) {
  const relDir = path.dirname(relPath).replace(/\\/g, "/");
  if (!relDir || relDir === ".") return "./js/";
  const depth = relDir.split("/").filter(Boolean).length;
  return "../".repeat(depth) + "js/";
}

function patchFile(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return;
  let html = fs.readFileSync(full, "utf8");
  const orig = html;
  html = html.replace(/\s*<div data-city-include="tools"><\/div>\s*/g, "\n");
  if (!html.includes("city-menu.js") && html.includes("site-include.js")) {
    const src = menuSrc(rel);
    html = html.replace(
      /(<script src="[^"]*site-include\.js"[^>]*><\/script>)/,
      `$1\n<script src="${src}city-menu.js" defer></script>`
    );
  }
  if (html !== orig) {
    fs.writeFileSync(full, html.replace(/\r\n/g, "\n"), "utf8");
    patched++;
    console.log("patched", rel);
  }
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (rel.startsWith("scripts/") || rel.startsWith("partials/")) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (name.endsWith(".html")) patchFile(rel);
  }
}

walk(ROOT);
console.log("done", patched);
