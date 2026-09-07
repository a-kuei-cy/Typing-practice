# 興嘉貓咪鍵盤大冒險

一套可直接部署到 GitHub Pages 的「注音＋英打」遊戲化學習系統，並使用 Google Sheets + Google Apps Script 儲存成績。

## 檔案
- `index.html`：主畫面
- `styles.css`：視覺樣式
- `app.js`：遊戲、排行榜、教師後臺
- `config.js`：GAS Web App URL
- `Code.gs`：Google Apps Script 後端
- `README.md`：部署說明

## 1. 先測試前端
直接用瀏覽器開啟 `index.html` 即可遊玩。
若 `GAS_URL` 尚未設定，雲端成績與後臺會顯示離線狀態。

## 2. 建立 Google 試算表
1. 建立新的 Google 試算表。
2. 點「擴充功能 → Apps Script」。
3. 將 `Code.gs` 全部貼入。
4. 執行 `setup()`。
5. 第一次執行依畫面完成 Google 授權。

系統會建立工作表 `Scores`，欄位：
`recordId, timestamp, className, seatNo, name, mode, level, score, wpm, accuracy, combo, duration, userAgent`

## 3. 設定教師後臺密碼
Apps Script：
「專案設定 → 指令碼屬性 → 新增指令碼屬性」

名稱：
`ADMIN_PASSWORD`

值：
請自行設定，例如校內專用密碼。

若沒有設定，測試預設值為：
`teacher888`

> 正式上線務必改掉。

## 4. 部署 Apps Script Web App
1. 按右上角「部署」。
2. 「新增部署作業」。
3. 類型選「網頁應用程式」。
4. 執行身分：自己。
5. 存取權限依學校 Google Workspace 政策選擇。
6. 完成後複製 `/exec` 網址。

打開 `config.js`：

```js
const GAS_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

## 5. 部署 GitHub Pages
將以下檔案上傳到 GitHub repository：
- index.html
- styles.css
- app.js
- config.js

Repository → Settings → Pages → Deploy from branch → main/root。

## 重要安全提醒
目前設計讓學生能直接送出「add」成績，方便低年級使用；管理者的「讀取完整資料、修改、刪除」需要後臺密碼。

若正式對外公開，建議下一版再加入：
- 學校 Google Workspace OAuth 驗證
- GAS 端簽章 token
- 教師帳號白名單
- 送出頻率限制
- 班級與學生名冊驗證

## 注音鍵位
依大千式鍵盤核心配置：
- ㄅ 1、ㄆ Q、ㄇ A、ㄈ Z
- ㄉ 2、ㄊ W、ㄋ S、ㄌ X
- ㄍ E、ㄎ D、ㄏ C
- ㄐ R、ㄑ F、ㄒ V
- ㄓ 5、ㄔ T、ㄕ G、ㄖ B
- ㄗ Y、ㄘ H、ㄙ N
- ㄧ U、ㄨ J、ㄩ M
- 聲調：空白一聲、6 二聲、3 三聲、4 四聲、7 輕聲

## 後臺功能
- 管理者登入
- 班級／模式／姓名篩選
- 完整成績清單
- 手動補登
- 修改
- 刪除
- UTF-8 BOM CSV 匯出
- 平均分數／WPM／正確率統計

## 排行榜
依：
1. 分數
2. WPM

排序，並以「班級＋姓名＋模式」只保留最佳一筆，避免同一學生重複洗榜。


## 正式部署版調整
- 已移除前台「📊 GAS設定」入口。
- 已移除教師後臺的部署密碼提示文字。
- GAS 串接仍由 `config.js` 背景運作，不影響成績上傳、排行榜與教師管理。
