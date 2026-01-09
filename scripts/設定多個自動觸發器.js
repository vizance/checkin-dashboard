/**
 * 設定多個自動觸發器
 * 將此函數加入你的 Apps Script 中，執行一次即可
 */

/**
 * 建立每日多次觸發器（推薦：一天 3 次）
 * 執行此函數來建立觸發器，只需執行一次
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

  // 建立 3 個觸發器
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
      '觸發器設定成功！\n\n' +
      '已建立 3 個每日觸發器：\n' +
      '• 早上 8:00\n' +
      '• 下午 2:00\n' +
      '• 晚上 11:00\n\n' +
      '系統會在這些時間自動更新連續打卡天數。'
    );
  } catch (error) {
    ui.alert('設定失敗：' + error.message);
  }
}

/**
 * 建立每日 2 次觸發器（簡化版）
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
      '觸發器設定成功！\n\n' +
      '已建立 2 個每日觸發器：\n' +
      '• 早上 9:00\n' +
      '• 晚上 11:00\n\n' +
      '系統會在這些時間自動更新連續打卡天數。'
    );
  } catch (error) {
    ui.alert('設定失敗：' + error.message);
  }
}

/**
 * 建立每小時觸發器（不推薦，但如果你堅持...）
 */
function createHourlyTrigger() {
  const ui = SpreadsheetApp.getUi();

  // 警告訊息
  const response = ui.alert(
    '確認設定',
    '你確定要設定每小時觸發嗎？\n\n' +
    '注意：\n' +
    '• 連續打卡天數是以「天」為單位\n' +
    '• 每小時更新意義不大\n' +
    '• 建議改用「一天 2-3 次」\n\n' +
    '是否繼續？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('已取消設定。');
    return;
  }

  // 先刪除所有舊的觸發器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateAllConsecutiveDays') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  try {
    // 建立每小時觸發器
    ScriptApp.newTrigger('updateAllConsecutiveDays')
      .timeBased()
      .everyHours(1)
      .create();

    ui.alert(
      '觸發器設定成功！\n\n' +
      '已建立每小時觸發器。\n' +
      '系統會每小時自動更新連續打卡天數。\n\n' +
      '配額使用：約 4% / 天，完全沒問題。'
    );
  } catch (error) {
    ui.alert('設定失敗：' + error.message);
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

  ui.alert('已刪除 ' + count + ' 個觸發器。');
}

/**
 * 查看目前的觸發器設定
 */
function viewCurrentTriggers() {
  const ui = SpreadsheetApp.getUi();
  const triggers = ScriptApp.getProjectTriggers();

  let message = '目前的觸發器：\n\n';
  let found = false;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateAllConsecutiveDays') {
      found = true;
      const eventType = trigger.getEventType();

      if (eventType === ScriptApp.EventType.CLOCK) {
        // 時間觸發器
        message += '• ' + formatTriggerInfo(trigger) + '\n';
      }
    }
  });

  if (!found) {
    message = '目前沒有設定任何觸發器。';
  }

  ui.alert(message);
}

/**
 * 格式化觸發器資訊
 */
function formatTriggerInfo(trigger) {
  const triggerSource = trigger.getTriggerSource();

  if (triggerSource === ScriptApp.TriggerSource.CLOCK) {
    // 這是時間觸發器
    const triggerSourceString = trigger.getTriggerSourceId();

    // 嘗試判斷觸發類型
    // 注意：Google Apps Script API 沒有提供直接取得小時的方法
    // 所以我們只能顯示「每日觸發」或「每小時觸發」
    return '時間觸發器（函數：updateAllConsecutiveDays）';
  }

  return '未知類型';
}
