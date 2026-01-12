// ============================================
// 每週里程碑報告功能
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
    summary += `${index + 1}. ${student.name} - 本週${student.weekCheckins}/7天, 連續${student.consecutive}天\n`;
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
  let successCount = 0;
  let failCount = 0;
  const failedStudents = [];

  weeklyData.students.forEach(student => {
    try {
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

  const today = TEST_TODAY_DATE ? new Date(TEST_TODAY_DATE) : new Date();
  const weekEnd = new Date(today);
  weekEnd.setHours(23, 59, 59, 999);

  // 計算本週開始日期（假設週日是一週的開始）
  const dayOfWeek = weekEnd.getDay();
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekEnd.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  // 計算是第幾週（從課程開始日期算起）
  const courseStart = new Date('2025-12-07'); // TODO: 從 config 讀取
  const weeksSinceCourseStart = Math.floor((weekStart - courseStart) / (7 * 24 * 60 * 60 * 1000)) + 1;

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

    // 計算達成的里程碑
    const milestones = [];
    if (consecutive >= 7 && consecutive < 14) milestones.push('7天');
    if (consecutive >= 14 && consecutive < 21) milestones.push('7天', '14天');
    if (consecutive >= 21 && consecutive < 28) milestones.push('7天', '14天', '21天');
    if (consecutive >= 28 && consecutive < 35) milestones.push('7天', '14天', '21天', '28天');
    if (consecutive >= 35) milestones.push('7天', '14天', '21天', '28天', '35天');

    students.push({
      name: studentName,
      email: email || `${studentName}@example.com`,  // 如果沒有email，使用假的
      weekCheckins: weekCheckins,
      weekRate: weekRate,
      consecutive: consecutive,
      total: total,
      weekMethods: weekMethods,
      weekHighlights: weekHighlights,
      milestones: milestones
    });
  }

  // 排序（依連續天數降冪）
  students.sort((a, b) => b.consecutive - a.consecutive);

  // 計算排名
  students.forEach((student, index) => {
    student.rank = index + 1;
  });

  // 計算整體統計
  const totalStudents = students.length;
  const perfectStudents = students.filter(s => s.weekCheckins === 7).length;
  const noCheckinStudents = students.filter(s => s.weekCheckins === 0).length;
  const averageRate = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + s.weekRate, 0) / totalStudents)
    : 0;

  return {
    weekNumber: weeksSinceCourseStart,
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    students: students,
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
          <td style="padding: 8px; border-bottom: 1px solid #E8EFFF;">${method}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E8EFFF; text-align: center; font-weight: bold; color: #5B7FDB;">${count} 次</td>
        </tr>
      `;
    }
  } else {
    methodsHTML = '<tr><td colspan="2" style="padding: 8px; color: #999; text-align: center;">本週尚未使用萃取法</td></tr>';
  }

  // 產生亮點列表
  let highlightsHTML = '';
  if (student.weekHighlights.length > 0) {
    student.weekHighlights.forEach(h => {
      highlightsHTML += `
        <div style="margin-bottom: 12px; padding: 12px; background: #F0F4FF; border-left: 4px solid #5B7FDB; border-radius: 4px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${h.date}</div>
          <div style="font-size: 14px; color: #333; line-height: 1.6;">${h.content}</div>
        </div>
      `;
    });
  } else {
    highlightsHTML = '<div style="color: #999; text-align: center; padding: 20px;">本週尚無亮點記錄</div>';
  }

  // 產生里程碑徽章
  let milestonesHTML = '';
  const allMilestones = ['7天', '14天', '21天', '28天', '35天'];
  allMilestones.forEach(m => {
    if (student.milestones.includes(m)) {
      milestonesHTML += `<span style="display: inline-block; margin: 4px; padding: 6px 12px; background: #FFD700; color: #333; border-radius: 20px; font-weight: bold;">🏆 ${m}</span> `;
    } else {
      milestonesHTML += `<span style="display: inline-block; margin: 4px; padding: 6px 12px; background: #F0F0F0; color: #999; border-radius: 20px;">⭕ ${m}</span> `;
    }
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Microsoft JhengHei', 'Noto Sans TC', Arial, sans-serif; background: #F5F7FA;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 900;">📊 第 ${weeklyData.weekNumber} 週里程碑報告</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${weeklyData.weekStart} ~ ${weeklyData.weekEnd}</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">

      <!-- Greeting -->
      <div style="margin-bottom: 25px;">
        <h2 style="margin: 0 0 10px 0; font-size: 22px; color: #333;">Hi ${student.name} 👋</h2>
        <p style="margin: 0; color: #666; font-size: 15px; line-height: 1.6;">這是你本週的學習成果報告！讓我們一起看看你這週的精彩表現～</p>
      </div>

      <!-- Stats Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
        <div style="background: linear-gradient(135deg, #F0F4FF 0%, #E8EFFF 100%); padding: 20px; border-radius: 8px; border: 2px solid #5B7FDB;">
          <div style="font-size: 14px; color: #5B7FDB; margin-bottom: 5px;">📅 本週打卡</div>
          <div style="font-size: 32px; font-weight: 900; color: #333;">${student.weekCheckins}<span style="font-size: 18px; color: #999;">/7 天</span></div>
          <div style="font-size: 13px; color: #666; margin-top: 5px;">打卡率：${student.weekRate}%</div>
        </div>

        <div style="background: linear-gradient(135deg, #FFF4E8 0%, #FFE8CC 100%); padding: 20px; border-radius: 8px; border: 2px solid #FF9E44;">
          <div style="font-size: 14px; color: #FF9E44; margin-bottom: 5px;">🔥 連續打卡</div>
          <div style="font-size: 32px; font-weight: 900; color: #333;">${student.consecutive}<span style="font-size: 18px; color: #999;"> 天</span></div>
          <div style="font-size: 13px; color: #666; margin-top: 5px;">排名：${student.rank}/${weeklyData.totalStudents}</div>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #E8FFF0 0%, #CCF5E1 100%); padding: 20px; border-radius: 8px; border: 2px solid #27AE60; margin-bottom: 25px;">
        <div style="font-size: 14px; color: #27AE60; margin-bottom: 5px;">📊 累計打卡</div>
        <div style="font-size: 32px; font-weight: 900; color: #333;">${student.total}<span style="font-size: 18px; color: #999;"> 天</span></div>
      </div>

      <!-- Milestones -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 2px solid #E0E0E0; padding-bottom: 10px;">🏆 里程碑達成</h3>
        <div>${milestonesHTML}</div>
      </div>

      <!-- Methods -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 2px solid #E0E0E0; padding-bottom: 10px;">📝 本週萃取法使用</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border: 2px solid #E8EFFF; border-radius: 8px; overflow: hidden;">
          ${methodsHTML}
        </table>
      </div>

      <!-- Highlights -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 2px solid #E0E0E0; padding-bottom: 10px;">💡 本週亮點回顧</h3>
        ${highlightsHTML}
      </div>

      <!-- Encouragement -->
      <div style="background: linear-gradient(135deg, #FFF9E5 0%, #FFF2CC 100%); padding: 20px; border-radius: 8px; border: 2px solid #FFC107; text-align: center;">
        <div style="font-size: 16px; color: #333; line-height: 1.8; font-weight: 500;">${encouragement}</div>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #F5F7FA; padding: 20px; text-align: center; border-top: 2px solid #E0E0E0;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">繼續加油！我們在這裡陪伴你的每一步 💪</p>
      <p style="margin: 0; color: #999; font-size: 12px;">5週復盤陪跑班 © 知識複利</p>
    </div>

  </div>
</body>
</html>
  `;
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
