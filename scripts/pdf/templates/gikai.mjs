import { css, h } from "../lib/html.mjs";

export default {
  render(doc) {
    const pages = doc.sheets.map(
      (inner, i) =>
        h`<section class="page"><div class="sheet">${inner}</div>${i ? h`<p class="nombre ${i % 2 ? "left" : "right"}">${i + 1}</p>` : ""}</section>`,
    );
    return { styles: css("base.css", "gikai.css"), pages };
  },
};
