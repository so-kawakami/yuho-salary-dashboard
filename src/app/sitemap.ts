import type { MetadataRoute } from "next";
import companiesJson from "@/data/generated/companies.json";
import { getAllIndustrySlugs, getPopularComparisonCodes } from "@/db/safe-queries";

const SITE_URL = "https://yuho-salary-dashboard.vercel.app";

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

  // 人気の企業比較ページ（同業界上位企業のペア）
  const comparePages: MetadataRoute.Sitemap = getPopularComparisonCodes().map((codes) => ({
    url: `${SITE_URL}/compare/${codes}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...specialRankingPages, ...checkerPages, ...industryPages, ...companyPages, ...comparePages];
}
