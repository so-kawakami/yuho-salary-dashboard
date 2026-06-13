import { ImageResponse } from "next/og";
import { getCompany } from "@/db/safe-queries";
import { calcSalaryPercentile } from "@/data/mock";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 描画テキストに必要なグリフだけのサブセットフォントを Google Fonts から取得する
async function loadJapaneseFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`,
      // UA次第でwoff2/ttfが返る。satoriはttf/otf/woffに対応（woff2非対応）
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:40.0) Gecko/20100101 Firefox/40.0" } }
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const fontUrl = css.match(/src:\s*url\((.+?)\)/)?.[1];
    if (!fontUrl) return null;
    const fontRes = await fetch(fontUrl);
    if (!fontRes.ok) return null;
    const buf = await fontRes.arrayBuffer();
    // フォントのマジックバイトを検証（HTMLエラーページ対策）
    const sig = new Uint8Array(buf.slice(0, 4));
    const sigStr = String.fromCharCode(...sig);
    if (sigStr !== "wOFF" && sigStr !== "OTTO" && !(sig[0] === 0 && sig[1] === 1 && sig[2] === 0 && sig[3] === 0)) {
      return null;
    }
    return buf;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = getCompany(code);

  const latest = data?.salaryHistory[data.salaryHistory.length - 1];
  const salaryMan = latest?.avgSalary ? Math.round(latest.avgSalary / 10000) : null;
  const companyName = data?.company.name ?? "企業";
  const industry = data?.company.industry ?? "";
  const fiscalYearRaw = latest?.fiscalYear ?? "";
  // "2025-03" → "2025年3月期"
  const fiscalYear = fiscalYearRaw
    ? `${fiscalYearRaw.split("-")[0]}年${parseInt(fiscalYearRaw.split("-")[1] ?? "0")}月`
    : "";
  const percentile = salaryMan ? calcSalaryPercentile(salaryMan) : null;

  // 画像に登場する全テキスト分のグリフを取得
  const allText =
    `有報年収ダッシュボード¥万円データなし偏差値上位%期有価証券報告書（EDINET）よりyuho-salary-dashboard.vercel.app0123456789,.　` +
    companyName +
    industry +
    fiscalYear;
  const fontData = await loadJapaneseFont(allText);

  const options = fontData
    ? { fonts: [{ name: "NotoSansJP", data: fontData, weight: 700 as const }] }
    : {};

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          fontFamily: fontData ? "NotoSansJP" : "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景の装飾円 */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(26,86,219,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* メインコンテンツ */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 64px",
          }}
        >
          {/* 上部: サイト名 + 業界タグ */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #1a56db, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                ¥
              </div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "20px" }}>
                有報年収ダッシュボード
              </span>
            </div>
            {industry && (
              <div
                style={{
                  background: "rgba(99,102,241,0.25)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  borderRadius: "999px",
                  padding: "8px 20px",
                  color: "#a5b4fc",
                  fontSize: "18px",
                  display: "flex",
                }}
              >
                {industry}
              </div>
            )}
          </div>

          {/* 中央: 企業名 + 年収 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "42px", fontWeight: 700, lineHeight: 1.2 }}>
              {companyName}
            </div>
            {salaryMan ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                <span
                  style={{
                    fontSize: "96px",
                    fontWeight: 700,
                    background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                    backgroundClip: "text",
                    color: "transparent",
                    lineHeight: 1,
                  }}
                >
                  {salaryMan.toLocaleString()}
                </span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "36px" }}>万円</span>
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "40px", display: "flex" }}>
                データなし
              </div>
            )}
            {percentile && (
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    background: "rgba(96,165,250,0.15)",
                    border: "1px solid rgba(96,165,250,0.3)",
                    borderRadius: "8px",
                    padding: "6px 16px",
                    color: "#93c5fd",
                    fontSize: "20px",
                    display: "flex",
                  }}
                >
                  偏差値 {percentile.deviation}
                </div>
                <div
                  style={{
                    background: "rgba(167,139,250,0.15)",
                    border: "1px solid rgba(167,139,250,0.3)",
                    borderRadius: "8px",
                    padding: "6px 16px",
                    color: "#c4b5fd",
                    fontSize: "20px",
                    display: "flex",
                  }}
                >
                  上位 {100 - percentile.percentile}%
                </div>
              </div>
            )}
          </div>

          {/* 下部: データ出典 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "16px" }}>
              有価証券報告書（EDINET）より
              {fiscalYear ? `　${fiscalYear}期` : ""}
            </span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "16px" }}>
              yuho-salary-dashboard.vercel.app
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size, ...options }
  );
}
