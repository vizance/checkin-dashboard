# GitHub Pages 部署指南

將打卡儀表板部署到 GitHub Pages，完全免費且簡單快速！

---

## 📋 部署前準備

### 1. 確認 Phase 1 已完成

- ✅ Google Form 和 Google Sheet 已設定完成
- ✅ Google Sheet 已設為公開（知道連結的任何人 + 檢視者）
- ✅ 已取得打卡統計和每日亮點牆的 CSV 連結
- ✅ 已測試 CSV 連結可正常下載資料

### 2. 確認儀表板本地運作正常

1. 修改 `dashboard-wired.html` 的配置：
   ```javascript
   const SHEET_ID = 'YOUR_SHEET_ID';
   const STATS_GID = 'YOUR_STATS_GID';
   const HIGHLIGHTS_GID = 'YOUR_HIGHLIGHTS_GID';
   const COURSE_START_DATE = new Date('2026-01-03');
   ```

2. 在瀏覽器中開啟 `dashboard-wired.html`
3. 確認資料正確載入並顯示

---

## 🚀 方法 1: 直接使用 GitHub 網頁介面（最簡單）

### 步驟 1: 建立 GitHub 帳號

如果還沒有 GitHub 帳號：
1. 前往 [GitHub](https://github.com)
2. 點擊右上角「Sign up」
3. 輸入 Email、密碼、用戶名
4. 完成驗證

### 步驟 2: 建立新的 Repository

1. 登入 GitHub 後，點擊右上角「+」→「New repository」
2. 填寫資訊：
   - **Repository name**: `checkin-dashboard`（或任何你喜歡的名字）
   - **Description**: 5週復盤陪跑班 - 打卡儀表板
   - **Public**: 選擇 Public（必須是 Public 才能使用免費 GitHub Pages）
   - ✅ 勾選「Add a README file」
3. 點擊「Create repository」

### 步驟 3: 上傳檔案

1. 在 Repository 頁面，點擊「Add file」→「Upload files」
2. 將 `dashboard-wired.html` 拖曳到上傳區域
3. 在下方填寫 Commit message：「Add dashboard」
4. 點擊「Commit changes」

### 步驟 4: 重新命名檔案為 index.html

1. 點擊剛上傳的 `dashboard-wired.html`
2. 點擊右上角的「鉛筆圖示」（Edit this file）
3. 將檔名改為 `index.html`
4. 點擊「Commit changes」

### 步驟 5: 啟用 GitHub Pages

1. 在 Repository 頁面，點擊「Settings」（齒輪圖示）
2. 左側選單找到「Pages」
3. 在「Source」區域：
   - Branch: 選擇 `main`
   - Folder: 選擇 `/ (root)`
4. 點擊「Save」

### 步驟 6: 取得網址並測試

1. 等待約 1-2 分鐘
2. 刷新頁面，上方會顯示：
   ```
   Your site is live at https://YOUR_USERNAME.github.io/checkin-dashboard/
   ```
3. 點擊網址測試
4. 如果正常顯示，恭喜部署成功！🎉

---

## 🚀 方法 2: 使用 Git 指令（進階）

### 步驟 1: 安裝 Git

如果還沒有 Git：
- **macOS**: `brew install git` 或從 [git-scm.com](https://git-scm.com) 下載
- **Windows**: 從 [git-scm.com](https://git-scm.com) 下載安裝

### 步驟 2: 在 GitHub 建立 Repository

同方法 1 的步驟 2，但不要勾選「Add a README file」。

### 步驟 3: 初始化本地專案

在終端機中，切換到專案資料夾：

```bash
cd /Users/chichu/Desktop/vibeCoding_dailyCheckIn
```

### 步驟 4: 重新命名並準備檔案

```bash
# 複製 dashboard-wired.html 並命名為 index.html
cp dashboard-wired.html index.html
```

### 步驟 5: 初始化 Git 並推送

```bash
# 初始化 Git
git init

# 新增檔案
git add index.html README.md

# 建立第一個 commit
git commit -m "Initial commit: Add checkin dashboard"

# 連結到 GitHub（替換成你的 Repository 網址）
git remote add origin https://github.com/YOUR_USERNAME/checkin-dashboard.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步驟 6: 啟用 GitHub Pages

同方法 1 的步驟 5。

---

## 🔒 安全性說明

### GitHub Pages 是否安全？

✅ **完全安全**，理由如下：

1. **只有讀取權限**
   - 儀表板只讀取 Google Sheet 的公開 CSV 資料
   - 無法寫入或修改任何資料
   - Google Sheet 本身已設為「知道連結的任何人 + 檢視者」

2. **沒有敏感資訊**
   - Google Sheet 的 SHEET_ID 和 GID 本身不是敏感資訊
   - 只要有 CSV 連結，任何人都能下載這些資料
   - 等同於將 Google Sheet 設為公開檢視

3. **無法存取後台**
   - 無法存取 Google Form 或 Google Sheet 的編輯權限
   - 無法看到學員的 Email 地址（未顯示在儀表板上）
   - 無法執行 Apps Script

### 如果還是擔心安全性

**選項 1: 限制 GitHub Pages 訪問**
- GitHub Pages 的 Public Repository 無法設定密碼
- 可以將 Repository 改為 Private（需要付費 GitHub Pro）

**選項 2: 使用其他部署平台**
- [Netlify](https://www.netlify.com)：免費，支援密碼保護
- [Vercel](https://vercel.com)：免費，速度快
- [Cloudflare Pages](https://pages.cloudflare.com)：免費，全球 CDN

**選項 3: 分享時使用「秘密連結」**
- 不要在公開場合分享儀表板網址
- 只在私密的 LINE 群組或 Email 中分享
- 雖然網址是公開的，但沒人知道就不會被找到

### 建議做法

**✅ 推薦**：直接使用 GitHub Pages
- 資料本身就是公開的（Google Sheet 已設為公開）
- 沒有任何安全風險
- 完全免費且穩定
- 學員資料不包含敏感資訊（姓名、打卡記錄、亮點分享都是公開的）

---

## 🎨 自訂域名（可選）

如果你有自己的域名，可以設定為自訂網址。

### 步驟 1: 購買域名

在域名註冊商購買域名（例如：`checkin.vibecoding.com`）

### 步驟 2: 設定 DNS

在域名的 DNS 設定中，新增 CNAME 記錄：

```
Type: CNAME
Name: checkin
Value: YOUR_USERNAME.github.io
```

### 步驟 3: 在 GitHub Pages 設定自訂域名

1. 在 Repository 的「Settings」→「Pages」
2. 在「Custom domain」輸入你的域名：`checkin.vibecoding.com`
3. 點擊「Save」
4. 等待 DNS 驗證完成（可能需要幾分鐘到幾小時）
5. 勾選「Enforce HTTPS」（啟用 HTTPS）

---

## 📝 更新儀表板

### 方法 1: GitHub 網頁介面

1. 在 Repository 頁面，點擊 `index.html`
2. 點擊「鉛筆圖示」編輯
3. 修改內容
4. 點擊「Commit changes」
5. 等待 1-2 分鐘，GitHub Pages 會自動更新

### 方法 2: Git 指令

```bash
# 修改 index.html 後
git add index.html
git commit -m "Update dashboard"
git push
```

等待 1-2 分鐘，網站會自動更新。

---

## 🎯 部署檢查清單

- [ ] ✅ Google Sheet 已設為公開（知道連結的任何人 + 檢視者）
- [ ] ✅ CSV 連結可正常下載資料
- [ ] ✅ dashboard-wired.html 的 SHEET_ID 和 GID 已正確設定
- [ ] ✅ 本地測試儀表板可正常顯示資料
- [ ] ✅ GitHub Repository 已建立
- [ ] ✅ 檔案已命名為 index.html
- [ ] ✅ GitHub Pages 已啟用
- [ ] ✅ 儀表板網址可正常訪問
- [ ] ✅ 資料正確顯示
- [ ] ✅ 已分享網址給學員

---

## 🐛 常見問題

### Q1: GitHub Pages 顯示 404 Not Found

**解決方法**：
1. 確認檔案名稱是 `index.html`（不是 dashboard-wired.html）
2. 確認 GitHub Pages 的 Branch 設定為 `main`
3. 等待 1-2 分鐘讓 GitHub Pages 部署完成
4. 清除瀏覽器緩存並重新整理

### Q2: 儀表板顯示「載入資料失敗」

**解決方法**：
1. 確認 Google Sheet 的共用設定為「知道連結的任何人」+「檢視者」
2. 確認 SHEET_ID 和 GID 正確
3. 在無痕視窗測試 CSV 連結是否可下載
4. 檢查瀏覽器的 Console（F12）查看錯誤訊息

### Q3: 資料不會自動更新

**解決方法**：
- 等待 10 分鐘（自動刷新頻率）
- 或手動重新整理頁面（Ctrl+R 或 Cmd+R）
- 如果使用了緩存，清除 LocalStorage：
  1. 按 F12 開啟開發者工具
  2. 在 Console 輸入：`localStorage.clear()`
  3. 重新整理頁面

### Q4: 手機版顯示異常

**解決方法**：
- dashboard-wired.html 已包含響應式設計
- 如果還是異常，確認是否使用最新版本
- 清除手機瀏覽器緩存

### Q5: 想要更改儀表板樣式

**解決方法**：
- 修改 CSS 樣式（第 14-561 行）
- 常用修改：
  - 主色調：搜尋 `#FF6B35` 並替換
  - 標題大小：搜尋 `font-size` 並調整
  - 邊框樣式：搜尋 `border` 並調整

---

## 📚 進階設定

### 啟用 Google Analytics（可選）

如果想追蹤儀表板使用情況，可以加入 Google Analytics：

1. 建立 Google Analytics 帳號和 Property
2. 取得 Measurement ID（G-XXXXXXXXXX）
3. 在 `index.html` 的 `<head>` 標籤中加入：

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🎉 完成！

恭喜你成功部署打卡儀表板！現在可以：

1. 📱 將網址分享給學員
2. 📊 觀察學員的打卡情況
3. 🎯 追蹤課程進度
4. 💪 陪伴學員養成習慣

**儀表板網址格式**：
```
https://YOUR_USERNAME.github.io/checkin-dashboard/
```

記得將這個網址加到：
- Google Form 的確認訊息
- LINE 群組的置頂訊息
- 課程網站的導覽列

祝你的陪跑班順利進行！🔥

---

**需要幫助？**
- GitHub Pages 官方文件：https://docs.github.com/pages
- GitHub 社群支援：https://github.community
