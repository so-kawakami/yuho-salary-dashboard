import { ImageResponse } from "next/og";
import { calcSalaryPercentile } from "@/data/mock";
import { getStatsData } from "@/db/safe-queries";
import { loadJapaneseFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ salary: string }>;
}) {
  const { salary: raw } = await params;
  const salary = /^\d+$/.test(raw) ? parseInt(raw, 10) : 0;
  const stats = getStatsData();
  const result = calcSalaryPercentile(salary, stats.salaryMean, stats.salaryStddev);

  const allText =
    `有報年収ダッシュボード¥年収偏差値チェッカー万円の上場企業社中で上位%トップクラスかなり高いやや低め平均的あなたも診断してみようyuho-salary-dashboard.vercel.app/checker0123456789,.　` +
    result.label;
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
          background: "#17437d",
          fontFamily: fontData ? "NotoSansJP" : "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
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
            background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 64px",
          }}
        >
          {/* 上部: サイト名 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#1e56a0",
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
              年収偏差値チェッカー
            </div>
          </div>

          {/* 中央: 偏差値 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "36px", fontWeight: 700, display: "flex" }}>
              {`年収${salary.toLocaleString()}万円の偏差値は`}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
              <span
                style={{
                  fontSize: "150px",
                  fontWeight: 700,
                  background: "#a3bedd",
                  backgroundClip: "text",
                  color: "transparent",
                  lineHeight: 1,
                }}
              >
                {result.deviation}
              </span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "40px", fontWeight: 700 }}>
                {result.label}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
              <div
                style={{
                  background: "rgba(96,165,250,0.15)",
                  border: "1px solid rgba(96,165,250,0.3)",
                  borderRadius: "8px",
                  padding: "8px 20px",
                  color: "#93c5fd",
                  fontSize: "24px",
                  display: "flex",
                }}
              >
                {`上場企業${stats.totalCompanies.toLocaleString()}社中 上位${100 - result.percentile}%`}
              </div>
            </div>
          </div>

          {/* 下部 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "20px" }}>
              あなたも診断してみよう →
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
