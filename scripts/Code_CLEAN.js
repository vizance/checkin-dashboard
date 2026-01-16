/**
 * 5週復盤陪跑班 - 打卡系統 Apps Script (正式版)
 *
 * 功能：
 * 1. 計算連續打卡天數
 * 2. 批量更新學員統計
 * 3. 自動觸發器管理
 * 4. 自訂選單（開啟試算表時自動載入）
 *
 * 使用方式：
 * 1. 將此檔案內容複製到 Google Apps Script 編輯器
 * 2. 重新開啟試算表，會看到「打卡系統」選單
 * 3. 從選單中執行所有操作
 *
 * 課程開始時：
 * 1. 選單 > 🔧 工具 > ⚡ 設定所有公式
 * 2. 選單 > ⚙️ 自動化設定 > ✅ 設定自動觸發器 (3次/天)
 */

// ============================================
// 測試模式設定
// ============================================

// 測試模式：設為 null 使用真實日期，或設為特定日期進行測試
// 正式上線時請設為 null
// 例如：const TEST_TODAY_DATE = new Date('2025-12-21');
const TEST_TODAY_DATE = new Date('2025-12-21'); // 測試模式：模擬今天是 12/21

// ============================================
// 自訂選單（打開試算表時自動載入）
// ============================================

/**
 * 當試算表開啟時自動執行，創建自訂選單
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('📋 打卡系統')
    .addItem('🔄 更新連續天數', 'updateAllConsecutiveDays')
    .addSeparator()
    .addSubMenu(ui.createMenu('📊 每週報告')
      .addItem('📝 產生本週報告預覽', 'generateWeeklyReportPreview')
      .addItem('✅ 確認寄送本週報告', 'sendWeeklyReports')
      .addSeparator()
      .addItem('📧 測試寄送（寄給我）', 'sendTestWeeklyReport'))
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ 自動化設定')
      .addItem('✅ 設定自動觸發器 (3次/天)', 'createMultipleDailyTriggers')
      .addItem('設定自動觸發器 (2次/天)', 'createTwiceDailyTriggers')
      .addSeparator()
      .addItem('查看目前觸發器', 'viewCurrentTriggers')
      .addItem('刪除所有觸發器', 'deleteAllTriggers'))
    .addSeparator()
    .addSubMenu(ui.createMenu('🔧 工具')
      .addItem('檢查工作表設定', 'checkRequiredSheets')
      .addItem('⚡ 設定所有公式', 'setupStatsFormulas'))
    .addToUi();
}

// ============================================
// 工具函數
// ============================================

/**
 * 檢查必要的工作表是否存在
 * 執行此函數可以快速診斷工作表配置問題
 */
function checkRequiredSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const allSheets = ss.getSheets();
  const sheetNames = allSheets.map(sheet => sheet.getName());

  let message = '📋 目前的工作表清單：\n\n';
  sheetNames.forEach((name, index) => {
    message += `${index + 1}. "${name}"\n`;
  });

  const requiredSheets = ['表單回應', '學員名單', '打卡統計', '每日亮點牆'];
  message += '\n\n✅ 必要的工作表：\n';

  let allExist = true;
  requiredSheets.forEach(name => {
    const exists = sheetNames.includes(name);
    message += `${exists ? '✅' : '❌'} ${name}\n`;
    if (!exists) allExist = false;
  });

  if (!allExist) {
    message += '\n⚠️ 有工作表不存在或名稱不正確！\n請檢查工作表名稱是否完全一致（包含空格）。';
  } else {
    message += '\n✅ 所有必要工作表都存在！';
  }

  ui.alert('工作表檢查結果', message, ui.ButtonSet.OK);
}

/**
 * 自動設定「打卡統計」工作表的所有公式
 * 包含：累計打卡天數、最近打卡日期、里程碑（7/14/21/28/35天）
 */
function setupStatsFormulas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const statsSheet = ss.getSheetByName('打卡統計');

  if (!statsSheet) {
    SpreadsheetApp.getUi().alert('❌ 錯誤', '找不到「打卡統計」工作表！', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const lastRow = statsSheet.getLastRow();

  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('⚠️ 提醒', '「打卡統計」工作表沒有學員資料！\n請先在「學員名單」新增學員。', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // 設定公式的範圍（從第 2 行開始到最後一行）
  const numRows = lastRow - 1;

  // B欄：累計打卡天數（只計算「已完成」的打卡記錄）
  const totalDaysFormula = '=COUNTIFS(表單回應!$C:$C, A2, 表單回應!$E:$E, "✅ 是，已完成")';
  const totalDaysRange = statsSheet.getRange(2, 2, numRows, 1);
  totalDaysRange.setFormula(totalDaysFormula);

  // D欄：最近打卡日期（只計算「已完成」的打卡記錄）
  const lastDateFormula = '=IFERROR(MAXIFS(表單回應!$D:$D, 表單回應!$C:$C, A2, 表單回應!$E:$E, "✅ 是，已完成"), "")';
  const lastDateRange = statsSheet.getRange(2, 4, numRows, 1);
  lastDateRange.setFormula(lastDateFormula);

  // E欄：7天里程碑
  const milestone7Formula = '=IF(C2>=7, "🏆", "-")';
  const milestone7Range = statsSheet.getRange(2, 5, numRows, 1);
  milestone7Range.setFormula(milestone7Formula);

  // F欄：14天里程碑
  const milestone14Formula = '=IF(C2>=14, "🏆", "-")';
  const milestone14Range = statsSheet.getRange(2, 6, numRows, 1);
  milestone14Range.setFormula(milestone14Formula);

  // G欄：21天里程碑
  const milestone21Formula = '=IF(C2>=21, "🏆", "-")';
  const milestone21Range = statsSheet.getRange(2, 7, numRows, 1);
  milestone21Range.setFormula(milestone21Formula);

  // H欄：28天里程碑
  const milestone28Formula = '=IF(C2>=28, "🏆", "-")';
  const milestone28Range = statsSheet.getRange(2, 8, numRows, 1);
  milestone28Range.setFormula(milestone28Formula);

  // I欄：35天里程碑（如果有的話）
  if (statsSheet.getLastColumn() >= 9) {
    const milestone35Formula = '=IF(C2>=35, "🏆", "-")';
    const milestone35Range = statsSheet.getRange(2, 9, numRows, 1);
    milestone35Range.setFormula(milestone35Formula);
  }

  SpreadsheetApp.getUi().alert(
    '✅ 公式設定完成！',
    '已自動設定以下公式：\n\n' +
    '✅ B欄：累計打卡天數\n' +
    '✅ D欄：最近打卡日期\n' +
    '✅ E欄：7天里程碑\n' +
    '✅ F欄：14天里程碑\n' +
    '✅ G欄：21天里程碑\n' +
    '✅ H欄：28天里程碑\n' +
    '✅ I欄：35天里程碑\n\n' +
    '影響 ' + numRows + ' 位學員。',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================
// 核心功能：連續打卡天數計算
// ============================================

/**
 * 批量更新所有學員的連續打卡天數（最終修正版）
 *
 * 修正內容：
 * 1. 使用 Set 去除同一天的重複打卡記錄
 * 2. 改良日期解析，避免時區問題
 * 3. 自動過濾 TEST_TODAY_DATE 之後的測試數據
 *
 * 建議設定為每日自動執行 (使用 createMultipleDailyTriggers)
 */
function updateAllConsecutiveDays() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName('表單回應');
  const statsSheet = ss.getSheetByName('打卡統計');

  Logger.log('==================== 開始批量更新連續打卡天數 ====================');

  // 先清空 C 欄的所有內容和公式（保留標題）
  const lastRow = statsSheet.getLastRow();
  if (lastRow > 1) {
    const clearRange = statsSheet.getRange(2, 3, lastRow - 1, 1); // C2 開始清空
    clearRange.clearContent();
  }

  // 讀取所有表單回應資料
  const responseData = responseSheet.getDataRange().getValues();

  // 讀取學員名單
  const statsData = statsSheet.getDataRange().getValues();

  // 【Debug】顯示讀取到的資料行數
  Logger.log('從「表單回應」讀取到 ' + (responseData.length - 1) + ' 筆資料（不含標題）');
  Logger.log('從「打卡統計」讀取到 ' + (statsData.length - 1) + ' 位學員（不含標題）');

  // 【Debug】顯示前 3 筆表單回應資料
  if (responseData.length > 1) {
    Logger.log('--- 前 3 筆表單回應資料範例 ---');
    for (let i = 1; i <= Math.min(3, responseData.length - 1); i++) {
      const row = responseData[i];
      Logger.log('  第 ' + i + ' 筆:');
      Logger.log('    C欄(姓名): ' + row[2]);
      Logger.log('    D欄(打卡日期): ' + row[3]);
      Logger.log('    E欄(是否完成): ' + row[4]);
    }
  }

  // 【修正】建立學員打卡記錄的 Map（使用 Set 儲存唯一日期）
  const studentRecords = new Map();

  // 【修正】設定截止日期：只計算測試日期當天或之前的打卡記錄
  const today = TEST_TODAY_DATE ? new Date(TEST_TODAY_DATE) : new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setHours(23, 59, 59, 999); // 設為當天的最後一刻

  Logger.log('今天日期: ' + Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
  Logger.log('截止日期: ' + Utilities.formatDate(cutoffDate, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'));
  Logger.log('（只計算截止日期之前的打卡記錄，忽略之後的測試數據）');

  let filteredCount = 0;

  for (let i = 1; i < responseData.length; i++) {
    const row = responseData[i];
    const name = row[2]; // C欄：姓名
    const dateValue = row[3]; // D欄：打卡日期
    const status = row[4]; // E欄：是否完成

    if (status === "✅ 是，已完成") {
      if (!studentRecords.has(name)) {
        studentRecords.set(name, new Set()); // 改用 Set
      }

      // 【修正】將日期標準化為 YYYY-MM-DD 字串，去除重複
      let normalizedDate;
      let dateObj;

      if (dateValue instanceof Date) {
        dateObj = new Date(dateValue);
        normalizedDate = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else if (typeof dateValue === 'string') {
        // 提取日期部分（例如 "2025/12/7 下午 9:52:45" -> "2025-12-07"）
        const datePart = dateValue.trim().split(' ')[0];
        const parts = datePart.split('/');

        if (parts.length === 3) {
          const year = parts[0];
          const month = parts[1].padStart(2, '0');
          const day = parts[2].padStart(2, '0');
          normalizedDate = year + '-' + month + '-' + day;

          // 建立 Date 物件用於比較
          dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }

      // 【修正】過濾掉截止日期之後的記錄
      if (normalizedDate && dateObj && dateObj <= cutoffDate) {
        studentRecords.get(name).add(normalizedDate); // 使用 add 而非 push
      } else if (dateObj && dateObj > cutoffDate) {
        filteredCount++;
      }
    }
  }

  Logger.log('已處理 ' + studentRecords.size + ' 位學員的打卡記錄');
  Logger.log('已過濾掉 ' + filteredCount + ' 筆截止日期之後的記錄');

  // 【Debug】顯示 studentRecords 的內容
  Logger.log('==================== studentRecords 內容 ====================');
  let recordIndex = 0;
  for (const [name, dates] of studentRecords) {
    if (recordIndex < 3) {
      Logger.log('  ' + name + ': ' + dates.size + ' 天打卡');
      Logger.log('    日期: ' + Array.from(dates).join(', '));
    }
    recordIndex++;
  }
  if (studentRecords.size === 0) {
    Logger.log('⚠️ studentRecords 是空的！沒有讀到任何打卡記錄！');
    Logger.log('可能原因：');
    Logger.log('  1. 「表單回應」工作表沒有資料');
    Logger.log('  2. E 欄的狀態不是「✅ 是，已完成」');
    Logger.log('  3. 所有打卡日期都在截止日期之後');
  }
  Logger.log('===========================================================');

  // 計算每位學員的最高連續打卡天數
  today.setHours(0, 0, 0, 0);

  const updateData = [];

  Logger.log('==================== 開始計算連續天數 ====================');
  Logger.log('statsData 總共有 ' + (statsData.length - 1) + ' 位學員（不含標題）');

  for (let i = 1; i < statsData.length; i++) {
    const studentName = statsData[i][0]; // A欄：姓名
    const dateSet = studentRecords.get(studentName) || new Set(); // 改用 Set

    let maxConsecutiveDays = 0;

    // 【Debug】顯示每位學員的資料
    if (i <= 3) {
      Logger.log('--- 處理學員 ' + i + ': ' + studentName + ' ---');
      Logger.log('  從 studentRecords 讀到的打卡天數: ' + dateSet.size);
    }

    if (dateSet.size > 0) { // 改用 size 而非 length
      // 【修正】將日期字串轉換為 Date 物件並排序（從舊到新）
      const sortedDates = Array.from(dateSet)
        .map(function(dateStr) {
          const parts = dateStr.split('-');
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        })
        .sort(function(a, b) { return a - b; }); // 從舊到新排序

      // 【Debug】記錄前 3 位學員的詳細資訊
      if (i <= 3) {
        Logger.log('--- 學員: ' + studentName + ' ---');
        Logger.log('  不重複打卡日期數: ' + dateSet.size);
        Logger.log('  最舊打卡: ' + Utilities.formatDate(sortedDates[0], Session.getScriptTimeZone(), 'yyyy-MM-dd'));
        Logger.log('  最新打卡: ' + Utilities.formatDate(sortedDates[sortedDates.length - 1], Session.getScriptTimeZone(), 'yyyy-MM-dd'));
      }

      // 計算最高連續打卡天數
      maxConsecutiveDays = 1; // 至少有 1 天
      let currentConsecutive = 1;

      for (let j = 1; j < sortedDates.length; j++) {
        const currentDate = new Date(sortedDates[j]);
        currentDate.setHours(0, 0, 0, 0);

        const previousDate = new Date(sortedDates[j - 1]);
        previousDate.setHours(0, 0, 0, 0);

        const diff = Math.floor((currentDate - previousDate) / (1000 * 60 * 60 * 24));

        // 【Debug】記錄前 3 位學員的前 5 天比較
        if (i <= 3 && j <= 5) {
          Logger.log(
            '  第 ' + (j + 1) + ' 天: ' +
            Utilities.formatDate(previousDate, Session.getScriptTimeZone(), 'yyyy-MM-dd') +
            ' -> ' +
            Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyy-MM-dd') +
            ' = 差距 ' + diff + ' 天'
          );
        }

        if (diff === 1) {
          // 連續，增加當前連續計數
          currentConsecutive++;
          maxConsecutiveDays = Math.max(maxConsecutiveDays, currentConsecutive);

          if (i <= 3 && j <= 5) {
            Logger.log('    ✅ 連續！當前連續段: ' + currentConsecutive + ' 天, 最高紀錄: ' + maxConsecutiveDays + ' 天');
          }
        } else {
          // 中斷，重新開始計算
          if (i <= 3 && j <= 5) {
            Logger.log('    ❌ 中斷！重新開始計算（之前最高: ' + maxConsecutiveDays + ' 天）');
          }
          currentConsecutive = 1;
        }
      }

      if (i <= 3) {
        Logger.log('  🏆 最高連續打卡天數: ' + maxConsecutiveDays + ' 天');
      }
    }

    updateData.push([maxConsecutiveDays]);
  }

  // 批次寫入連續打卡天數到 C 欄
  if (updateData.length > 0) {
    const range = statsSheet.getRange(2, 3, updateData.length, 1); // C2 開始
    range.setValues(updateData);
    Logger.log('✅ 已更新 ' + updateData.length + ' 位學員的連續打卡天數');
  }

  Logger.log('==================== 批量更新完成 ====================');

  SpreadsheetApp.getUi().alert(
    '✅ 更新完成！',
    '已更新 ' + updateData.length + ' 位學員的連續打卡天數。\n' +
    '已過濾掉 ' + filteredCount + ' 筆測試數據。\n\n' +
    '詳細日誌請查看：Apps Script 編輯器 → View → Executions',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================
// 自動觸發器管理
// ============================================

/**
 * 建立每日 3 次觸發器（推薦設定）
 * 執行此函數來建立觸發器，只需執行一次
 *
 * 觸發時間：早上 8:00、下午 2:00、晚上 11:00
 */
function createMultipleDailyTriggers() {
  const ui = SpreadsheetApp.getUi();

  // 先刪除所有舊的觸發器（避免重複）
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateAllConsecutiveDays') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  try {
    // 觸發器 1: 早上 8 點
    ScriptApp.newTrigger('updateAllConsecutiveDays')
      .timeBased()
      .atHour(8)
      .everyDays(1)
      .create();

    // 觸發器 2: 下午 2 點
    ScriptApp.newTrigger('updateAllConsecutiveDays')
      .timeBased()
      .atHour(14)
      .everyDays(1)
      .create();

    // 觸發器 3: 晚上 11 點
    ScriptApp.newTrigger('updateAllConsecutiveDays')
      .timeBased()
      .atHour(23)
      .everyDays(1)
      .create();

    ui.alert(
      '✅ 觸發器設定成功！\n\n' +
      '已建立 3 個每日觸發器：\n' +
      '• 早上 8:00\n' +
      '• 下午 2:00\n' +
      '• 晚上 11:00\n\n' +
      '系統會在這些時間自動更新連續打卡天數。'
    );
  } catch (error) {
    ui.alert('❌ 設定失敗：' + error.message);
  }
}

/**
 * 建立每日 2 次觸發器（簡化版）
 * 觸發時間：早上 9:00、晚上 11:00
 */
function createTwiceDailyTriggers() {
  const ui = SpreadsheetApp.getUi();

  // 先刪除所有舊的觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateAllConsecutiveDays') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  try {
    // 觸發器 1: 早上 9 點
    ScriptApp.newTrigger('updateAllConsecutiveDays')
      .timeBased()
      .atHour(9)
      .everyDays(1)
      .create();

    // 觸發器 2: 晚上 11 點
    ScriptApp.newTrigger('updateAllConsecutiveDays')
      .timeBased()
      .atHour(23)
      .everyDays(1)
      .create();

    ui.alert(
      '✅ 觸發器設定成功！\n\n' +
      '已建立 2 個每日觸發器：\n' +
      '• 早上 9:00\n' +
      '• 晚上 11:00\n\n' +
      '系統會在這些時間自動更新連續打卡天數。'
    );
  } catch (error) {
    ui.alert('❌ 設定失敗：' + error.message);
  }
}

/**
 * 刪除所有自動觸發器
 */
function deleteAllTriggers() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '確認刪除',
    '確定要刪除所有自動觸發器嗎？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('已取消操作。');
    return;
  }

  const triggers = ScriptApp.getProjectTriggers();
  let count = 0;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateAllConsecutiveDays') {
      ScriptApp.deleteTrigger(trigger);
      count++;
    }
  });

  ui.alert('✅ 已刪除 ' + count + ' 個觸發器。');
}

/**
 * 查看目前的觸發器設定
 */
function viewCurrentTriggers() {
  const ui = SpreadsheetApp.getUi();
  const triggers = ScriptApp.getProjectTriggers();

  let message = '⏰ 目前的觸發器：\n\n';
  let found = false;

  triggers.forEach((trigger, index) => {
    if (trigger.getHandlerFunction() === 'updateAllConsecutiveDays') {
      found = true;
      message += `${index + 1}. 時間觸發器 (函數：updateAllConsecutiveDays)\n`;
    }
  });

  if (!found) {
    message = '目前沒有設定任何觸發器。\n\n建議執行 createMultipleDailyTriggers() 建立自動觸發器。';
  } else {
    message += '\n\n💡 如需修改觸發器設定：\n';
    message += '1. 執行 deleteAllTriggers() 刪除現有觸發器\n';
    message += '2. 執行 createMultipleDailyTriggers() 建立新觸發器';
  }

  ui.alert(message);
}
