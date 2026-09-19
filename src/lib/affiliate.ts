/**
 * 転職サイトへのリンクを1箇所で管理する。
 *
 * ASPと提携すると「あなた専用のアフィリエイトURL」が発行される。
 * そのURLを下の `affiliateUrl` に貼るだけで、全企業ページのリンクが
 * 報酬の発生するリンクに切り替わる（ページ側の修正は不要）。
 *
 * `affiliateUrl` が未設定のあいだは、これまでどおり素の検索URLを使う。
 * この場合クリックされても報酬は発生しないので、あくまで提携までの繋ぎ。
 */

export type JobSite = {
  /** ボタンに表示する名前 */
  name: string;
  /**
   * ASPで発行されたアフィリエイトURL。
   * 多くのASPでは企業名などのパラメータを付けられず、リンク先は固定になる。
   * 未提携のあいだは undefined のままにしておく。
   */
  affiliateUrl?: string;
  /** 未提携のあいだ使う、企業名で検索する素のURL（報酬は発生しない） */
  searchUrl: (companyName: string) => string;
};

export const JOB_SITES: JobSite[] = [
  {
    name: "doda",
    // affiliateUrl: "https://px.a8.net/svt/ejp?a8mat=...",
    searchUrl: (name) =>
      `https://doda.jp/DodaFront/View/JobSearchResult/j_ks__searchkeyword-${encodeURIComponent(name)}/`,
  },
  {
    name: "リクナビNEXT",
    // affiliateUrl: "https://px.a8.net/svt/ejp?a8mat=...",
    searchUrl: (name) =>
      `https://next.rikunabi.com/tag/KEYWORD_${encodeURIComponent(name)}/`,
  },
  {
    name: "ビズリーチ",
    // affiliateUrl: "https://px.a8.net/svt/ejp?a8mat=...",
    searchUrl: (name) =>
      `https://www.bizreach.jp/job-list/?free_word=${encodeURIComponent(name)}`,
  },
];

/** 実際にボタンに設定するURL。提携済みならアフィリエイトURLを優先する。 */
export function jobSiteHref(site: JobSite, companyName: string): string {
  return site.affiliateUrl ?? site.searchUrl(companyName);
}

/** そのリンクが報酬の発生するリンクかどうか（計測でクリックの価値を見分けるため）。 */
export function isMonetized(site: JobSite): boolean {
  return Boolean(site.affiliateUrl);
}
