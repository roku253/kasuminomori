import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { Footprint } from "@/components/layout/Footprint";
import { TokenGateInit } from "@/components/layout/TokenGate";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-noto-serif",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://roku253.github.io/kasuminomori/"),
  applicationName: "霞ノ杜町",
  title: {
    default: "霞ノ杜町｜公式ホームページ",
    template: "%s｜霞ノ杜町",
  },
  description:
    "霞ノ杜町公式サイト。くらし・防災・子育て・観光・市政情報をご案内。山あいの小さな町、霧と杜の里。【フィクション】",
  authors: [{ name: "霞ノ杜町" }],
  creator: "霞ノ杜町",
  publisher: "霞ノ杜町",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    title: "霞ノ杜町",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "霞ノ杜町",
    title: "霞ノ杜町｜公式ホームページ",
    description:
      "霞ノ杜町公式サイト。くらし・防災・子育て・観光・市政情報をご案内。山あいの小さな町、霧と杜の里。【フィクション】",
  },
  twitter: {
    card: "summary",
    title: "霞ノ杜町｜公式ホームページ",
    description:
      "霞ノ杜町公式サイト。くらし・防災・子育て・観光・市政情報をご案内。【フィクション】",
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
      "@id": "https://roku253.github.io/kasuminomori/#website",
      name: "霞ノ杜町",
      alternateName: ["霞ノ杜町公式ホームページ", "Kasuminomori Town"],
      url: "https://roku253.github.io/kasuminomori/",
      inLanguage: "ja",
      publisher: { "@id": "https://roku253.github.io/kasuminomori/#organization" },
    },
    {
      "@type": "GovernmentOrganization",
      "@id": "https://roku253.github.io/kasuminomori/#organization",
      name: "霞ノ杜町",
      url: "https://roku253.github.io/kasuminomori/",
      logo: {
        "@type": "ImageObject",
        url: "https://roku253.github.io/kasuminomori/icon.svg",
      },
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
        <meta name="application-name" content="霞ノ杜町" />
        <meta name="apple-mobile-web-app-title" content="霞ノ杜町" />
        <link rel="manifest" href="/manifest.webmanifest" />
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
