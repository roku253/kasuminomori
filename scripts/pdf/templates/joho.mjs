import { css, h } from "../lib/html.mjs";

export default {
  raster(doc) {
    return [
      {
        name: "copies",
        dpi: 240,
        styles: css("base.css", "joho.css"),
        pages: doc.copyPages,
      },
    ];
  },
  render(doc, { raster }) {
    const scans = (raster.copies || []).map(
      (src) => h`<section class="page"><img class="fullscan" src="${src}" alt=""></section>`,
    );
    return { styles: css("base.css", "joho.css"), pages: [doc.cover, ...scans] };
  },
};
