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
 * 計算單個學員的連續打卡天數
 * @param {string} studentName - 學員姓名
 * @return {number} 連續打卡天數
 */
function calculateConsecutiveDays(studentName) {
  if (!studentName) return 0;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName('表單回應');
  const data = responseSheet.getDataRange().getValues();

  // 過濾該學員且已完成的打卡記錄
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[2]; // C欄：姓名
    const date = row[3]; // D欄：打卡日期
    const status = row[4]; // E欄：是否完成

    if (name === studentName && status === "✅ 是，已完成") {
      records.push(new Date(date));
    }
  }

  if (records.length === 0) return 0;

  // 排序日期（從新到舊）
  records.sort((a, b) => b - a);

  // 計算連續天數
  let consecutiveDays = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latestDate = new Date(records[0]);
  latestDate.setHours(0, 0, 0, 0);

  // 如果最近打卡不是今天或昨天，則連續天數歸零
  const daysDiff = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));
  if (daysDiff > 1) return 0;

  // 從最近日期往回算連續天數
  for (let i = 1; i < records.length; i++) {
    const currentDate = new Date(records[i]);
    currentDate.setHours(0, 0, 0, 0);

    const previousDate = new Date(records[i - 1]);
    previousDate.setHours(0, 0, 0, 0);

    const diff = Math.floor((previousDate - currentDate) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  return consecutiveDays;
}

/**
 * 批量更新所有學員的連續打卡天數（優化版）
 * 一次讀取所有資料，批量計算並寫入，大幅提升效能
 *
 * 建議設定為每日自動執行 (使用 createMultipleDailyTriggers)
 */
function updateAllConsecutiveDays() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName('表單回應');
  const statsSheet = ss.getSheetByName('打卡統計');

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

  // 建立學員打卡記錄的 Map
  const studentRecords = new Map();

  for (let i = 1; i < responseData.length; i++) {
    const row = responseData[i];
    const name = row[2]; // C欄：姓名
    const date = row[3]; // D欄：打卡日期
    const status = row[4]; // E欄：是否完成

    if (status === "✅ 是，已完成") {
      if (!studentRecords.has(name)) {
        studentRecords.set(name, []);
      }
      studentRecords.get(name).push(new Date(date));
    }
  }

  // 計算每位學員的連續天數
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updateData = [];

  for (let i = 1; i < statsData.length; i++) {
    const studentName = statsData[i][0]; // A欄：姓名
    const records = studentRecords.get(studentName) || [];

    let consecutiveDays = 0;

    if (records.length > 0) {
      // 排序日期（從新到舊）
      records.sort((a, b) => b - a);

      const latestDate = new Date(records[0]);
      latestDate.setHours(0, 0, 0, 0);

      // 檢查最近打卡是否在昨天或今天
      const daysDiff = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        consecutiveDays = 1;

        // 計算連續天數
        for (let j = 1; j < records.length; j++) {
          const currentDate = new Date(records[j]);
          currentDate.setHours(0, 0, 0, 0);

          const previousDate = new Date(records[j - 1]);
          previousDate.setHours(0, 0, 0, 0);

          const diff = Math.floor((previousDate - currentDate) / (1000 * 60 * 60 * 24));

          if (diff === 1) {
            consecutiveDays++;
          } else {
            break;
          }
        }
      }
    }

    updateData.push([consecutiveDays]);
  }

  // 批次寫入連續打卡天數到 C 欄
  if (updateData.length > 0) {
    const range = statsSheet.getRange(2, 3, updateData.length, 1); // C2 開始
    range.setValues(updateData);
  }

  SpreadsheetApp.getUi().alert(
    '更新完成！\n\n已更新 ' + updateData.length + ' 位學員的連續打卡天數。'
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
