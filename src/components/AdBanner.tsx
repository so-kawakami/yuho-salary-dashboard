"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// AdSense審査が通るまでは空の広告ユニットを出さない（空枠は審査でマイナス評価）。
// 承認後に Vercel の環境変数 NEXT_PUBLIC_ADS_ENABLED=true を設定すると広告が表示される。
const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

export function AdBanner({
  slot,
  format = "auto",
  className = "",
}: AdBannerProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED) return;
    if (initialized.current) return;
    initialized.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSenseスクリプトが未ロードの場合は無視
    }
  }, []);

  // 審査中は何も描画しない（空の広告枠を消す）
  if (!ADS_ENABLED) return null;

  return (
    <div className={`overflow-hidden text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-9058571145132739"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
