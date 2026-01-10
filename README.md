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
- **35天挑戰進度**：視覺化熱力圖，顯示每日打卡率
- **里程碑系統**：7天、14天、21天、28天、35天 各有專屬鼓勵語言
- **連續打卡王排行榜**：TOP 10 學員，金銀銅牌特殊樣式
- **每日亮點牆**：顯示今日所有學員的精彩分享
- **今日打卡動態**：即時顯示已打卡/未打卡學員名單
- **個人打卡查詢**：查看個人統計和完整打卡記錄
- **性能優化**：LocalStorage 緩存（5分鐘）、模組化載入

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
├── 課前操作指南.md                       # 課前設定步驟
├── index.html                          # 重定向頁面
├── dashboard-wired.html                # 主要儀表板（217 行，模組化）
├── css/                                # 樣式檔案
│   └── dashboard.css                   # 儀表板樣式（1324 行）
├── js/                                 # JavaScript 模組
│   ├── config.js                       # 配置常數（SHEET_ID, GID, 課程日期）
│   ├── cache.js                        # LocalStorage 緩存管理
│   ├── data.js                         # CSV 解析與資料載入
│   ├── dashboard.js                    # 業務邏輯與 UI 渲染（637 行）
│   └── main.js                         # 應用程式入口
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
- **模組化**：ES6 Modules（import/export）
- **架構設計**：Clean Code 原則，關注點分離
- **後端**：Google Apps Script
- **資料庫**：Google Sheets
- **部署**：GitHub Pages（免費）
- **UI 風格**：手繪風格（粗黑邊框、手寫陰影）

### 模組化架構

專案採用模組化設計，將 2331 行的單一 HTML 檔案重構為清晰的模組結構：

- **config.js** - 集中管理所有配置常數
- **cache.js** - LocalStorage 緩存邏輯
- **data.js** - CSV 解析與資料載入
- **dashboard.js** - 業務邏輯與 UI 渲染
- **main.js** - 應用程式入口與初始化

**優點**：
- ✅ 提高可維護性：每個模組職責單一
- ✅ 便於擴展：新增功能只需修改對應模組
- ✅ 便於除錯：問題定位更快速
- ✅ 程式碼重用：模組可在不同專案中使用

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

編輯 `js/config.js`：

```javascript
// Google Sheets 配置
export const SHEET_ID = 'YOUR_SHEET_ID';
export const STATS_GID = 'YOUR_STATS_GID';
export const HIGHLIGHTS_GID = 'YOUR_HIGHLIGHTS_GID';

// 課程日期配置
export const COURSE_START_DATE = new Date('2026-01-13');
export const TEST_TODAY_DATE = null; // 設為 null 使用真實日期

// 緩存配置
export const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘緩存
```

### 調整緩存時間

編輯 `js/config.js` 的 `CACHE_DURATION`：

```javascript
export const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘緩存
```

### 調整自動刷新頻率

編輯 `js/main.js`：

```javascript
setInterval(() => {
    console.log('自動刷新今日打卡狀態...');
    loadData(false);
}, 60 * 1000); // 1 分鐘自動刷新
```

### 里程碑鼓勵語言

里程碑的懸停提示文字設定在 `dashboard-wired.html` 的里程碑元素中：

- **7天** 🌱：完成第一週的間歇式日記，開始培養習慣！
- **14天** 🌿：掌握了萃取法的基本技巧，開始能從經驗中提煉價值
- **21天** 🌳：習慣已經成型，反思能力顯著提升！
- **28天** 🏆：建立了屬於自己的複盤系統，持續精進中
- **35天** ⭐：恭喜完成全程！你已經養成了終身受益的習慣

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
