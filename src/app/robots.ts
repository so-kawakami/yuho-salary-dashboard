import type { MetadataRoute } from "next";

const SITE_URL = "https://yuho-nenshu.com";

// 検索流入につながらないのに全ページを巡回する SEO 分析ツール系のクローラー。
// Vercel の無料枠（ISR Reads）を圧迫するため巡回を断る。
// robots.txt は行儀のよいクローラーにしか効かない点に注意。
const BLOCKED_BOTS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "BLEXBot",
  "DataForSeoBot",
  "serpstatbot",
  "Barkrowler",
  "PetalBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: BLOCKED_BOTS, disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        // 比較ページはクロールさせない。事前生成していない組み合わせは
        // アクセスのたびに生成され（ISR Write）、ページ内の関連比較リンクを
        // 辿られて読み込みが連鎖的に増え、無料枠を使い切る原因になっていた。
        // A-vs-B と B-vs-A が重複ページになる問題（GSC で検出）も同時に解消する。
        // 人間の利用は制限されない。
        disallow: "/compare/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
