import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Footprint } from "@/components/layout/Footprint";
import { TokenGateInit } from "@/components/layout/TokenGate";
import { BASE_PATH, OG_IMAGE, SITE_URL } from "@/lib/site";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});


/** トップページ（と下層の既定）の説明文。検索結果にそのまま出る。 */
const SITE_DESCRIPTION = "霞ノ杜町公式ホームページ。くらし・防災・子育て・観光・町政情報をご案内します。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "霞ノ杜町",
  title: {
    default: "霞ノ杜町｜公式ホームページ",
    template: "%s｜霞ノ杜町",
  },
  description: SITE_DESCRIPTION,
  // iPhone などが電話番号・住所・メールを自動でリンクにしないように（電話は tel: リンクにしない方針。DR-03）
  formatDetection: { telephone: false, address: false, email: false },
  authors: [{ name: "霞ノ杜町" }],
  creator: "霞ノ杜町",
  publisher: "霞ノ杜町",
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${BASE_PATH}/icon.png`, type: "image/png", sizes: "32x32" },
      { url: `${BASE_PATH}/img/kasuminomori-mon-512.png`, type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: `${BASE_PATH}/img/kasuminomori-mon-180.png`, type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    title: "霞ノ杜町",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "霞ノ杜町",
    title: "霞ノ杜町｜公式ホームページ",
    description: SITE_DESCRIPTION,
    url: "/",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "霞ノ杜町｜公式ホームページ",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
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
        url: "https://roku253.github.io/kasuminomori/img/kasuminomori-mon.png",
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
    <html lang="ja" className={notoSans.variable}>
      <head>
        <meta name="application-name" content="霞ノ杜町" />
        <meta name="apple-mobile-web-app-title" content="霞ノ杜町" />
        <link rel="manifest" href={`${BASE_PATH}/manifest.webmanifest`} />
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
