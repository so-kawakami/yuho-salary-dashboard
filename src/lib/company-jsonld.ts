import { SITE_URL } from "@/lib/site";

export type CompanyFactsForFaq = {
  name: string;
  code: string;
  industry: string | null;
  latest: {
    fiscalYear: string;
    salaryMan: number | null;
    avgAge: number | null;
    avgTenure: number | null;
    employees: number | null;
  };
  context: {
    rank: number;
    totalRanked: number;
    industryRank: number | null;
    industryCount: number;
  } | null;
};

export type FaqItem = { q: string; a: string };

/** "2024-03" → "2024年3月期" */
function formatFiscalYear(fy: string): string {
  const [y, m] = fy.split("-");
  if (!y) return fy;
  return m ? `${y}年${Number(m)}月期` : `${y}年`;
}

/**
 * 企業ページのFAQ（「◯◯の平均年収は？」等）を有報の実データから生成。
 * 値が無い項目は質問自体を出さない。可視のFAQ表示とJSON-LDの両方で共用し、
 * 内容を一致させる（Googleの構造化データガイドライン準拠）。
 */
export function buildCompanyFaq(facts: CompanyFactsForFaq): FaqItem[] {
  const { name, industry, latest, context } = facts;
  const fyLabel = formatFiscalYear(latest.fiscalYear);
  const qa: FaqItem[] = [];

  if (latest.salaryMan && latest.salaryMan > 0) {
    qa.push({
      q: `${name}の平均年収はいくらですか？`,
      a: `${name}の平均年収は${latest.salaryMan.toLocaleString()}万円です（${fyLabel}・有価証券報告書より）。`,
    });
  }

  if (context?.industryRank && industry) {
    qa.push({
      q: `${name}は${industry}業界で年収何位ですか？`,
      a: `${name}の平均年収は${industry}業界${context.industryCount}社中${context.industryRank}位、上場企業全体では${context.totalRanked.toLocaleString()}社中${context.rank.toLocaleString()}位です。`,
    });
  }

  if (latest.avgAge && latest.avgTenure) {
    qa.push({
      q: `${name}の平均年齢と平均勤続年数は？`,
      a: `${fyLabel}時点で、${name}の平均年齢は${latest.avgAge}歳、平均勤続年数は${latest.avgTenure}年です（有価証券報告書より）。`,
    });
  }

  if (latest.employees && latest.employees > 0) {
    qa.push({
      q: `${name}の従業員数は何人ですか？`,
      a: `${name}の従業員数は${latest.employees.toLocaleString()}人です（${fyLabel}・有価証券報告書の提出会社ベース）。`,
    });
  }

  return qa;
}

/** 企業ページの構造化データ（BreadcrumbList + FAQPage）を組み立てる */
export function buildCompanyJsonLd(facts: CompanyFactsForFaq, faq: FaqItem[]): object[] {
  const url = `${SITE_URL}/company/${facts.code}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "ランキング", item: `${SITE_URL}/ranking` },
      { "@type": "ListItem", position: 3, name: facts.name, item: url },
    ],
  };

  const jsonLd: object[] = [breadcrumb];

  if (faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  return jsonLd;
}
