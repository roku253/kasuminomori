import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { Footprint } from "@/components/layout/Footprint";
import { TokenGateInit } from "@/components/layout/TokenGate";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://roku253.github.io/kasuminomori/"),
  title: {
    default: "霞ノ杜町｜公式ホームページ",
    template: "%s｜霞ノ杜町",
  },
  description:
    "霞ノ杜町公式サイト。くらし・防災・子育て・観光・市政情報をご案内。山あいの小さな町、霧と杜の里。【フィクション】",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "霞ノ杜町",
    title: "霞ノ杜町｜公式ホームページ",
  },
  verification: {
    google: "c0eDUSRnGg391rEJXWPdmd3Iw_3FUIfxo35pM84Bz4Y",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "霞ノ杜町",
      url: "https://roku253.github.io/kasuminomori/",
      inLanguage: "ja",
    },
    {
      "@type": "GovernmentOrganization",
      name: "霞ノ杜町",
      url: "https://roku253.github.io/kasuminomori/",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSans.variable} ${notoSerif.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="city-body antialiased">
        <TokenGateInit />
        <Footprint />
        <div id="site-root">{children}</div>
      </body>
    </html>
  );
}
