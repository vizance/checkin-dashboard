# Google Form 日期自動預設為今天

## 問題

Google Form 的「日期」欄位無法自動預設為今天的日期，學員需要手動選擇。

---

## 解決方案比較

| 方案 | 優點 | 缺點 | 難度 |
|-----|------|------|------|
| **方案 1: Apps Script 動態連結** | 完全自動化 | 需要設定 | ⭐⭐ |
| **方案 2: 預填連結（每日更新）** | 簡單 | 需要每天更新連結 | ⭐ |
| **方案 3: 改用「簡答」欄位** | 自動帶入今天 | 學員可以亂改 | ⭐⭐⭐ |
| **方案 4: 移除日期欄位** | 最簡單 | 用時間戳記代替 | ⭐ |

---

## 方案 1: Apps Script 動態預填連結（推薦）⭐

### 原理

使用 Google Apps Script 建立一個「智能連結產生器」：
- 產生一個帶有今天日期的預填連結
- 學員點擊連結後，日期欄位自動填入今天

### 步驟 1: 取得表單欄位 ID

1. **開啟你的 Google Form**
   https://forms.gle/UKEqGguohbcN7uaC8

2. **點擊右上角「⋮」→「取得預先填寫的連結」**

3. **在「打卡日期」欄位隨便選一個日期**（例如 2025-01-01）

4. **點擊底部「取得連結」**

5. **複製連結**，應該類似：
   ```
   https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url&entry.123456789=2025-01-01
   ```

6. **找到 `entry.123456789`** 這個部分
   - `123456789` 就是「打卡日期」欄位的 ID
   - **記下這個數字**

### 步驟 2: 建立智能連結產生器

1. **開啟 Google Sheet**（打卡數據的那個）

2. **點擊「擴充功能」→「Apps Script」**

3. **在編輯器中新增以下代碼**：

```javascript
/**
 * 產生帶有今天日期的表單連結
 * @return {string} 預填今天日期的表單連結
 */
function getTodayFormLink() {
  // ⚠️ 請替換為你的表單 ID 和日期欄位 entry ID
  const FORM_ID = 'YOUR_FORM_ID';  // 從表單網址中取得
  const DATE_ENTRY_ID = '123456789';  // 步驟 1 取得的 entry ID

  // 取得今天的日期（格式：YYYY-MM-DD）
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  // 產生預填連結
  const url = `https://docs.google.com/forms/d/e/${FORM_ID}/viewform?usp=pp_url&entry.${DATE_ENTRY_ID}=${dateString}`;

  return url;
}

/**
 * 在 Sheet 中顯示今天的表單連結
 * 可以每天執行這個函數來更新連結
 */
function updateTodayFormLink() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 在「學員名單」工作表的 F1 儲存格顯示連結
  const sheet = ss.getSheetByName('學員名單');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('找不到「學員名單」工作表');
    return;
  }

  const url = getTodayFormLink();

  // 寫入連結
  sheet.getRange('F1').setValue('今日打卡連結');
  sheet.getRange('F2').setFormula(`=HYPERLINK("${url}", "點此打卡（日期已預填今天）")`);

  SpreadsheetApp.getUi().alert('今日打卡連結已更新！\n\n請到「學員名單」工作表的 F2 儲存格查看。');
}

/**
 * 建立每日自動觸發器（每天早上 6 點更新連結）
 */
function createDailyLinkTrigger() {
  // 刪除舊觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateTodayFormLink') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 建立新觸發器
  ScriptApp.newTrigger('updateTodayFormLink')
    .timeBased()
    .atHour(6)  // 每天早上 6 點
    .everyDays(1)
    .create();

  SpreadsheetApp.getUi().alert('已設定每日自動更新觸發器！\n\n每天早上 6 點會自動更新打卡連結。');
}
```

### 步驟 3: 設定參數

在代碼中替換：

1. **FORM_ID**：
   - 從你的表單網址取得
   - 網址格式：`https://docs.google.com/forms/d/e/[FORM_ID]/viewform`
   - 例如：`1FAIpQLSexample123`

2. **DATE_ENTRY_ID**：
   - 步驟 1 取得的數字
   - 例如：`123456789`

### 步驟 4: 執行

1. **手動執行一次** `updateTodayFormLink`
   - 會在「學員名單」工作表的 F2 產生今天的打卡連結

2. **（可選）設定自動觸發**
   - 執行 `createDailyLinkTrigger`
   - 每天早上 6 點自動更新連結

3. **分享連結給學員**
   - 從 F2 儲存格複製連結
   - 貼到 LINE 群組或課程網站
   - 學員點擊後日期已預填今天

---

## 方案 2: 每日預填連結（手動版）

如果你覺得 Apps Script 太複雜，可以用手動方式：

### 每天早上做一次：

1. **開啟 Google Form**
2. 點擊「⋮」→「取得預先填寫的連結」
3. 在「打卡日期」選今天
4. 點擊「取得連結」
5. 複製連結貼到 LINE 群組

**優點**：簡單
**缺點**：需要每天手動更新

---

## 方案 3: 改用「簡答」欄位 + Apps Script 自動填入

### 原理

把「日期」欄位改成「簡答」，用 Apps Script 自動帶入今天日期。

### 步驟

1. **修改 Google Form**：
   - 將「打卡日期」改為「簡答」類型
   - 說明文字：「此欄位會自動填入今天日期，無需修改」
   - 預設值設為今天（但 Google Form 不支援動態預設值）

2. **在 Apps Script 中處理**：
   ```javascript
   function onFormSubmit(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('表單回應');
     const lastRow = sheet.getLastRow();

     // 如果打卡日期欄位是空的，自動填入今天
     const dateCell = sheet.getRange(lastRow, 4);  // D 欄
     if (!dateCell.getValue()) {
       dateCell.setValue(new Date());
     }
   }
   ```

**優點**：學員不用選日期
**缺點**：學員可以填錯日期（雖然很少發生）

---

## 方案 4: 移除日期欄位（最簡單）⭐

### 原理

直接移除「打卡日期」欄位，改用「時間戳記」。

### 優點

- **最簡單**：學員不用選日期
- **最準確**：時間戳記就是提交時間
- **無法作弊**：學員無法填寫其他日期

### 缺點

- **無法補打卡**：學員忘記打卡就無法補

### 是否適合你？

如果你的規則是「當天就要打卡，不能補打」，這個方案最適合！

**修改方式**：
1. 在 Google Form 刪除「打卡日期」欄位
2. 在 Apps Script 或 Sheet 公式中，改用 A 欄（時間戳記）作為打卡日期

---

## 🎯 我的建議

### 對於你的情境：

**推薦方案 1（Apps Script 動態連結）**

**理由**：
1. ✅ 學員體驗最好（日期已預填，無需選擇）
2. ✅ 完全自動化（設定後不用管）
3. ✅ 仍可補打卡（學員可以手動改日期）
4. ✅ 資料準確（大部分情況下學員不會改）

**次選：方案 4（移除日期欄位）**

如果你不希望學員補打卡，這個最簡單。

---

## 📝 快速設定指南（方案 1）

1. ✅ 取得表單的 FORM_ID 和 DATE_ENTRY_ID
2. ✅ 複製 Apps Script 代碼到你的 Google Sheet
3. ✅ 替換 FORM_ID 和 DATE_ENTRY_ID
4. ✅ 執行 `updateTodayFormLink`
5. ✅ 從「學員名單」F2 複製連結
6. ✅ 分享給學員
7. ✅ （可選）執行 `createDailyLinkTrigger` 設定自動更新

---

## ❓ 常見問題

### Q: 學員可以手動改日期嗎？

**A**: 可以。預填連結只是「預設值」，學員仍可修改。如果想完全禁止，用方案 4。

### Q: 預填連結會過期嗎？

**A**: 不會。但日期是固定的，所以每天需要產生新連結。

### Q: 可以同時預填姓名嗎？

**A**: 可以！用同樣方式取得姓名欄位的 entry ID，在連結中加入 `&entry.XXXXX=學員姓名`

### Q: 如果學員忘記打卡，可以補打嗎？

**A**: 方案 1 可以（手動改日期）。方案 4 不行（時間戳記無法改）。

---

需要幫你設定嗎？告訴我你想用哪個方案！
