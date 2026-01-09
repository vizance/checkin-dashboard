# 5週復盤陪跑班 - 每日打卡系統

35 天養成習慣，使用 Google Form + Google Sheet + 視覺化儀表板打造的完整打卡系統。

## 📋 系統架構

```
學員打卡 (Google Form)
    ↓
資料處理 (Google Sheet + Apps Script)
    ↓
視覺化呈現 (Vibe 儀表板)
```

## ✨ 功能特色

### 📝 Google Form 表單
- 姓名下拉選單
- 日期選擇（可自動預填今天）
- 完成狀態選擇
- 一句話亮點（50 字限制）
- 萃取法記錄
- 額外分享區

### 📊 Google Sheet 後台
- **表單回應**：自動記錄所有打卡資料
- **學員名單**：管理學員資訊
- **打卡統計**：即時計算累計天數、連續天數、里程碑
- **每日亮點牆**：自動彙整所有學員的精彩分享

### 🎨 Vibe 儀表板（Wired 手繪風格）
- **整體進度看板**：課程天數、學員數、今日打卡率
- **連續打卡王排行榜**：TOP 10 學員，金銀銅牌特殊樣式
- **每日亮點牆**：顯示最近 3 天的精彩分享
- **個人打卡查詢**：查看個人統計和最近 7 天記錄
- **性能優化**：LocalStorage 緩存、只顯示近期資料

## 🚀 快速開始

### Phase 1: 設定 Google Form + Sheet

請參考 [`docs/Phase1-完整指南.md`](docs/Phase1-完整指南.md)

**步驟摘要：**
1. 建立 Google Form 表單
2. 連結到 Google Sheet
3. 建立 4 個工作表：表單回應、學員名單、打卡統計、每日亮點牆
4. 設定公式和 Apps Script
5. 產生測試資料並驗證
6. 設定自動觸發器
7. 產生公開 CSV 連結

### Phase 2: 部署儀表板

請參考 [`docs/部署指南-GitHub-Pages.md`](docs/部署指南-GitHub-Pages.md)

**步驟摘要：**
1. 修改 `dashboard-wired.html` 的 SHEET_ID 和 GID
2. 推送到 GitHub
3. 啟用 GitHub Pages
4. 分享儀表板網址給學員

## 📁 檔案結構

```
vibeCoding_dailyCheckIn/
├── README.md                           # 專案說明
├── dashboard-wired.html                # 儀表板（推薦版本）
├── docs/                               # 文件資料夾
│   ├── Phase1-完整指南.md               # Phase 1 設定指南
│   ├── 部署指南-GitHub-Pages.md         # 部署指南
│   └── Google-Form-自動日期設定.md      # 自動日期功能
├── scripts/                            # 腳本資料夾
│   ├── apps-script-code-optimized.js   # 優化版 Apps Script
│   └── 設定多個自動觸發器.js             # 觸發器設定腳本
└── dashboards/                         # 其他儀表板版本
    ├── dashboard-chakra.html
    ├── dashboard-chakra-fast.html
    └── dashboard-nes.html
```

## 🎯 適用場景

- ✅ 35 天習慣養成計畫
- ✅ 課程學習打卡系統
- ✅ 團隊日報系統
- ✅ 社群活動追蹤
- ✅ 支援 100+ 學員

## 💡 設計理念

### 簡單大方
- 使用手繪風格（Wired Elements）
- 粗體大字，清晰易讀
- 橘色主色調 (#FF6B35) + 深灰黑邊框 (#2C3E50)

### 效能優先
- LocalStorage 緩存（5 分鐘）
- 只顯示最近 3 天的亮點
- 10 分鐘自動刷新
- 並行載入資料

### 用戶體驗
- 金銀銅牌特殊樣式
- 載入動畫停止機制
- 響應式設計（支援手機）
- 即時統計更新

## 🔧 技術棧

- **前端**：純 HTML/CSS/JavaScript（無框架）
- **後端**：Google Apps Script
- **資料庫**：Google Sheets
- **部署**：GitHub Pages（免費）
- **UI 風格**：手繪風格（粗黑邊框、手寫陰影）

## 📈 效能表現

| 項目 | 數據 |
|-----|------|
| 支援學員數 | 100+ |
| 總記錄數 | 3,500+ (35天×100人) |
| 首次載入時間 | < 2 秒 |
| 緩存載入時間 | < 0.5 秒 |
| 資料更新頻率 | 每 10 分鐘 |
| Apps Script 執行時間 | 5-10 秒 |

## ⚙️ 配置說明

### 修改儀表板配置

編輯 `dashboard-wired.html` 的第 627-634 行：

```javascript
const SHEET_ID = 'YOUR_SHEET_ID';
const STATS_GID = 'YOUR_STATS_GID';
const HIGHLIGHTS_GID = 'YOUR_HIGHLIGHTS_GID';
const COURSE_START_DATE = new Date('2026-01-03');
```

### 調整緩存時間

第 663 行：

```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘緩存
```

### 調整自動刷新頻率

第 996 行：

```javascript
setInterval(() => loadData(false), 10 * 60 * 1000); // 10 分鐘
```

### 調整亮點牆顯示天數

第 786-788 行：

```javascript
const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // 顯示最近 3 天
```

## 🎨 其他儀表板版本

除了推薦的 Wired 手繪風格，還提供其他設計風格：

- **dashboard-chakra.html**：Chakra UI 現代風格（藍色漸層）
- **dashboard-chakra-fast.html**：Chakra UI + 性能優化版
- **dashboard-nes.html**：8-bit 像素復古風格

## 📝 授權

MIT License - 自由使用、修改、分享

## 🙏 致謝

- [Google Forms](https://forms.google.com) - 表單系統
- [Google Sheets](https://sheets.google.com) - 資料處理
- [GitHub Pages](https://pages.github.com) - 免費部署
- 手繪風格靈感來自 [Wired Elements](https://github.com/rough-stuff/wired-elements)

---

Made with ❤️ for **vibeCoding 復盤陪跑班**
