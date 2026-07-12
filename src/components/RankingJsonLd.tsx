import { SITE_URL } from "@/lib/site";

type RankingItem = { name: string; code: string };

type Props = {
  /** ItemList の名前（例: "女性管理職比率ランキング"） */
  listName: string;
  /** このページのパス（例: "/ranking/female-managers"） */
  path: string;
  /** パンくずの末尾ラベル（例: "女性管理職比率"） */
  breadcrumbLabel: string;
  /** ランキング項目（上位から順に。先頭20件をItemListに載せる） */
  items: RankingItem[];
};

/**
 * ランキングページ用の構造化データ（BreadcrumbList + ItemList）。
 * Googleのリッチリザルト表示を狙う。JSON-LDは実行コードではなく
 * 構造化データなので、next/scriptではなくネイティブ<script>で出力する。
 */
export function RankingJsonLd({ listName, path, breadcrumbLabel, items }: Props) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "ランキング", item: `${SITE_URL}/ranking` },
        { "@type": "ListItem", position: 3, name: breadcrumbLabel, item: `${SITE_URL}${path}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: listName,
      itemListElement: items.slice(0, 20).map((row, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: row.name,
        url: `${SITE_URL}/company/${row.code}`,
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
