import type { Metadata } from "next";
import { getManifest } from "@/lib/content/loader";
import { RenderPage, createPageMetadata } from "@/lib/render-page";

type Props = {
  params: Promise<{ segments: string[] }>;
};

function routeFromSegments(segments: string[]): string {
  return `/${segments.join("/")}/`;
}

export function generateStaticParams() {
  return getManifest().pages.map((p) => {
    const segments = p.route.replace(/^\/|\/$/g, "").split("/").filter(Boolean);
    return { segments };
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  return createPageMetadata(routeFromSegments(segments)) ?? {};
}

export default async function SitePage({ params }: Props) {
  const { segments } = await params;
  return <RenderPage route={routeFromSegments(segments)} />;
}
