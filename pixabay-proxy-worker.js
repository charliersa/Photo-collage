/**
 * Pixabay Proxy — Cloudflare Worker
 * ----------------------------------
 * 目的:把 Pixabay API 金鑰藏在伺服器端,讓公開的拼貼工具能搜圖,
 *       但使用者的瀏覽器永遠拿不到金鑰。
 *
 * 部署步驟(全程用網頁,免安裝、免信用卡):
 *   1. 到 https://dash.cloudflare.com 免費註冊/登入
 *   2. 左側「Workers & Pages」→「Create」→「Create Worker」
 *   3. 取個名字(例 pixabay-proxy)→「Deploy」→ 再按「Edit code」
 *   4. 把本檔全部內容貼上,取代預設程式碼 →「Deploy」
 *   5. 設定金鑰(不要寫進程式碼裡):
 *        該 Worker →「Settings」→「Variables and Secrets」→「Add」
 *        Type 選「Secret」, Name 填 PIXABAY_KEY, Value 貼你的 Pixabay 金鑰 → Save/Deploy
 *   6. 複製 Worker 網址(形如 https://pixabay-proxy.你的帳號.workers.dev)
 *   7. 打開 index.html,把該網址填到 PROXY_URL 常數,存檔
 *
 * 安全性:
 *   - 金鑰只存在 Cloudflare 環境變數,回應內容不含金鑰,前端偷不到。
 *   - 可選:把下方 ALLOWED_ORIGINS 改成你的網站網域,擋掉其他網站盜用你的 Worker
 *     (注意:Origin 標頭可被非瀏覽器偽造,只能擋一般盜用,無法百分百防堵)。
 *   - Pixabay 免費額度為每 60 秒 100 次請求,現在由所有使用者共用;
 *     本 Worker 已開啟 24 小時快取,相同搜尋會直接回快取,不重複打 Pixabay。
 */

// 留空陣列 = 允許任何來源。要限制就填你的網域,例:
// const ALLOWED_ORIGINS = ['https://yourname.github.io', 'https://your-domain.com'];
const ALLOWED_ORIGINS = [];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowOrigin =
      ALLOWED_ORIGINS.length === 0 ? '*'
      : (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);

    const cors = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    // 預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }
    if (ALLOWED_ORIGINS.length > 0 && origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden origin', { status: 403, headers: cors });
    }
    if (!env.PIXABAY_KEY) {
      return new Response(JSON.stringify({ error: 'PIXABAY_KEY 尚未設定' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // 轉發前端帶來的查詢參數,並在伺服器端注入金鑰(禁止前端覆寫)
    const inUrl = new URL(request.url);
    const params = new URLSearchParams(inUrl.search);
    params.set('key', env.PIXABAY_KEY);
    if (!params.has('image_type')) params.set('image_type', 'all');
    if (!params.has('safesearch')) params.set('safesearch', 'true');
    if (!params.has('per_page')) params.set('per_page', '21');

    const target = 'https://pixabay.com/api/?' + params.toString();

    // 24 小時邊緣快取(符合 Pixabay 要求,也省額度)
    const resp = await fetch(target, { cf: { cacheTtl: 86400, cacheEverything: true } });
    const body = await resp.text();

    return new Response(body, {
      status: resp.status,
      headers: {
        ...cors,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  },
};
