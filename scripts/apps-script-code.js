/**
 * 5週復盤陪跑班 - 打卡系統 Apps Script
 * 請將此檔案的全部內容複製到 Google Apps Script 編輯器中
 */

/**
 * 計算學員的連續打卡天數
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
  for (let i = 1; i < data.length; i++) { // 從第2行開始（跳過標題）
    const row = data[i];
    const name = row[2]; // C欄：姓名（因為B欄是電子郵件）
    const date = row[3]; // D欄：打卡日期
    const status = row[4]; // E欄：是否完成

    if (name === studentName && status === "✅ 是，已完成") {
      records.push(new Date(date));
    }
  }

  // 如果沒有記錄，返回0
  if (records.length === 0) return 0;

  // 排序日期（從新到舊）
  records.sort((a, b) => b - a);

  // 計算連續天數
  let consecutiveDays = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 最近打卡日期
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
      break; // 中斷了，停止計算
    }
  }

  return consecutiveDays;
}

/**
 * 產生測試資料
 * 產生過去 35 天，5 位學員的打卡記錄（不同連續天數）
 */
function generateTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName('表單回應');

  // 5 位學員，不同的連續打卡模式
  const studentPatterns = [
    { name: '王小明', days: 35, skip: [] },              // 完美打卡 35 天
    { name: '李小華', days: 25, skip: [5, 15, 20] },     // 打卡 22 天，中間跳過幾天
    { name: '張小美', days: 20, skip: [10, 11] },        // 打卡 18 天
    { name: '陳大偉', days: 14, skip: [7, 8, 9] },       // 打卡 11 天
    { name: '林小芳', days: 10, skip: [3, 6] }           // 打卡 8 天
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

  // 為每位學員產生資料
  studentPatterns.forEach(pattern => {
    for (let i = pattern.days - 1; i >= 0; i--) {
      // 跳過指定的日期
      if (pattern.skip.includes(i)) {
        continue;
      }

      const date = new Date();
      date.setDate(date.getDate() - i);

      const timestamp = new Date(date);
      timestamp.setHours(20 + Math.floor(Math.random() * 3)); // 晚上8-11點
      timestamp.setMinutes(Math.floor(Math.random() * 60));

      const method = methods[Math.floor(Math.random() * methods.length)];
      const highlight = highlights[Math.floor(Math.random() * highlights.length)];
      const extraMessage = Math.random() > 0.5 ? '謝謝同學們的鼓勵！' : '';

      responseSheet.appendRow([
        timestamp,                    // A: 時間戳記
        pattern.name + '@gmail.com',  // B: 電子郵件地址
        pattern.name,                 // C: 姓名
        date,                        // D: 打卡日期
        '✅ 是，已完成',              // E: 是否完成
        highlight,                    // F: 今日一句話亮點
        method,                      // G: 萃取法
        extraMessage                 // H: 想對同學說的話
      ]);

      totalRecords++;
    }
  });

  SpreadsheetApp.getUi().alert(
    '測試資料已產生！\n\n' +
    '共產生了 ' + totalRecords + ' 筆打卡記錄\n\n' +
    '學員打卡模式：\n' +
    '• 王小明：連續 35 天（完美打卡）\n' +
    '• 李小華：約 22 天（中間有中斷）\n' +
    '• 張小美：約 18 天（中間有中斷）\n' +
    '• 陳大偉：約 11 天（中間有中斷）\n' +
    '• 林小芳：約 8 天（中間有中斷）'
  );
}

/**
 * 清空測試資料
 * 刪除「表單回應」工作表中的所有資料（保留標題列）
 */
function clearTestData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName('表單回應');

  // 確認是否要刪除
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '確認刪除',
    '確定要刪除「表單回應」工作表中的所有測試資料嗎？\n\n此操作無法復原！',
    ui.ButtonSet.YES_NO
  );

  if (response == ui.Button.YES) {
    const lastRow = responseSheet.getLastRow();

    if (lastRow > 1) {
      // 刪除第 2 行到最後一行的所有資料（保留第 1 行標題）
      responseSheet.deleteRows(2, lastRow - 1);
      ui.alert('測試資料已清空！');
    } else {
      ui.alert('沒有資料需要清空。');
    }
  } else {
    ui.alert('已取消操作。');
  }
}
