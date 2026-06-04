import manifest from "../src/content/manifest.json" with { type: "json" };
import enrichment from "../src/content/copy-enrichment.json" with { type: "json" };

function merged(p) {
  const extra = enrichment[p.route];
  if (!extra) return p;
  const paragraphs = extra.replaceParagraphs
    ? extra.paragraphs ?? p.paragraphs
    : [...(p.paragraphs ?? []), ...(extra.paragraphs ?? [])];
  return { ...p, paragraphs };
}

const thin = manifest.pages
  .filter((p) => p.layout === "city")
  .map(merged)
  .filter((p) => {
    const textLen =
      (p.paragraphs?.join("")?.length ?? 0) +
      (p.bodyHtml?.length ?? 0) +
      (p.extraHtml?.length ?? 0);
    return textLen < 400;
  })
  .map((p) => p.route);

console.log("Thin after enrichment:", thin.length, thin);
