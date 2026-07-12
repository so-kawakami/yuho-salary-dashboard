import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

const SITE_NAME = "有報年収ダッシュボード";
const SITE_URL = "https://yuho-nenshu.com";
const SITE_DESCRIPTION =
  "金融庁EDINETの有価証券報告書をもとに、上場企業を含む4,000社以上の平均年収を集計・公開。業界別ランキング・企業検索・年収偏差値チェッカーが使えます。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 上場企業の平均年収を有価証券報告書から`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "平均年収", "有価証券報告書", "上場企業", "年収ランキング",
    "業界別年収", "EDINET", "年収比較", "給与",
  ],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 上場企業の平均年収を有価証券報告書から`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | 上場企業の平均年収`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "GR2B1tc1t-zaCkYj903LVu7QK3vaRsjli1GXqBQCNCw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "有報年収ダッシュボード",
              alternateName: "有報年収ダッシュボード 運営事務局",
              url: SITE_URL,
              logo: `${SITE_URL}/opengraph-image`,
              description: SITE_DESCRIPTION,
              foundingDate: "2025",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                url: `${SITE_URL}/contact`,
                availableLanguage: ["Japanese"],
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9058571145132739"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
