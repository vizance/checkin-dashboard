// ============================================
// 每週里程碑報告功能
// ============================================

// ============================================
// 日期設定
// ============================================
// 注意：TEST_TODAY_DATE 已在 Code_CLEAN.js 中定義，請在那邊修改
// 課程開始日期（此處獨立定義，因為 Code_CLEAN.js 沒有這個變數）
const COURSE_START_DATE = new Date('2026-01-01');

// ============================================

/**
 * 產生本週報告預覽
 * 顯示所有學員的報告摘要，供管理員檢查
 */
function generateWeeklyReportPreview() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '產生本週報告預覽',
    '即將產生所有學員的本週報告摘要\n\n這可能需要幾秒鐘時間...\n\n是否繼續？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('已取消操作。');
    return;
  }

  const weeklyData = calculateWeeklyStats();

  if (weeklyData.students.length === 0) {
    ui.alert('⚠️ 沒有找到學員資料',
      '請確認「學員名單」工作表有學員資料。',
      ui.ButtonSet.OK);
    return;
  }

  // 顯示摘要
  let summary = `📊 本週報告預覽（${weeklyData.students.length} 位學員）\n`;
  summary += `📅 報告期間：${weeklyData.weekStart} ~ ${weeklyData.weekEnd}\n\n`;
  summary += `統計概況：\n`;
  summary += `• 平均打卡率：${weeklyData.averageRate}%\n`;
  summary += `• 完美打卡（7/7天）：${weeklyData.perfectStudents} 人\n`;
  summary += `• 本週未打卡：${weeklyData.noCheckinStudents} 人\n\n`;
  summary += `前 5 名學員：\n`;

  weeklyData.students.slice(0, 5).forEach((student, index) => {
    summary += `${index + 1}. ${student.name} - 本週${student.weekCheckins}/7天, 最高連續${student.consecutive}天\n`;
  });

  summary += `\n✅ 預覽完成！\n請到「📊 每週報告」>「✅ 確認寄送本週報告」進行寄送。`;

  ui.alert('本週報告預覽', summary, ui.ButtonSet.OK);
}

/**
 * 寄送本週報告給所有學員
 */
function sendWeeklyReports() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '⚠️ 確認寄送本週報告',
    '即將寄送每週里程碑報告給所有學員\n\n' +
    '請確認：\n' +
    '1. 已執行「更新連續天數」\n' +
    '2. 已檢查本週報告預覽\n' +
    '3. 確定要寄送給所有學員\n\n' +
    '是否繼續？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('已取消寄送。');
    return;
  }

  const weeklyData = calculateWeeklyStats();

  if (weeklyData.students.length === 0) {
    ui.alert('⚠️ 沒有找到學員資料',
      '請確認「學員名單」工作表有學員資料。',
      ui.ButtonSet.OK);
    return;
  }

  let successCount = 0;
  let failCount = 0;
  const failedStudents = [];

  weeklyData.students.forEach(student => {
    try {
      // 驗證學員資料完整性
      if (!student || !student.email || !student.name) {
        throw new Error('學員資料不完整');
      }

      const htmlBody = generateWeeklyReportHTML(student, weeklyData);
      const subject = `📊 第 ${weeklyData.weekNumber} 週里程碑報告 - ${student.name}`;

      MailApp.sendEmail({
        to: student.email,
        subject: subject,
        htmlBody: htmlBody
      });

      successCount++;
    } catch (error) {
      failCount++;
      failedStudents.push(student.name);
      Logger.log(`寄送失敗: ${student.name} - ${error.message}`);
    }
  });

  let resultMessage = `✅ 寄送完成！\n\n`;
  resultMessage += `成功寄送：${successCount} 封\n`;
  if (failCount > 0) {
    resultMessage += `失敗：${failCount} 封\n\n`;
    resultMessage += `失敗名單：\n${failedStudents.join('\n')}`;
  }

  ui.alert('寄送結果', resultMessage, ui.ButtonSet.OK);
}

/**
 * 測試寄送報告給管理員自己
 */
function sendTestWeeklyReport() {
  const ui = SpreadsheetApp.getUi();
  const userEmail = Session.getActiveUser().getEmail();

  if (!userEmail) {
    ui.alert('❌ 錯誤', '無法取得您的電子郵件地址。', ui.ButtonSet.OK);
    return;
  }

  const weeklyData = calculateWeeklyStats();

  if (weeklyData.students.length === 0) {
    ui.alert('⚠️ 沒有找到學員資料',
      '請確認「學員名單」工作表有學員資料。',
      ui.ButtonSet.OK);
    return;
  }

  // 使用第一位學員的資料作為測試
  const testStudent = weeklyData.students[0];

  // 驗證學員資料完整性
  if (!testStudent || !testStudent.email || !testStudent.name) {
    ui.alert('❌ 錯誤',
      '學員資料不完整，請檢查資料結構。\n\n' +
      '請確認：\n' +
      '1. 「學員名單」工作表有學員資料\n' +
      '2. 學員有打卡記錄（需要電子郵件）',
      ui.ButtonSet.OK);
    Logger.log('測試學員資料：' + JSON.stringify(testStudent));
    return;
  }

  const htmlBody = generateWeeklyReportHTML(testStudent, weeklyData);
  const subject = `【測試】第 ${weeklyData.weekNumber} 週里程碑報告 - ${testStudent.name}`;

  try {
    MailApp.sendEmail({
      to: userEmail,
      subject: subject,
      htmlBody: htmlBody
    });

    ui.alert(
      '✅ 測試寄送成功！',
      `已將測試報告寄送到：${userEmail}\n\n` +
      `使用 ${testStudent.name} 的資料作為範例。\n\n` +
      `請檢查信箱確認報告格式是否正確。`,
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('❌ 寄送失敗', error.message, ui.ButtonSet.OK);
  }
}

/**
 * 計算本週統計資料
 */
function calculateWeeklyStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responseSheet = ss.getSheetByName('表單回應');
  const studentListSheet = ss.getSheetByName('學員名單');
  const statsSheet = ss.getSheetByName('打卡統計');

  // 檢查工作表是否存在
  if (!responseSheet || !studentListSheet || !statsSheet) {
    throw new Error('找不到必要的工作表！請確認「表單回應」、「學員名單」、「打卡統計」都存在。');
  }

  const today = TEST_TODAY_DATE ? new Date(TEST_TODAY_DATE) : new Date();
  const weekEnd = new Date(today);
  weekEnd.setHours(23, 59, 59, 999);

  // 計算本週開始日期（週一為一週的開始）
  const dayOfWeek = today.getDay();  // 0=週日, 1=週一, ..., 6=週六
  const daysFromMonday = (dayOfWeek === 0) ? 6 : (dayOfWeek - 1);  // 計算距離週一的天數
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  Logger.log('本週期間：' + formatDate(weekStart) + ' ~ ' + formatDate(weekEnd));
  Logger.log('今天是星期' + (dayOfWeek === 0 ? '日' : dayOfWeek) + '，距離週一：' + daysFromMonday + '天');

  // 計算是第幾週（從課程開始日期算起）
  const weeksSinceCourseStart = Math.floor((weekStart - COURSE_START_DATE) / (7 * 24 * 60 * 60 * 1000)) + 1;

  // 讀取所有資料
  const responseData = responseSheet.getDataRange().getValues();
  const studentListData = studentListSheet.getDataRange().getValues();
  const statsData = statsSheet.getDataRange().getValues();

  // 建立學員列表
  const students = [];

  for (let i = 1; i < studentListData.length; i++) {
    const studentName = studentListData[i][0];
    if (!studentName) continue;

    // 從打卡統計取得連續天數和累計天數
    let consecutive = 0;
    let total = 0;
    let email = '';

    for (let j = 1; j < statsData.length; j++) {
      if (statsData[j][0] === studentName) {
        total = statsData[j][1] || 0;  // B欄：累計打卡天數
        consecutive = statsData[j][2] || 0;  // C欄：連續打卡天數
        break;
      }
    }

    // 計算本週打卡資料
    const weekRecords = [];
    const weekMethods = {};
    const weekHighlights = [];

    for (let k = 1; k < responseData.length; k++) {
      const row = responseData[k];
      const name = row[2];  // C欄：姓名
      const checkinDate = new Date(row[3]);  // D欄：打卡日期
      const status = row[4];  // E欄：是否完成
      const highlight = row[5];  // F欄：一句話亮點
      const method = row[6];  // G欄：萃取法

      if (name === studentName && status === "✅ 是，已完成") {
        checkinDate.setHours(0, 0, 0, 0);

        if (checkinDate >= weekStart && checkinDate <= weekEnd) {
          weekRecords.push(checkinDate);
          email = email || row[1];  // B欄：電子郵件

          // 統計萃取法
          if (method) {
            weekMethods[method] = (weekMethods[method] || 0) + 1;
          }

          // 收集亮點
          if (highlight) {
            weekHighlights.push({
              date: formatDate(checkinDate),
              content: highlight
            });
          }
        }
      }
    }

    // 計算本週打卡天數
    const uniqueDates = new Set(weekRecords.map(d => d.toDateString()));
    const weekCheckins = uniqueDates.size;
    const weekRate = Math.round((weekCheckins / 7) * 100);

    // 【新增】收集完整 35 天的打卡記錄（用於日曆視覺化）
    const allCheckinDates = new Set();
    const cutoffDate = new Date(TEST_TODAY_DATE ? TEST_TODAY_DATE : new Date());
    cutoffDate.setHours(23, 59, 59, 999);

    for (let k = 1; k < responseData.length; k++) {
      const row = responseData[k];
      const name = row[2];
      const checkinDate = new Date(row[3]);
      const status = row[4];

      if (name === studentName && status === "✅ 是，已完成" && checkinDate <= cutoffDate) {
        const dateStr = formatDate(checkinDate);
        allCheckinDates.add(dateStr);
      }
    }

    // 計算達成的里程碑
    const milestones = [];
    if (consecutive >= 7 && consecutive < 14) milestones.push('7天');
    if (consecutive >= 14 && consecutive < 21) milestones.push('7天', '14天');
    if (consecutive >= 21 && consecutive < 28) milestones.push('7天', '14天', '21天');
    if (consecutive >= 28 && consecutive < 35) milestones.push('7天', '14天', '21天', '28天');
    if (consecutive >= 35) milestones.push('7天', '14天', '21天', '28天', '35天');

    // Debug: 檢查 email
    if (!email) {
      Logger.log(`⚠️ 學員「${studentName}」沒有 email，請確認該學員是否有打卡記錄`);
    }

    students.push({
      name: studentName,
      email: email || '',  // 如果沒有email，留空（後續會被過濾掉）
      weekCheckins: weekCheckins,
      weekRate: weekRate,
      consecutive: consecutive,
      total: total,
      weekMethods: weekMethods,
      weekHighlights: weekHighlights,
      milestones: milestones,
      allCheckinDates: allCheckinDates  // 【新增】完整打卡日期集合
    });
  }

  // 過濾掉沒有 email 的學員（表示沒有打卡記錄）
  const validStudents = students.filter(s => s.email);
  const filteredCount = students.length - validStudents.length;

  if (filteredCount > 0) {
    Logger.log(`⚠️ 過濾掉 ${filteredCount} 位沒有打卡記錄的學員`);
  }

  // Debug: 記錄學員資料
  Logger.log('找到有效學員數量：' + validStudents.length);
  if (validStudents.length > 0) {
    Logger.log('第一位學員資料：' + JSON.stringify(validStudents[0]));
  } else {
    Logger.log('⚠️ 警告：沒有找到任何有效的學員資料！');
  }

  // 排序（依連續天數降冪）
  validStudents.sort((a, b) => b.consecutive - a.consecutive);

  // 計算排名
  validStudents.forEach((student, index) => {
    student.rank = index + 1;
  });

  // 計算整體統計
  const totalStudents = validStudents.length;
  const perfectStudents = validStudents.filter(s => s.weekCheckins === 7).length;
  const noCheckinStudents = validStudents.filter(s => s.weekCheckins === 0).length;
  const averageRate = totalStudents > 0
    ? Math.round(validStudents.reduce((sum, s) => sum + s.weekRate, 0) / totalStudents)
    : 0;

  return {
    weekNumber: weeksSinceCourseStart,
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    students: validStudents,
    totalStudents: totalStudents,
    perfectStudents: perfectStudents,
    noCheckinStudents: noCheckinStudents,
    averageRate: averageRate
  };
}

/**
 * 生成 HTML 郵件內容
 */
function generateWeeklyReportHTML(student, weeklyData) {
  // 驗證參數
  if (!student) {
    throw new Error('學員資料為空！無法產生報告。');
  }
  if (!weeklyData) {
    throw new Error('週報資料為空！無法產生報告。');
  }

  // 產生鼓勵語
  let encouragement = '';
  if (student.weekCheckins === 7) {
    encouragement = '🎉 太棒了！這週完美達成 7/7 天打卡！繼續保持這個好習慣！';
  } else if (student.weekCheckins >= 5) {
    encouragement = '💪 做得很好！這週打卡 ' + student.weekCheckins + '/7 天，再接再厲！';
  } else if (student.weekCheckins >= 3) {
    encouragement = '📈 持續前進中！下週試著挑戰更多天數！';
  } else if (student.weekCheckins > 0) {
    encouragement = '🌱 開始總是最難的，下週繼續加油！每一天的記錄都是成長的證明。';
  } else {
    encouragement = '💙 我們在這裡陪伴你！任何時候都可以重新開始，期待下週看到你的打卡！';
  }

  // 產生萃取法統計表
  let methodsHTML = '';
  if (Object.keys(student.weekMethods).length > 0) {
    for (const [method, count] of Object.entries(student.weekMethods)) {
      methodsHTML += `
        <tr>
          <td style="padding: 14px 18px; border-bottom: 2px solid #F0F0F0; font-size: 15px; font-weight: 700; color: #2C3E50;">${method}</td>
          <td style="padding: 14px 18px; border-bottom: 2px solid #F0F0F0; text-align: center; font-weight: 900; font-size: 16px; color: #FF6B35;">${count} 次</td>
        </tr>
      `;
    }
  } else {
    methodsHTML = '<tr><td colspan="2" style="padding: 20px; color: #999; text-align: center; font-size: 15px; font-weight: 700;">本週尚未使用萃取法</td></tr>';
  }

  // 產生亮點列表
  let highlightsHTML = '';
  if (student.weekHighlights.length > 0) {
    student.weekHighlights.forEach(h => {
      highlightsHTML += `
        <div style="margin-bottom: 14px; padding: 16px; background: white; border: 3px solid #2C3E50; border-left: 6px solid #FF6B35; border-radius: 6px; box-shadow: 3px 3px 0px rgba(44, 62, 80, 0.3);">
          <div style="font-size: 13px; color: #888; font-weight: 700; margin-bottom: 6px;">${h.date}</div>
          <div style="font-size: 15px; color: #2C3E50; font-weight: 700; line-height: 1.7;">${h.content}</div>
        </div>
      `;
    });
  } else {
    highlightsHTML = '<div style="color: #999; text-align: center; padding: 25px; font-size: 15px; font-weight: 700; background: #F5F5F5; border: 3px solid #E0E0E0; border-radius: 6px;">本週尚無亮點記錄</div>';
  }

  // 產生里程碑徽章
  let milestonesHTML = '';
  const allMilestones = ['7天', '14天', '21天', '28天', '35天'];
  allMilestones.forEach(m => {
    if (student.milestones.includes(m)) {
      milestonesHTML += `<span style="display: inline-block; margin: 5px; padding: 8px 16px; background: linear-gradient(135deg, #FFD700 0%, #FFC400 100%); color: #2C3E50; border: 3px solid #2C3E50; border-radius: 20px; font-weight: 900; font-size: 14px; box-shadow: 3px 3px 0px rgba(44, 62, 80, 0.3);">🏆 ${m}</span> `;
    } else {
      milestonesHTML += `<span style="display: inline-block; margin: 5px; padding: 8px 16px; background: #F0F0F0; color: #999; border: 3px solid #DDD; border-radius: 20px; font-weight: 700; font-size: 14px;">⭕ ${m}</span> `;
    }
  });

  // 【新增】產生 35 天打卡日曆 HTML
  const calendarHTML = generateCalendarHTML(student.allCheckinDates);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: 'Noto Sans TC', 'Microsoft JhengHei', Arial, sans-serif; background: #FAFAFA;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border: 4px solid #2C3E50; border-radius: 12px; box-shadow: 8px 8px 0px #2C3E50;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C52 100%); padding: 35px 30px; text-align: center; color: white; border-bottom: 4px solid #2C3E50; position: relative;">
      <div style="font-size: 32px; font-weight: 900; text-shadow: 3px 3px 0px rgba(0,0,0,0.2); letter-spacing: 1px; margin-bottom: 8px;">📊 第 ${weeklyData.weekNumber} 週里程碑報告</div>
      <div style="font-size: 16px; font-weight: 700; opacity: 0.95;">${weeklyData.weekStart} ~ ${weeklyData.weekEnd}</div>
    </div>

    <!-- Content -->
    <div style="padding: 35px 30px;">

      <!-- Greeting -->
      <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #F0F0F0;">
        <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 900; color: #2C3E50;">Hi ${student.name} 👋</h2>
        <p style="margin: 0; color: #666; font-size: 16px; font-weight: 700; line-height: 1.7;">這是你本週的學習成果報告！讓我們一起看看你這週的精彩表現～</p>
      </div>

      <!-- Stats Cards -->
      <div style="margin-bottom: 20px;">
        <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 0 12px;">
          <tr>
            <td style="width: 48%; padding: 0;">
              <div style="background: white; padding: 22px; border: 4px solid #2C3E50; border-radius: 8px; box-shadow: 4px 4px 0px #2C3E50; text-align: center;">
                <div style="font-size: 14px; color: #666; font-weight: 700; margin-bottom: 8px;">📅 本週打卡</div>
                <div style="font-size: 38px; font-weight: 900; color: #FF6B35; text-shadow: 2px 2px 0px rgba(0,0,0,0.1);">${student.weekCheckins}<span style="font-size: 20px; color: #999; font-weight: 700;">/7 天</span></div>
                <div style="font-size: 14px; color: #888; font-weight: 700; margin-top: 6px;">打卡率：${student.weekRate}%</div>
              </div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; padding: 0;">
              <div style="background: white; padding: 22px; border: 4px solid #2C3E50; border-radius: 8px; box-shadow: 4px 4px 0px #2C3E50; text-align: center;">
                <div style="font-size: 14px; color: #666; font-weight: 700; margin-bottom: 8px;">🏆 最高連續打卡</div>
                <div style="font-size: 38px; font-weight: 900; color: #FF6B35; text-shadow: 2px 2px 0px rgba(0,0,0,0.1);">${student.consecutive}<span style="font-size: 20px; color: #999; font-weight: 700;"> 天</span></div>
                <div style="font-size: 14px; color: #888; font-weight: 700; margin-top: 6px;">歷史最佳紀錄</div>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <div style="background: white; padding: 22px; border: 4px solid #2C3E50; border-radius: 8px; box-shadow: 4px 4px 0px #2C3E50; text-align: center; margin-bottom: 30px;">
        <div style="font-size: 14px; color: #666; font-weight: 700; margin-bottom: 8px;">📊 累計打卡</div>
        <div style="font-size: 42px; font-weight: 900; color: #FF6B35; text-shadow: 2px 2px 0px rgba(0,0,0,0.1);">${student.total}<span style="font-size: 22px; color: #999; font-weight: 700;"> 天</span></div>
      </div>

      <!-- Milestones -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 18px 0; font-size: 20px; font-weight: 900; color: #2C3E50; padding-bottom: 12px; border-bottom: 3px solid #F0F0F0;">🏆 里程碑達成</h3>
        <div style="line-height: 1.8;">${milestonesHTML}</div>
      </div>

      <!-- Methods -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 18px 0; font-size: 20px; font-weight: 900; color: #2C3E50; padding-bottom: 12px; border-bottom: 3px solid #F0F0F0;">📝 本週萃取法使用</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border: 4px solid #2C3E50; border-radius: 8px; box-shadow: 4px 4px 0px #2C3E50;">
          ${methodsHTML}
        </table>
      </div>

      <!-- Highlights -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 18px 0; font-size: 20px; font-weight: 900; color: #2C3E50; padding-bottom: 12px; border-bottom: 3px solid #F0F0F0;">💡 本週亮點回顧</h3>
        ${highlightsHTML}
      </div>

      <!-- 35 Days Calendar -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 18px 0; font-size: 20px; font-weight: 900; color: #2C3E50; padding-bottom: 12px; border-bottom: 3px solid #F0F0F0;">📅 你的 35 天打卡日曆</h3>
        ${calendarHTML}
      </div>

      <!-- Encouragement -->
      <div style="background: linear-gradient(135deg, #FFF4E8 0%, #FFE8CC 100%); padding: 25px; border: 4px solid #2C3E50; border-radius: 8px; box-shadow: 4px 4px 0px #2C3E50; text-align: center;">
        <div style="font-size: 17px; color: #2C3E50; line-height: 1.8; font-weight: 700;">${encouragement}</div>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #F5F5F5; padding: 25px; text-align: center; border-top: 4px solid #2C3E50;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 15px; font-weight: 700;">繼續加油！我們在這裡陪伴你的每一步 💪</p>
      <p style="margin: 0; color: #999; font-size: 13px; font-weight: 700;">5週復盤陪跑班 © 知識複利</p>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * 生成 35 天打卡日曆 HTML
 * @param {Set} checkinDates - 已打卡的日期集合（格式：YYYY/MM/DD）
 * @return {string} 日曆 HTML
 */
function generateCalendarHTML(checkinDates) {
  const today = TEST_TODAY_DATE ? new Date(TEST_TODAY_DATE) : new Date();

  let calendarHTML = '<div style="background: white; padding: 20px; border: 4px solid #2C3E50; border-radius: 8px; box-shadow: 4px 4px 0px #2C3E50;">';

  // 生成 5 週（35 天）
  for (let week = 0; week < 5; week++) {
    calendarHTML += `
      <div style="margin-bottom: ${week === 4 ? '0' : '16px'};">
        <div style="font-size: 14px; font-weight: 900; color: #666; margin-bottom: 10px; padding-left: 4px;">第 ${week + 1} 週</div>
        <div style="display: flex; gap: 8px;">
    `;

    // 生成 7 天
    for (let day = 0; day < 7; day++) {
      const dayIndex = week * 7 + day;
      const currentDate = new Date(COURSE_START_DATE);
      currentDate.setDate(COURSE_START_DATE.getDate() + dayIndex);

      const dateStr = formatDate(currentDate);
      const isChecked = checkinDates.has(dateStr);
      const isPast = currentDate <= today;
      const isToday = formatDate(currentDate) === formatDate(today);

      // 決定方塊樣式
      let boxStyle = '';
      let emoji = '';
      let tooltip = '';

      if (isChecked) {
        // 已打卡：綠色
        boxStyle = 'background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); border: 3px solid #2C3E50; color: white;';
        emoji = '✅';
        tooltip = `${dateStr} 已打卡`;
      } else if (isPast) {
        // 未打卡（過去）：淺灰色
        boxStyle = 'background: #F5F5F5; border: 3px solid #DDD; color: #CCC;';
        emoji = '⏸️';
        tooltip = `${dateStr} 未打卡`;
      } else {
        // 未來：白色虛線框
        boxStyle = 'background: white; border: 3px dashed #DDD; color: #DDD;';
        emoji = '📅';
        tooltip = `${dateStr} 尚未開始`;
      }

      // 今天加上特殊標記
      if (isToday) {
        boxStyle += ' box-shadow: 0 0 0 3px #FF6B35;';
      }

      calendarHTML += `
        <div style="
          flex: 1;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          ${boxStyle}
          font-size: 20px;
          position: relative;
          transition: all 0.2s ease;
        " title="${tooltip}">
          ${emoji}
        </div>
      `;
    }

    calendarHTML += `
        </div>
      </div>
    `;
  }

  // 加入圖例
  calendarHTML += `
    <div style="margin-top: 20px; padding-top: 16px; border-top: 3px solid #F0F0F0; display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); border: 3px solid #2C3E50; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px;">✅</div>
        <span style="font-size: 13px; font-weight: 700; color: #666;">已打卡</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 24px; height: 24px; background: #F5F5F5; border: 3px solid #DDD; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #CCC;">⏸️</div>
        <span style="font-size: 13px; font-weight: 700; color: #666;">未打卡</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <div style="width: 24px; height: 24px; background: white; border: 3px dashed #DDD; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #DDD;">📅</div>
        <span style="font-size: 13px; font-weight: 700; color: #666;">未來</span>
      </div>
    </div>
  `;

  calendarHTML += '</div>';

  return calendarHTML;
}

/**
 * 輔助函數：格式化日期
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
}
