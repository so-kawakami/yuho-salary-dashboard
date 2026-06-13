/**
 * OG画像（ImageResponse/satori）用の日本語フォントローダー。
 * 描画テキストに必要なグリフだけのサブセットフォントを Google Fonts から取得する。
 */
export async function loadJapaneseFont(text: string): Promise<ArrayBuffer | null> {
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
