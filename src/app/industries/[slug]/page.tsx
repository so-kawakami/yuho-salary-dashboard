import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getCompaniesByIndustry, getAllIndustrySlugs, getIndustries } from "@/db/safe-queries";

// 業界ごとの説明テキスト
const INDUSTRY_INFO: Record<string, { description: string; salaryNote: string; characteristics: string[] }> = {
  "情報・通信": {
    description:
      "ソフトウェア開発、インターネットサービス、通信キャリア、ITコンサルティングなど、デジタル関連のビジネスを手がける企業群です。DX需要の高まりとともに人材不足が続いており、スキルに応じた高水準の年収が特徴です。",
    salaryNote:
      "上場企業の中でも平均年収が高い業界の一つです。特にソフトウェア・インターネット系は外資系の競合もあり、優秀なエンジニアへの報酬が押し上げられています。",
    characteristics: ["ITエンジニア・プログラマーの需要が高い", "リモートワーク普及率が高い", "成果主義・実力主義の企業が多い"],
  },
  "医薬品": {
    description:
      "医療用医薬品・一般用医薬品（OTC）の研究開発・製造・販売を行う企業群です。新薬開発には長期間・高額の投資が必要なため、研究開発費が売上の20〜30%を占めることも珍しくありません。",
    salaryNote:
      "製薬企業は研究開発職・MRなど専門性の高い職種が多く、業界全体の平均年収は製造業の中でも高水準です。グローバル展開している大手企業ほど年収が高い傾向があります。",
    characteristics: ["研究開発職（薬剤師・博士号取得者）の採用が多い", "MR（医薬情報担当者）職は成果報酬型も多い", "景気の影響を受けにくいディフェンシブ銘柄"],
  },
  "電気機器": {
    description:
      "半導体、電子部品、家電、産業用電気設備など幅広い製品を製造する企業群です。日本を代表する製造業の一つで、グローバル競争が激しい分野です。",
    salaryNote:
      "メーカーとして中核的な位置づけの業界で、大手から中堅まで規模による年収差が大きい傾向にあります。半導体・FA関連は近年需要増で業績好調な企業が多く見られます。",
    characteristics: ["エンジニア職の割合が高い", "海外売上比率が高い大企業が多い", "産業用・消費者向けで事業モデルが異なる"],
  },
  "機械": {
    description:
      "工作機械、産業機械、建設機械、農業機械など各種機械の製造・販売を行う企業群です。製造業の基盤を支える「機械の機械」を作る業種で、技術的蓄積が競争力の源泉です。",
    salaryNote:
      "大手メーカーは安定した財務基盤を持つ企業が多く、年収水準も安定しています。専門技術職は不足しており、技術者への待遇は年々改善傾向にあります。",
    characteristics: ["製造技術・設計職の需要が高い", "グローバル展開している大手が多い", "受注産業のため景気に連動しやすい"],
  },
  "化学": {
    description:
      "有機・無機化学品、プラスチック、塗料、農薬、化粧品原料など幅広い素材・製品を製造する企業群です。「産業のコメ」と呼ばれる化学素材を供給する基盤産業です。",
    salaryNote:
      "素材メーカーとして安定した収益基盤を持つ企業が多く、大手を中心に年収水準は安定しています。特殊化学品・機能性材料は高付加価値で収益性が高い傾向があります。",
    characteristics: ["研究開発職（化学系・材料系）の採用が多い", "B to Bビジネスが中心", "環境・サステナビリティへの対応が求められる"],
  },
  "食料品": {
    description:
      "食品・飲料・調味料の製造・販売を行う企業群です。消費者の生活に直結する業種で、内需型のビジネスが中心ですが、近年は海外展開を強化する企業も増えています。",
    salaryNote:
      "食品業界は全体的に製造業の中では年収水準がやや低めとされてきましたが、大手企業は近年の物価上昇に伴い賃上げに積極的な動きが見られます。",
    characteristics: ["ブランド力・商品開発力が重要", "景気変動の影響が比較的少ない", "流通・スーパーとの価格交渉力が収益を左右"],
  },
  "輸送用機器": {
    description:
      "自動車・バイク・船舶・鉄道車両・航空機部品などの製造を行う企業群です。日本の基幹産業であり、裾野が広く関連企業も多数存在します。",
    salaryNote:
      "自動車大手は国内製造業の中でも年収水準が高い部類に入ります。ただしEV化・自動運転などの構造変化への対応コストが増加しており、企業間の収益格差が広がっています。",
    characteristics: ["製造・設計技術者の需要が大きい", "サプライチェーンが複雑で関連企業が多い", "EV化・CASE対応が経営課題"],
  },
  "卸売": {
    description:
      "商社・卸売業者として、メーカーと小売・ユーザーの間で商品の流通・販売を手がける企業群です。総合商社は資源・食料品・インフラなど多様な事業を展開しています。",
    salaryNote:
      "総合商社は国内有数の高年収業界として知られています。近年の資源高・円安環境で総合商社の利益が大幅に増加し、年収水準はさらに上昇傾向にあります。専門商社は扱う商材によって年収差があります。",
    characteristics: ["総合商社は国内最高水準の年収", "海外駐在・グローバル展開の機会が多い", "商品・業種によって収益構造が大きく異なる"],
  },
  "小売": {
    description:
      "百貨店・スーパー・コンビニ・専門店など、消費者へ商品を直接販売する企業群です。EC化・デジタル化への対応と、人件費上昇への対策が業界全体の課題となっています。",
    salaryNote:
      "小売業は全業種の中でも平均年収が低めとされてきましたが、近年は最低賃金の上昇と人手不足を背景に、大手を中心に賃上げが進んでいます。",
    characteristics: ["アルバイト・パート雇用が多い（有報は正社員のみ）", "立地戦略・商品調達力が競争力の源泉", "EC化対応が急務"],
  },
  "銀行": {
    description:
      "都市銀行・地方銀行・信託銀行など、預金・融資・為替などの金融サービスを提供する企業群です。低金利環境が長期化した中でも、近年の金利上昇局面で収益が回復傾向にあります。",
    salaryNote:
      "メガバンクを中心に安定した高年収の印象がありますが、近年は経費削減・デジタル化による人員適正化が進んでいます。地方銀行は大手と比べると年収水準が低い傾向があります。",
    characteristics: ["金融庁の規制下で経営する", "金利環境の影響を直接受ける", "フィンテック企業との競合が増加"],
  },
  "証券": {
    description:
      "株式・債券・デリバティブの売買仲介・引受を行う証券会社、および商品先物取引を手がける企業群です。資本市場の円滑な機能を支える業種です。",
    salaryNote:
      "大手証券は国内でも高年収の業界です。市場環境によって業績が左右されるため、年収変動も大きい傾向があります。近年の株高環境で収益・給与ともに上昇傾向にあります。",
    characteristics: ["市況に連動した業績変動が大きい", "投資銀行部門・トレーディング部門は高報酬", "外資系証券との競争が激しい"],
  },
  "保険": {
    description:
      "生命保険・損害保険・第三分野保険などのサービスを提供する企業群です。安定的なプレミアム収入と長期の保険料積立を原資に、資産運用を行うビジネスモデルです。",
    salaryNote:
      "大手生損保は安定した収益基盤を持ち、年収水準も安定しています。営業職（代理店・個人営業）は成果主義の要素が強い場合があります。",
    characteristics: ["長期的な契約関係が中心", "アクチュアリー（保険数理士）などの専門職需要", "低金利環境での運用収益確保が課題"],
  },
  "その他金融": {
    description:
      "消費者金融、クレジットカード、リース、投資信託・ファンドなど、銀行・証券・保険以外の金融サービスを提供する企業群です。",
    salaryNote:
      "業態によって年収水準が大きく異なります。フィンテック系企業では高い年収水準を提示する企業も増えています。",
    characteristics: ["事業モデルの多様性が高い", "貸金業法など業態ごとの規制あり", "フィンテック参入が活発な領域"],
  },
  "不動産": {
    description:
      "不動産の開発・分譲・賃貸・管理・仲介などを行う企業群です。マンション・商業施設・オフィスビル・物流施設など、扱う物件の種別によって事業特性が異なります。",
    salaryNote:
      "大手デベロッパーは国内でも高年収の業界に属します。近年の地価上昇・賃料上昇により大手の収益は好調で、賃上げが進んでいる企業も多くあります。",
    characteristics: ["大手デベロッパーは高年収", "不動産市況・金利環境の影響が大きい", "仲介業と開発業では年収水準が異なる"],
  },
  "サービス": {
    description:
      "人材サービス、広告、外食、ホテル・レジャー、医療・介護関連など多様な業種が含まれる分類です。人を介したサービス提供が中心で、労働集約型のビジネスが多い傾向があります。",
    salaryNote:
      "サービス業は業種が多様なため年収差が大きいです。人材・広告系は比較的高水準ですが、外食・介護系は業界全体の改善が課題となっています。",
    characteristics: ["業態によって年収差が大きい", "人手不足・採用競争が激しい", "DX化による生産性向上が急務"],
  },
  "建設": {
    description:
      "土木工事・建築工事・設備工事などを手がける企業群です。インフラ整備・再開発需要の高まりとともに、建設技術者の人手不足が深刻化しています。",
    salaryNote:
      "大手ゼネコンは安定した受注基盤を持ち、年収水準も改善傾向にあります。近年は建設業界の労働環境改善（2024年問題対応）を背景に賃上げが加速しています。",
    characteristics: ["現場監督・施工管理技士の不足が深刻", "2024年問題（時間外労働規制）への対応が急務", "再開発・インフラ更新需要は堅調"],
  },
  "陸運": {
    description:
      "トラック・バス・鉄道などの陸上輸送サービスを提供する企業群です。物流を支える社会インフラとして重要な役割を担っています。",
    salaryNote:
      "鉄道・大手物流企業は安定した事業基盤を持ちますが、ドライバー職の人手不足が深刻で、賃金改善の圧力が高まっています。2024年問題への対応で大手は賃上げを実施しています。",
    characteristics: ["ドライバー・乗務員の人材不足が深刻", "燃料費の変動が収益に影響", "EC拡大で物流需要は増加傾向"],
  },
  "電気・ガス": {
    description:
      "電力会社・ガス会社など、エネルギーインフラを担う企業群です。規制産業として安定した収益基盤を持ちつつ、電力自由化・エネルギー転換への対応が求められています。",
    salaryNote:
      "大手電力・ガス会社は国内でも安定した高年収の業界です。ただしエネルギーコストの変動により業績が大きく影響を受けることがあります。",
    characteristics: ["公益事業としての安定性が高い", "再生可能エネルギー投資が増加", "電力自由化で競争環境が変化"],
  },
  "海運": {
    description:
      "コンテナ船・ばら積み船・タンカーなどによる海上輸送を手がける企業群です。日本の輸出入貨物の99%以上は海上輸送が担っており、グローバル物流の根幹を支えています。",
    salaryNote:
      "市況（運賃指数）によって業績が大きく変動する業界ですが、コロナ禍以降のコンテナ運賃高騰で大手3社は記録的な利益を計上し、年収・賞与水準が大きく上昇しました。",
    characteristics: ["大手海運は近年の市況高で高年収", "運賃市況により業績変動が非常に大きい", "外航船員・陸上総合職で待遇が異なる"],
  },
  "空運": {
    description:
      "航空旅客・航空貨物の輸送サービスを提供する企業群です。国際線・国内線の旅客需要と燃油価格が業績を左右します。",
    salaryNote:
      "コロナ禍で大きな打撃を受けましたが、インバウンド需要の回復とともに業績・採用は回復傾向にあります。パイロット・整備士など専門職は高待遇です。",
    characteristics: ["パイロット・整備士などの専門職は高年収", "燃油価格・為替の影響が大きい", "インバウンド需要の回復が追い風"],
  },
  "鉱業": {
    description:
      "石油・天然ガス・金属資源などの探鉱・開発・採掘を行う企業群です。資源価格に業績が直結するビジネスモデルです。",
    salaryNote:
      "資源開発大手は社員数が少なく専門性が高いため、上場企業の中でもトップクラスの年収水準です。資源価格の上昇局面では業績・賞与がさらに伸びる傾向があります。",
    characteristics: ["少数精鋭で平均年収が高い", "資源価格・為替に業績が連動", "海外プロジェクト駐在の機会が多い"],
  },
  "石油・石炭": {
    description:
      "原油の精製・石油製品の販売、石炭製品の製造などを手がける企業群です。エネルギー供給の安定を担う基盤産業です。",
    salaryNote:
      "石油元売り大手は安定した高年収の業界です。脱炭素の流れの中で再生可能エネルギーや化学品など事業多角化を進めています。",
    characteristics: ["元売り大手は安定した高年収", "原油価格・為替の影響が大きい", "脱炭素対応・事業転換が長期課題"],
  },
  "鉄鋼": {
    description:
      "高炉・電炉による鉄鋼の製造、特殊鋼・鋼材加工などを手がける企業群です。自動車・建設・造船など幅広い産業に素材を供給しています。",
    salaryNote:
      "大手高炉メーカーは近年の鋼材価格上昇と構造改革により収益力が向上し、賃上げの動きが続いています。",
    characteristics: ["大手高炉と電炉・特殊鋼で事業構造が異なる", "原料炭・鉄鉱石価格の影響が大きい", "脱炭素（水素還元製鉄など）への投資が進む"],
  },
  "非鉄金属": {
    description:
      "銅・アルミ・ニッケルなどの非鉄金属の製錬・加工、電線・電子材料の製造を手がける企業群です。EV・半導体需要の拡大で注目される素材分野です。",
    salaryNote:
      "金属市況に業績が左右されますが、電子材料・機能材料に強い企業は収益性が高く、年収水準も製造業の中で比較的高めです。",
    characteristics: ["EV・半導体向け材料の需要が拡大", "金属市況・為替の影響が大きい", "リサイクル・都市鉱山事業も成長分野"],
  },
  "金属製品": {
    description:
      "建築用金属製品、ばね・ねじなどの部品、缶・容器などを製造する企業群です。建設・自動車・食品など幅広い産業を支えています。",
    salaryNote:
      "中堅・中小企業が多く、年収水準は製造業平均よりやや低めの傾向ですが、ニッチ分野で高シェアを持つ優良企業も多く存在します。",
    characteristics: ["ニッチトップ企業が多い", "原材料（鋼材）価格の転嫁が課題", "建設・自動車需要に連動"],
  },
  "精密機器": {
    description:
      "計測機器・医療機器・光学機器・時計などの精密機械を製造する企業群です。高い技術力を武器にグローバルで戦う企業が多い分野です。",
    salaryNote:
      "医療機器・計測機器など高付加価値分野が多く、製造業の中でも年収水準は高めです。研究開発職の待遇が手厚い企業が目立ちます。",
    characteristics: ["医療機器・分析機器は安定成長分野", "研究開発職の比率が高い", "海外売上比率が高い企業が多い"],
  },
  "ガラス・土石": {
    description:
      "ガラス・セメント・セラミックス・炭素製品などの窯業製品を製造する企業群です。建設資材から半導体部材まで幅広い製品を供給しています。",
    salaryNote:
      "セメント・板ガラスなどの建材系は安定志向、半導体向けセラミックスなどの先端部材系は高収益で、同じ業界内でも事業内容によって年収差があります。",
    characteristics: ["半導体部材メーカーは高収益", "エネルギーコストの影響が大きい", "建設需要に連動する建材分野"],
  },
  "繊維": {
    description:
      "衣料用繊維から炭素繊維・高機能素材まで手がける企業群です。大手は衣料から産業資材・ヘルスケアへ事業の軸足を移しています。",
    salaryNote:
      "衣料系は厳しい競争環境ですが、炭素繊維や高機能素材に強い大手は化学メーカーに近い収益構造で、年収水準も比較的高めです。",
    characteristics: ["大手は高機能素材へシフト", "炭素繊維は航空機・EV向けで成長", "衣料分野はSPA・海外勢との競争が激しい"],
  },
  "パルプ・紙": {
    description:
      "紙・板紙・パルプ・家庭紙などを製造する企業群です。デジタル化による印刷用紙の需要減少を、段ボールや海外事業でカバーする構造転換が進んでいます。",
    salaryNote:
      "成熟産業のため年収水準は製造業平均並みですが、EC拡大による段ボール需要や衛生用紙は底堅く、大手は安定した雇用環境です。",
    characteristics: ["EC拡大で段ボール需要は堅調", "印刷用紙はデジタル化で減少傾向", "森林資源・バイオマス事業に注目"],
  },
  "ゴム": {
    description:
      "タイヤ・工業用ゴム製品などを製造する企業群です。タイヤ大手はグローバルで高いシェアを持ち、海外売上比率が高いのが特徴です。",
    salaryNote:
      "タイヤ大手は海外展開が進み、収益力・年収水準ともに製造業の中で高めです。原材料（天然ゴム・原油）価格の影響を受けます。",
    characteristics: ["タイヤ大手はグローバル高シェア", "原材料価格・為替の影響が大きい", "EV化でタイヤの高付加価値化が進む"],
  },
  "倉庫・運輸": {
    description:
      "倉庫業・港湾運送・物流センター運営などを手がける企業群です。EC拡大とサプライチェーン再構築で物流インフラの重要性が高まっています。",
    salaryNote:
      "港湾・倉庫大手は安定した事業基盤を持ち、年収水準は運輸業の中では比較的高めです。物流不動産・3PL（物流一括受託）が成長分野です。",
    characteristics: ["EC拡大で物流施設需要が増加", "港湾利権など参入障壁が高い", "3PL・国際物流が成長分野"],
  },
  "水産・農林": {
    description:
      "水産物の漁獲・養殖・加工、農林業関連事業を手がける企業群です。食のサプライチェーンの上流を担い、商社的な機能を持つ企業も多くあります。",
    salaryNote:
      "大手水産会社は冷凍食品・養殖・海外事業など多角化が進んでおり、年収水準は食品業界と同程度です。",
    characteristics: ["養殖・陸上養殖など技術革新が進む", "資源管理・サステナビリティ対応が重要", "冷凍食品など川下事業へ展開"],
  },
  "その他製品": {
    description:
      "ゲーム・玩具・文具・楽器・スポーツ用品・印刷など、他の分類に属さない多様なメーカーが含まれる業種です。任天堂・バンダイナムコなどエンタメ系の有力企業が含まれます。",
    salaryNote:
      "ゲーム・エンタメ系企業は収益性が高く、年収水準もトップクラスの企業があります。一方で印刷・文具など成熟分野は平均的な水準で、業界内の年収差が大きいのが特徴です。",
    characteristics: ["ゲーム・エンタメ系は高年収", "IP（知的財産）ビジネスが収益源", "業界内の年収格差が大きい"],
  },
};

function getIndustryInfo(industry: string) {
  return INDUSTRY_INFO[industry] ?? null;
}

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllIndustrySlugs().map((industry) => ({ slug: industry }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = decodeURIComponent(slug);

  const industries = getIndustries();
  const industryData = industries.find((i) => i.industry === industry);
  const avgSalary = industryData?.avgSalary ?? 0;
  const count = industryData?.companies ?? 0;

  const title = `${industry}の平均年収ランキング【上場企業${count}社】| 有価証券報告書`;
  const description = avgSalary
    ? `${industry}の上場企業${count}社の平均年収は${avgSalary.toLocaleString()}万円。有価証券報告書をもとにした${industry}の年収ランキングを掲載。企業ごとの従業員数・平均年齢・勤続年数も確認できます。`
    : `${industry}の上場企業${count}社の平均年収ランキング。有価証券報告書の公式データから集計。`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = decodeURIComponent(slug);
  const companies = getCompaniesByIndustry(industry);
  const industries = getIndustries();
  const industryData = industries.find((i) => i.industry === industry);
  const avgSalary = industryData?.avgSalary ?? 0;
  const industryInfo = getIndustryInfo(industry);

  // 業界内統計
  const salariesWithData = companies.filter((c) => c.salary > 0);
  const maxSalary = salariesWithData.length > 0 ? Math.max(...salariesWithData.map((c) => c.salary)) : 0;
  const minSalary = salariesWithData.length > 0 ? Math.min(...salariesWithData.map((c) => c.salary)) : 0;
  const above800 = salariesWithData.filter((c) => c.salary >= 800).length;
  const above600 = salariesWithData.filter((c) => c.salary >= 600).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: "https://yuho-nenshu.com" },
      { "@type": "ListItem", position: 2, name: "業界別", item: "https://yuho-nenshu.com/industries" },
      { "@type": "ListItem", position: 3, name: industry, item: `https://yuho-nenshu.com/industries/${slug}` },
    ],
  };

  return (
    <div className="flex flex-col min-h-full bg-mesh">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-5 space-y-4">
        {/* パンくず＋ヘッダー */}
        <div className="glass rounded-2xl px-5 py-4">
          <nav className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-3">
            <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">ホーム</Link>
            <span>/</span>
            <Link href="/industries" className="hover:text-[var(--color-primary)] transition-colors">業界別</Link>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">{industry}</span>
          </nav>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text-primary)]">
                {industry}の年収ランキング
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                有価証券報告書ベース・{companies.length}社
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              {avgSalary > 0 && (
                <div className="text-right">
                  <p className="text-xs text-[var(--color-text-muted)]">業界平均年収</p>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-3xl font-black text-gradient">{avgSalary.toLocaleString()}</span>
                    <span className="text-sm text-[var(--color-text-secondary)]">万円</span>
                  </div>
                </div>
              )}
              <Link
                href="/industries"
                className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
              >
                業界一覧へ
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* 業界説明・統計サマリー */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 業界説明テキスト */}
          <div className="lg:col-span-2 glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              {industry}とは
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {industryInfo?.description ??
                `${industry}に属する上場企業の有価証券報告書をもとに、平均年収・従業員数・DEI指標などのデータを集計しています。データはすべて金融庁EDINETの公式開示情報です。`}
            </p>
            {industryInfo?.salaryNote && (
              <div className="rounded-lg bg-[var(--color-primary-light)] p-3">
                <p className="text-xs text-[var(--color-primary)] leading-relaxed">
                  <span className="font-bold">年収の特徴：</span>
                  {industryInfo.salaryNote}
                </p>
              </div>
            )}
            {industryInfo?.characteristics && (
              <ul className="space-y-1">
                {industryInfo.characteristics.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-primary)] mt-0.5 shrink-0">▸</span>
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 業界統計サマリー */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">業界統計</h2>
            <div className="space-y-2">
              {[
                { label: "掲載企業数", value: `${companies.length}社` },
                { label: "業界平均年収", value: avgSalary > 0 ? `${avgSalary.toLocaleString()}万円` : "-" },
                { label: "最高年収", value: maxSalary > 0 ? `${maxSalary.toLocaleString()}万円` : "-" },
                { label: "最低年収", value: minSalary > 0 ? `${minSalary.toLocaleString()}万円` : "-" },
                { label: "年収800万円以上", value: above800 > 0 ? `${above800}社（${Math.round(above800 / salariesWithData.length * 100)}%）` : "-" },
                { label: "年収600万円以上", value: above600 > 0 ? `${above600}社（${Math.round(above600 / salariesWithData.length * 100)}%）` : "-" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/10 last:border-0">
                  <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              出典：有価証券報告書（EDINET）
            </p>
          </div>
        </div>

        {/* このデータについて */}
        <div className="glass rounded-2xl px-5 py-4">
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--color-text-primary)]">データについて：</span>
            掲載している年収・従業員数は各企業が金融庁EDINETに提出した有価証券報告書（単体・正社員）の値です。
            連結子会社・派遣社員・パートタイム社員は含まれません。
            各企業名をクリックすると、年収推移グラフ・DEI指標・財務データなどの詳細を確認できます。
          </p>
        </div>

        {/* 企業ランキング（2カラムグリッド） */}
        {companies.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {companies.map((company, i) => (
              <Link
                key={company.code}
                href={`/company/${company.code}`}
                className="glass rounded-xl flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? "bg-yellow-400 text-white" :
                  i === 1 ? "bg-gray-300 text-white" :
                  i === 2 ? "bg-amber-600 text-white" :
                  "bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--color-text-primary)] truncate text-sm">{company.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {company.employees > 0 ? `${company.employees.toLocaleString()}名` : ""}
                    {company.avgAge > 0 ? ` · ${company.avgAge}歳` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-gradient">
                    {company.salary.toLocaleString()}<span className="text-xs font-normal text-[var(--color-text-secondary)]">万円</span>
                  </p>
                  {avgSalary > 0 && (
                    <p className={`text-xs ${company.salary >= avgSalary ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"}`}>
                      {company.salary >= avgSalary ? "+" : ""}{company.salary - avgSalary}万
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[var(--color-text-muted)]">データがありません</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
