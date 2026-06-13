import { ImageResponse } from "next/og";
import { getStatsData } from "@/db/safe-queries";
import { loadJapaneseFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const stats = getStatsData();

  const allText =
    `有報年収ダッシュボード¥あの企業の年収、知ってる？上場企業社の平均年収を有価証券報告書から金融庁EDINETの公式データで集計業界別ランキング・企業検索・偏差値チェッカーyuho-salary-dashboard.vercel.app0123456789,.　`;
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

          {/* 中央 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{
                fontSize: "72px",
                fontWeight: 700,
                background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1.2,
                display: "flex",
              }}
            >
              あの企業の年収、知ってる？
            </div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "32px", display: "flex" }}>
              {`上場企業 ${stats.totalCompanies.toLocaleString()}社の平均年収を有価証券報告書から`}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              {["業界別ランキング", "企業検索", "偏差値チェッカー"].map((t) => (
                <div
                  key={t}
                  style={{
                    background: "rgba(99,102,241,0.2)",
                    border: "1px solid rgba(99,102,241,0.4)",
                    borderRadius: "999px",
                    padding: "8px 22px",
                    color: "#a5b4fc",
                    fontSize: "20px",
                    display: "flex",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* 下部 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "18px" }}>
              金融庁EDINETの公式データで集計
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
