/**
 * 5週復盤陪跑班 - 打卡系統 Apps Script (完整版)
 *
 * 功能：
 * 1. 計算連續打卡天數
 * 2. 批量更新學員統計
 * 3. 生成測試資料
 * 4. 自動觸發器管理
 * 5. 自訂選單（開啟試算表時自動載入）
 *
 * 使用方式：
 * 1. 將此檔案內容複製到 Google Apps Script 編輯器
 * 2. 重新開啟試算表，會看到「打卡系統」選單
 * 3. 從選單中執行所有操作
 *
 * 課程開始前：
 * 1. 選單 > 測試資料 > 生成 35 天完美測試資料 (50人)
 * 2. 選單 > 更新連續天數
 * 3. 測試完成後：選單 > 測試資料 > 清空所有測試資料
 * 4. 輸入真實學員名單：選單 > 自動化設定 > 設定自動觸發器 (3次/天)
 */

// ============================================
// 自訂選單（打開試算表時自動載入）
// ============================================

/**
 * 當試算表開啟時自動執行，創建自訂選單
 * 這樣你就不用每次都進 Apps Script 編輯器了！
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('📋 打卡系統')
    .addItem('🔄 更新連續天數', 'updateAllConsecutiveDays')
    .addSeparator()
    .addSubMenu(ui.createMenu('🧪 測試資料')
      .addItem('生成 5 人測試資料', 'generateTestData5')
      .addItem('生成 50 人測試資料', 'generateTestData50')
      .addItem('生成 100 人測試資料', 'generateTestData100')
      .addSeparator()
      .addItem('生成 35 天完美測試資料 (50人)', 'generateTestData35DaysPerfect')
      .addSeparator()
      .addItem('⚠️ 清空所有測試資料', 'clearTestData'))
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
      .addItem('一鍵完整初始化', 'quickSetup'))
    .addToUi();
}

/**
 * 一鍵完整初始化（課程開始前使用）
 * 包含：生成測試資料 + 更新統計 + 設定自動觸發器
 */
function quickSetup() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '一鍵初始化',
    '這將會執行以下操作：\n\n' +
    '1. 生成 50 位學員的 35 天完美測試資料\n' +
    '2. 更新所有學員的連續打卡天數\n' +
    '3. 設定每日 3 次自動觸發器 (8:00, 14:00, 23:00)\n\n' +
    '⚠️ 如果已有測試資料，請先清空\n\n' +
    '是否繼續？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('已取消操作。');
    return;
  }

  // 1. 檢查工作表
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const requiredSheets = ['表單回應', '學員名單', '打卡統計', '每日亮點牆'];
  let allExist = true;

  requiredSheets.forEach(name => {
    if (!ss.getSheetByName(name)) {
      allExist = false;
    }
  });

  if (!allExist) {
    ui.alert('❌ 初始化失敗',
      '找不到必要的工作表！\n請先執行「檢查工作表設定」診斷問題。',
      ui.ButtonSet.OK);
    return;
  }

  // 2. 生成測試資料
  ui.alert('步驟 1/3：生成測試資料...');
  generateTestData35DaysPerfect(50);

  // 3. 更新連續天數
  Utilities.sleep(2000); // 等待 2 秒
  ui.alert('步驟 2/3：更新連續天數...');
  updateAllConsecutiveDays();

  // 4. 設定自動觸發器
  Utilities.sleep(2000);
  ui.alert('步驟 3/3：設定自動觸發器...');
  createMultipleDailyTriggersQuiet();

  ui.alert(
    '✅ 初始化完成！',
    '系統已完成以下設定：\n\n' +
    '✅ 生成 50 位學員的 35 天測試資料\n' +
    '✅ 更新所有學員的連續天數\n' +
    '✅ 設定每日 3 次自動觸發器\n\n' +
    '現在可以測試儀表板了！',
    ui.ButtonSet.OK
  );
}

/**
 * 靜默版本的觸發器設定（用於自動化流程）
 */
function createMultipleDailyTriggersQuiet() {
  // 先刪除所有舊的觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateAllConsecutiveDays') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 建立 3 個觸發器
  ScriptApp.newTrigger('updateAllConsecutiveDays')
    .timeBased().atHour(8).everyDays(1).create();

  ScriptApp.newTrigger('updateAllConsecutiveDays')
    .timeBased().atHour(14).everyDays(1).create();

  ScriptApp.newTrigger('updateAllConsecutiveDays')
    .timeBased().atHour(23).everyDays(1).create();
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
// 測試資料生成
// ============================================

/**
 * 生成測試資料（優化版，支援自訂學員數量）
 * @param {number} numStudents - 學員數量（預設 100）
 */
function generateTestData(numStudents = 100) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName('表單回應');
  const studentListSheet = ss.getSheetByName('學員名單');

  // 檢查必要的工作表是否存在
  if (!responseSheet || !studentListSheet) {
    SpreadsheetApp.getUi().alert(
      '❌ 錯誤',
      '找不到必要的工作表！\n請執行 checkRequiredSheets() 檢查工作表名稱。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  // 先清空學員名單
  const lastRow = studentListSheet.getLastRow();
  if (lastRow > 1) {
    const range = studentListSheet.getRange(2, 1, lastRow - 1, studentListSheet.getLastColumn());
    range.clearContent();
  }

  // 產生學員名單
  const studentNames = [];
  for (let i = 1; i <= numStudents; i++) {
    const name = `學員${String(i).padStart(3, '0')}`; // 學員001, 學員002...
    studentNames.push(name);
    studentListSheet.appendRow([name, '2025-01-13', '在班', '']);
  }

  // 定義不同的打卡模式（隨機分配給學員）
  const patterns = [
    { days: 35, skipRate: 0 },      // 完美打卡
    { days: 35, skipRate: 0.05 },   // 偶爾漏打（95% 出席率）
    { days: 30, skipRate: 0.1 },    // 經常漏打（90% 出席率）
    { days: 25, skipRate: 0.15 },   // 較多漏打（85% 出席率）
    { days: 20, skipRate: 0.2 }     // 常漏打（80% 出席率）
  ];

  const methods = [
    '📝 ORID 情緒萃取',
    '🎯 PAR 工作萃取',
    '📸 相片簿生活萃取',
    '🎙️ AI Podcast 訪談',
    '⏳ 只記錄，尚未萃取'
  ];

  const highlights = [
    '今天用 ORID 釐清了對專案的焦慮感，發現核心是溝通問題',
    '透過 PAR 整理了今天的會議重點，發現自己進步了',
    '用相片簿記錄了美好的一天，心情變好了',
    '今天和 AI 對談，挖掘出深層的想法',
    '簡單記錄了今天的三件事，感覺很踏實',
    '發現自己在情緒管理上有明顯進步',
    '今天的工作效率提升了，找到了新的工作方法',
    '透過復盤看到自己的成長軌跡，很有成就感'
  ];

  let totalRecords = 0;
  const batchData = [];

  // 為每位學員產生資料
  studentNames.forEach((name) => {
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    for (let i = pattern.days - 1; i >= 0; i--) {
      // 根據 skipRate 決定是否跳過
      if (Math.random() < pattern.skipRate) {
        continue;
      }

      const date = new Date();
      date.setDate(date.getDate() - i);

      const timestamp = new Date(date);
      timestamp.setHours(20 + Math.floor(Math.random() * 3));
      timestamp.setMinutes(Math.floor(Math.random() * 60));

      const method = methods[Math.floor(Math.random() * methods.length)];
      const highlight = highlights[Math.floor(Math.random() * highlights.length)];
      const extraMessage = Math.random() > 0.5 ? '謝謝同學們的鼓勵！' : '';

      batchData.push([
        timestamp,
        name + '@gmail.com',
        name,
        date,
        '✅ 是，已完成',
        highlight,
        method,
        extraMessage
      ]);

      totalRecords++;
    }
  });

  // 批次寫入資料
  if (batchData.length > 0) {
    const range = responseSheet.getRange(
      responseSheet.getLastRow() + 1,
      1,
      batchData.length,
      8
    );
    range.setValues(batchData);
  }

  SpreadsheetApp.getUi().alert(
    '測試資料已產生！\n\n' +
    '學員數量：' + numStudents + ' 位\n' +
    '打卡記錄：' + totalRecords + ' 筆\n' +
    '平均出席率：約 85-95%\n\n' +
    '記得執行 updateAllConsecutiveDays() 來更新連續天數！'
  );
}

/**
 * 快速生成測試資料的便捷函數
 */
function generateTestData5() {
  generateTestData(5);
}

function generateTestData50() {
  generateTestData(50);
}

function generateTestData100() {
  generateTestData(100);
}

/**
 * 生成 35 天完美連續打卡的測試資料
 * 所有學員都會有完整的 35 天打卡記錄，不跳過任何一天
 * @param {number} numStudents - 學員數量（預設 50）
 */
function generateTestData35DaysPerfect(numStudents = 50) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName('表單回應');
  const studentListSheet = ss.getSheetByName('學員名單');

  if (!responseSheet || !studentListSheet) {
    SpreadsheetApp.getUi().alert(
      '❌ 錯誤',
      '找不到必要的工作表！\n請執行 checkRequiredSheets() 檢查工作表名稱。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  // 先清空學員名單
  const lastRow = studentListSheet.getLastRow();
  if (lastRow > 1) {
    const range = studentListSheet.getRange(2, 1, lastRow - 1, studentListSheet.getLastColumn());
    range.clearContent();
  }

  // 產生學員名單
  const studentNames = [];
  for (let i = 1; i <= numStudents; i++) {
    const name = `學員${String(i).padStart(3, '0')}`;
    studentNames.push(name);
    studentListSheet.appendRow([name, '2025-01-13', '在班', '']);
  }

  const methods = [
    '📝 ORID 情緒萃取',
    '🎯 PAR 工作萃取',
    '📸 相片簿生活萃取',
    '🎙️ AI Podcast 訪談',
    '⏳ 只記錄，尚未萃取'
  ];

  const highlights = [
    '今天用 ORID 釐清了對專案的焦慮感，發現核心是溝通問題',
    '透過 PAR 整理了今天的會議重點，發現自己進步了',
    '用相片簿記錄了美好的一天，心情變好了',
    '今天和 AI 對談，挖掘出深層的想法',
    '簡單記錄了今天的三件事，感覺很踏實',
    '發現自己在情緒管理上有明顯進步',
    '今天的工作效率提升了，找到了新的工作方法',
    '透過復盤看到自己的成長軌跡，很有成就感'
  ];

  let totalRecords = 0;
  const batchData = [];

  // 為每位學員產生 35 天完美打卡資料
  studentNames.forEach((name) => {
    for (let i = 34; i >= 0; i--) { // 從第 34 天前開始（總共 35 天）
      const date = new Date();
      date.setDate(date.getDate() - i);

      const timestamp = new Date(date);
      timestamp.setHours(20 + Math.floor(Math.random() * 3));
      timestamp.setMinutes(Math.floor(Math.random() * 60));

      const method = methods[Math.floor(Math.random() * methods.length)];
      const highlight = highlights[Math.floor(Math.random() * highlights.length)];
      const extraMessage = Math.random() > 0.5 ? '謝謝同學們的鼓勵！' : '';

      batchData.push([
        timestamp,
        name + '@gmail.com',
        name,
        date,
        '✅ 是，已完成',
        highlight,
        method,
        extraMessage
      ]);

      totalRecords++;
    }
  });

  // 批次寫入資料
  if (batchData.length > 0) {
    const range = responseSheet.getRange(
      responseSheet.getLastRow() + 1,
      1,
      batchData.length,
      8
    );
    range.setValues(batchData);
  }

  SpreadsheetApp.getUi().alert(
    '✅ 完美 35 天連續打卡測試資料已產生！\n\n' +
    '學員數量：' + numStudents + ' 位\n' +
    '打卡記錄：' + totalRecords + ' 筆 (' + numStudents + ' × 35 天)\n' +
    '出席率：100%（所有學員都有完整 35 天打卡記錄）\n\n' +
    '記得執行 updateAllConsecutiveDays() 來更新連續天數！'
  );
}

/**
 * 清空測試資料
 * 保留標題列，清除所有測試資料內容
 */
function clearTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName('表單回應');
  const studentListSheet = ss.getSheetByName('學員名單');
  const statsSheet = ss.getSheetByName('打卡統計');

  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '確認刪除',
    '確定要刪除所有測試資料嗎？\n\n此操作將清空：\n' +
    '1. 表單回應（保留標題列）\n' +
    '2. 學員名單（保留標題列）\n' +
    '3. 打卡統計（保留標題列，但清空數據）\n\n' +
    '此操作無法復原！',
    ui.ButtonSet.YES_NO
  );

  if (response == ui.Button.YES) {
    // 清空表單回應
    let lastRow = responseSheet.getLastRow();
    if (lastRow > 1) {
      const range = responseSheet.getRange(2, 1, lastRow - 1, responseSheet.getLastColumn());
      range.clearContent();
    }

    // 清空學員名單
    lastRow = studentListSheet.getLastRow();
    if (lastRow > 1) {
      const range = studentListSheet.getRange(2, 1, lastRow - 1, studentListSheet.getLastColumn());
      range.clearContent();
    }

    // 清空打卡統計的資料欄位（B, C, D 欄）
    lastRow = statsSheet.getLastRow();
    if (lastRow > 1) {
      const range = statsSheet.getRange(2, 2, lastRow - 1, statsSheet.getLastColumn() - 1);
      range.clearContent();
    }

    ui.alert('✅ 測試資料已清空！\n\n標題列已保留，可以開始產生新的測試資料。');
  } else {
    ui.alert('已取消操作。');
  }
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
