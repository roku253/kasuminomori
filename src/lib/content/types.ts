export type BreadcrumbItem = { label: string; href?: string };

export type RelatedLink = { href: string; label: string; storyClue?: boolean };

export type CityPageContent = {
  path: string;
  route: string;
  layout: "city" | "legacy";
  title: string;
  description: string;
  canonical?: string;
  breadcrumbs: BreadcrumbItem[];
  h1?: string;
  paragraphs?: string[];
  bodyHtml?: string;
  tableHtml?: string;
  extraHtml?: string;
  related?: RelatedLink[];
  storyClueSelectors?: string[];
};

export type ContentManifest = {
  pages: CityPageContent[];
  categories: Record<string, string[]>;
  spots: string[];
  legacyRoutes: string[];
};
