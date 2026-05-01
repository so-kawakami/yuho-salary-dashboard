import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "有報年収ダッシュボード";
const SITE_URL = "https://yuho-salary-dashboard.vercel.app";
const SITE_DESCRIPTION =
  "金融庁EDINETの有価証券報告書をもとに、上場企業3,000社以上の平均年収を集計・公開。業界別ランキング・企業検索・年収偏差値チェッカーが使えます。";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9058571145132739"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
