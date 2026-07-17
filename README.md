# 拼貼工作室 Collage Studio

純瀏覽器端的相片拼貼工具:加入照片／貼圖／文字，自動排版、濾鏡、去背、多頁與匯出 PNG／JPG。
所有影像都在瀏覽器內處理，**不會上傳到任何伺服器**;專案自動備份於本機瀏覽器。

## 檔案結構

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 主程式。單一 HTML 檔,使用 DC 框架(`<x-dc>` + `class Component extends DCLogic`)。 |
| `support.js` | DC 框架執行環境,由 `index.html` 以 `<script src="./support.js">` 載入。 |
| `emoji-data.js` | 貼圖搜尋用的離線 emoji 資料集(`window.EMOJI_SEARCH`,近 2000 個含中文關鍵字)。由 index.html 載入。 |
| `pixabay-proxy-worker.js` | (選用)Cloudflare Worker,代理 Pixabay 圖庫搜尋並隱藏 API 金鑰。部署步驟見檔內註解。 |
| `_archive/` | 合併前的舊版本存檔,保留備查,實際不再使用。 |

## 使用方式

直接用瀏覽器開啟 `index.html` 即可,無需安裝或建置。

- **加入照片**:左側「加入照片」按鈕,或直接把圖片拖曳到畫布。
- **貼圖**:精選 emoji 依情感／表情／自然／食物／裝飾／生活／動物分類;搜尋框可用中文關鍵字(如「貓」「愛心」)搜尋近 2000 個 emoji(離線,來自 `emoji-data.js`);虛線「＋」可上傳自己的透明 PNG。
- **雲端素材**:Iconify 向量圖示、Pixabay 相片(需設定金鑰,見下)。
- **編修**:選取照片後可調濾鏡、陰影／圓角／白框,並支援快速去背、AI 去背、手動擦除修補。
- **匯出**:可選標準／高畫質／超高或自訂長邊,下載本頁 PNG 或 JPG。

## Pixabay 雲端圖庫(選用)

雲端照片搜尋需要一組免費 Pixabay 金鑰。為避免金鑰外洩,透過 `pixabay-proxy-worker.js`
部署為 Cloudflare Worker,再把 Worker 網址填入 `index.html` 的 `PROXY_URL` 常數。
詳細步驟見 `pixabay-proxy-worker.js` 檔頭註解。

## 貼圖搜尋資料集(emoji-data.js)

離線 emoji 搜尋資料由以下來源合併去重而成(每項為 `[emoji, 中文關鍵字]`):

- [oxxostudio.tw/facebook-emoji](https://www.oxxostudio.tw/facebook-emoji/) — emoji 清單與部分中文俗名。
- [tw.piliapp.com/emoji/list](https://tw.piliapp.com/emoji/list/) — 補充 emoji(含情侶／家庭等 ZWJ 組合)。
- [emojibase](https://www.npmjs.com/package/emojibase-data) — 繁體中文標籤,替上述 emoji 補上中文名稱。

如需更新,重新抓取上述來源並依相同格式重建 `emoji-data.js` 即可(檔頭註解有說明)。

## 版本合併說明

`index.html` 由兩個舊版本合併而成(原檔存於 `_archive/`):

- **`collage-studio.html`**(基底)— 手動擦除／去背、介面導覽、Pixabay 相片、Iconify 圖示、自訂匯出解析度。
- **`Collage Studio.dc.html`** — 併入其**分類式貼圖選擇器**(情感／表情／自然…)。
