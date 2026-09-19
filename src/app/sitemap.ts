import type { MetadataRoute } from "next";
import companiesJson from "@/data/generated/companies.json";
import { getAllIndustrySlugs, getExecPayIndustries } from "@/db/safe-queries";
import { SALARY_BANDS } from "@/lib/salary-bands";

const SITE_URL = "https://yuho-nenshu.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/ranking`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/industries`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/trends`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // 独自指標ランキングページ
  const specialRankingPages: MetadataRoute.Sitemap = [
    "executive-pay",
    "sales-per-employee",
    "female-managers",
    "long-tenure",
    "young-high-income",
  ].map((slug) => ({
    url: `${SITE_URL}/ranking/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // 役員報酬の特集ページ（1億円以上一覧・業界別）
  const execPayPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/ranking/executive-pay/1oku`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...getExecPayIndustries().map(({ industry }) => ({
      url: `${SITE_URL}/ranking/executive-pay/${encodeURIComponent(industry)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  // 年収帯別の企業一覧ページ（ロングテール）
  const salaryBandPages: MetadataRoute.Sitemap = SALARY_BANDS.map((b) => ({
    url: `${SITE_URL}/salary/${b.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // 年収偏差値チェッカー結果ページ（事前生成分）
  const checkerPages: MetadataRoute.Sitemap = [];
  for (let s = 100; s <= 2000; s += 50) {
    checkerPages.push({
      url: `${SITE_URL}/checker/${s}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    });
  }

  // 業界別個別ページ
  const industrySlugs = getAllIndustrySlugs();
  const industryPages: MetadataRoute.Sitemap = industrySlugs.map((slug) => ({
    url: `${SITE_URL}/industries/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // 企業個別ページ（全4,000社以上）
  const companyPages: MetadataRoute.Sitemap = Object.keys(companiesJson).map((code) => ({
    url: `${SITE_URL}/company/${code}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  // 比較ページ（/compare/）は robots.txt でクロールを断っているため sitemap には載せない。
  // 事前生成していない組み合わせはアクセスのたびに生成され（ISR Write）、
  // そのページ内の関連比較リンクを辿られて読み込みが連鎖的に増えるため。
  // 人間は今までどおり比較機能を使える。

  return [...staticPages, ...specialRankingPages, ...execPayPages, ...salaryBandPages, ...checkerPages, ...industryPages, ...companyPages];
}
