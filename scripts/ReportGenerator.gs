/**
 * 五週復盤習慣養成挑戰營 - HTML 報告生成器
 *
 * 使用方式：
 * 1. 在 Google Sheets 中開啟「擴充功能」>「Apps Script」
 * 2. 將此程式碼貼入
 * 3. 執行 generateAllReports() 函數
 * 4. HTML 檔案會存到 Google Drive 的「復盤挑戰營報告」資料夾
 * 5. 在瀏覽器開啟 HTML 檔案 → 列印 → 存成 PDF
 */

// ========== 配置區 ==========
const CONFIG = {
  // 活動日期
  COURSE_START_DATE: new Date('2026-03-02'),
  COURSE_END_DATE: new Date('2026-04-07'),

  // 工作表名稱
  STATS_SHEET_NAME: '打卡統計',      // 學員打卡統計資料
  HIGHLIGHTS_SHEET_NAME: '表單回應', // 表單回應（打卡紀錄）

  // Google Drive 資料夾名稱
  OUTPUT_FOLDER_NAME: '復盤挑戰營報告',
};

// ========== 主要函數 ==========

/**
 * 生成所有學員的 PDF 報告
 */
function generateAllReports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 取得資料
  const statsSheet = ss.getSheetByName(CONFIG.STATS_SHEET_NAME);
  const highlightsSheet = ss.getSheetByName(CONFIG.HIGHLIGHTS_SHEET_NAME);

  if (!statsSheet || !highlightsSheet) {
    throw new Error('找不到工作表，請確認 CONFIG 中的工作表名稱是否正確');
  }

  const statsData = statsSheet.getDataRange().getValues();
  const highlightsData = highlightsSheet.getDataRange().getValues();

  // 移除標題列
  statsData.shift();
  highlightsData.shift();

  // 建立或取得輸出資料夾
  const folder = getOrCreateFolder(CONFIG.OUTPUT_FOLDER_NAME);

  // 生成每位學員的報告
  let count = 0;
  for (const student of statsData) {
    const name = student[0];
    if (!name) continue;

    try {
      generateStudentReport(student, highlightsData, folder);
      count++;
      Logger.log(`✅ 已生成：${name}`);
    } catch (e) {
      Logger.log(`❌ 生成失敗：${name} - ${e.message}`);
    }
  }

  Logger.log(`\n🎉 完成！共生成 ${count} 份 HTML 報告`);
  Logger.log(`📁 報告位置：Google Drive > ${CONFIG.OUTPUT_FOLDER_NAME}`);
  Logger.log(`\n📌 下一步：`);
  Logger.log(`   1. 開啟 Google Drive 的「${CONFIG.OUTPUT_FOLDER_NAME}」資料夾`);
  Logger.log(`   2. 對 HTML 檔案按右鍵 → 開啟方式 → 在新視窗中預覽`);
  Logger.log(`   3. 點擊右上角「列印 / 存成 PDF」按鈕`);
}

/**
 * 生成單一學員的報告（用於測試）
 * @param {string} studentName - 學員姓名
 */
function generateSingleReport(studentName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const statsSheet = ss.getSheetByName(CONFIG.STATS_SHEET_NAME);
  const highlightsSheet = ss.getSheetByName(CONFIG.HIGHLIGHTS_SHEET_NAME);

  const statsData = statsSheet.getDataRange().getValues();
  const highlightsData = highlightsSheet.getDataRange().getValues();

  statsData.shift();
  highlightsData.shift();

  const student = statsData.find(s => s[0] === studentName);
  if (!student) {
    throw new Error(`找不到學員：${studentName}`);
  }

  const folder = getOrCreateFolder(CONFIG.OUTPUT_FOLDER_NAME);
  generateStudentReport(student, highlightsData, folder);

  Logger.log(`✅ 已生成 HTML 報告：${studentName}`);
  Logger.log(`📁 位置：Google Drive > ${CONFIG.OUTPUT_FOLDER_NAME}`);
  Logger.log(`📌 開啟 HTML 後點擊「列印 / 存成 PDF」即可下載`);
}

// ========== 報告生成邏輯 ==========

/**
 * 生成單一學員的 PDF 報告
 */
function generateStudentReport(student, highlightsData, folder) {
  const name = student[0];
  const totalDays = student[1] || 0;

  // 計算最高連續天數
  const studentHighlights = highlightsData.filter(h => h[2] === name && isCheckinCompleted(h[4]));
  const consecutiveDays = calculateConsecutiveDays(studentHighlights);

  // 取得里程碑
  const milestones = {
    day7: student[4] === '🏆',
    day14: student[5] === '🏆',
    day21: student[6] === '🏆',
    day35: student[7] === '🏆',
  };
  const milestonesCount = Object.values(milestones).filter(Boolean).length;

  // 生成打卡日曆資料
  const checkedDates = getCheckedDates(studentHighlights);

  // 取得亮點語錄
  const highlights = getHighlightQuotes(studentHighlights);

  // 生成 HTML
  const html = generateReportHTML({
    name,
    totalDays,
    consecutiveDays,
    milestonesCount,
    milestones,
    checkedDates,
    highlights,
  });

  // 儲存為 HTML 檔案
  const blob = Utilities.newBlob(html, 'text/html', `${name}_復盤挑戰歷程報告.html`);

  // 檢查是否已存在同名檔案，若有則刪除
  const existingFiles = folder.getFilesByName(`${name}_復盤挑戰歷程報告.html`);
  while (existingFiles.hasNext()) {
    existingFiles.next().setTrashed(true);
  }

  folder.createFile(blob);
}

/**
 * 檢查打卡是否完成
 */
function isCheckinCompleted(status) {
  if (!status) return false;
  const s = String(status).toLowerCase();
  return (s.includes('是') && s.includes('完成')) ||
         (s.includes('yes') && s.includes('完成')) ||
         s.includes('✅');
}

/**
 * 計算最高連續打卡天數
 */
function calculateConsecutiveDays(studentHighlights) {
  if (studentHighlights.length === 0) return 0;

  // 取得所有打卡日期
  const dates = studentHighlights
    .map(h => {
      const dateStr = String(h[3]).split(' ')[0];
      return new Date(dateStr);
    })
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a - b);

  if (dates.length === 0) return 0;

  // 轉換為日期字串集合（去重）
  const dateSet = new Set(dates.map(d => d.toISOString().split('T')[0]));
  const uniqueDates = Array.from(dateSet).sort();

  let maxConsecutive = 1;
  let currentConsecutive = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }

  return maxConsecutive;
}

/**
 * 取得已打卡的日期集合
 */
function getCheckedDates(studentHighlights) {
  const dates = new Set();

  studentHighlights.forEach(h => {
    const dateStr = String(h[3]).split(' ')[0];
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      // 計算是第幾天
      const dayNumber = Math.floor((date - CONFIG.COURSE_START_DATE) / (1000 * 60 * 60 * 24)) + 1;
      if (dayNumber >= 1 && dayNumber <= 35) {
        dates.add(dayNumber);
      }
    }
  });

  return dates;
}

/**
 * 取得亮點語錄（取 DAY 1, 7, 21 或最近的幾則）
 */
function getHighlightQuotes(studentHighlights) {
  const quotes = [];

  // 按日期排序
  const sorted = studentHighlights
    .map(h => ({
      date: new Date(String(h[3]).split(' ')[0]),
      content: h[5] || '',
    }))
    .filter(h => !isNaN(h.date.getTime()) && h.content)
    .sort((a, b) => a.date - b.date);

  // 取前幾則有內容的
  const selected = sorted.slice(0, 3);

  selected.forEach(h => {
    const dayNumber = Math.floor((h.date - CONFIG.COURSE_START_DATE) / (1000 * 60 * 60 * 24)) + 1;
    quotes.push({
      day: dayNumber,
      date: formatDate(h.date),
      content: h.content,
    });
  });

  return quotes;
}

/**
 * 格式化日期
 */
function formatDate(date) {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 取得或建立資料夾
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

// ========== HTML 模板（證書設計版）==========

function generateReportHTML(data) {
  const { name, totalDays, consecutiveDays, milestonesCount, milestones, checkedDates, highlights } = data;

  // 生成日曆 HTML
  let calendarHTML = '';
  for (let day = 1; day <= 35; day++) {
    const date = new Date(CONFIG.COURSE_START_DATE);
    date.setDate(date.getDate() + day - 1);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

    let dayClass = 'missed';
    if (checkedDates.has(day)) {
      dayClass = 'checked';
    }

    calendarHTML += `
      <div class="calendar-day ${dayClass}">
        <span class="calendar-day-number">${day}</span>
        <span class="calendar-day-date">${dateStr}</span>
      </div>`;
  }

  // 里程碑狀態
  const m7Class = milestones.day7 ? 'achieved' : 'locked';
  const m14Class = milestones.day14 ? 'achieved' : 'locked';
  const m21Class = milestones.day21 ? 'achieved' : 'locked';
  const m35Class = milestones.day35 ? 'achieved' : 'locked';

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(name)} - 結業證書</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Noto+Serif+TC:wght@600;700;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Noto Sans TC', sans-serif;
            background: #2C3E50;
            min-height: 100vh;
            padding: 20px;
        }

        @media print {
            body { background: white; padding: 0; }
            .certificate { margin: 0; box-shadow: none; }
            .no-print { display: none !important; }
        }

        .toolbar {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 100;
        }

        .toolbar button {
            padding: 14px 28px;
            background: linear-gradient(135deg, #FF6B35, #FF8C52);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(255,107,53,0.4);
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.2s;
        }

        .toolbar button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255,107,53,0.5);
        }

        .toolbar button i { width: 20px; height: 20px; }

        /* 證書主體 */
        .certificate {
            width: 297mm;
            height: 210mm;
            margin: 0 auto;
            background: linear-gradient(135deg, #FFFAF5 0%, #FFF8F0 50%, #FFFAF5 100%);
            position: relative;
            box-shadow: 0 25px 80px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        /* 裝飾邊框 */
        .certificate::before {
            content: '';
            position: absolute;
            top: 12px;
            left: 12px;
            right: 12px;
            bottom: 12px;
            border: 3px solid #FF6B35;
            border-radius: 8px;
            pointer-events: none;
        }

        .certificate::after {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 1px solid #FFB088;
            border-radius: 4px;
            pointer-events: none;
        }

        /* 角落裝飾 */
        .corner-decoration {
            position: absolute;
            width: 80px;
            height: 80px;
            opacity: 0.15;
        }

        .corner-decoration.top-left { top: 30px; left: 30px; }
        .corner-decoration.top-right { top: 30px; right: 30px; transform: rotate(90deg); }
        .corner-decoration.bottom-left { bottom: 30px; left: 30px; transform: rotate(-90deg); }
        .corner-decoration.bottom-right { bottom: 30px; right: 30px; transform: rotate(180deg); }

        .corner-decoration svg {
            width: 100%;
            height: 100%;
            fill: #FF6B35;
        }

        /* 內容區 */
        .certificate-content {
            position: relative;
            z-index: 1;
            height: 100%;
            display: flex;
            padding: 35px 50px;
            gap: 40px;
        }

        /* 左側：證書主體 */
        .cert-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        .cert-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #FF6B35, #FF8C52);
            color: white;
            padding: 8px 24px;
            border-radius: 25px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 15px;
        }

        .cert-badge i { width: 16px; height: 16px; }

        .cert-title {
            font-family: 'Noto Serif TC', serif;
            font-size: 52px;
            font-weight: 900;
            color: #2C3E50;
            margin-bottom: 8px;
            letter-spacing: 8px;
        }

        .cert-subtitle {
            font-size: 16px;
            color: #888;
            letter-spacing: 4px;
            margin-bottom: 30px;
        }

        .cert-name-section {
            margin: 20px 0 25px;
        }

        .cert-name-label {
            font-size: 14px;
            color: #999;
            margin-bottom: 8px;
        }

        .cert-name {
            font-family: 'Noto Serif TC', serif;
            font-size: 56px;
            font-weight: 900;
            color: #FF6B35;
            border-bottom: 3px solid #FF6B35;
            padding-bottom: 8px;
            display: inline-block;
            min-width: 280px;
        }

        .cert-description {
            font-size: 18px;
            color: #555;
            line-height: 2;
            max-width: 480px;
            margin-bottom: 25px;
        }

        .cert-stats {
            display: flex;
            justify-content: center;
            gap: 50px;
            margin-bottom: 25px;
        }

        .cert-stat {
            text-align: center;
        }

        .cert-stat-value {
            font-family: 'Noto Serif TC', serif;
            font-size: 48px;
            font-weight: 900;
            color: #FF6B35;
            line-height: 1;
        }

        .cert-stat-label {
            font-size: 13px;
            color: #888;
            margin-top: 5px;
        }

        .cert-date {
            font-size: 14px;
            color: #999;
            margin-top: 15px;
        }

        .cert-signature {
            margin-top: 20px;
            text-align: center;
        }

        .cert-signature-line {
            width: 160px;
            height: 1px;
            background: #CCC;
            margin: 0 auto 8px;
        }

        .cert-signature-name {
            font-size: 18px;
            font-weight: 700;
            color: #2C3E50;
        }

        .cert-signature-title {
            font-size: 12px;
            color: #999;
        }

        /* 右側：成就與日曆 */
        .cert-side {
            width: 320px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .side-card {
            background: white;
            border-radius: 16px;
            padding: 18px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .side-card-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
            color: #2C3E50;
            margin-bottom: 12px;
        }

        .side-card-title i {
            width: 18px;
            height: 18px;
            color: #FF6B35;
        }

        /* 里程碑 */
        .milestones-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }

        .milestone-badge {
            text-align: center;
            padding: 10px 5px;
            background: #F8F9FA;
            border-radius: 10px;
            border: 2px solid #E9ECEF;
        }

        .milestone-badge.achieved {
            background: linear-gradient(135deg, #FFF8E1, #FFECB3);
            border-color: #FFD93D;
        }

        .milestone-badge.locked { opacity: 0.35; }

        .milestone-badge i {
            width: 24px;
            height: 24px;
            margin-bottom: 4px;
        }

        .milestone-badge.achieved i.bronze { color: #CD7F32; }
        .milestone-badge.achieved i.silver { color: #A8A8A8; }
        .milestone-badge.achieved i.gold { color: #FFD700; }
        .milestone-badge.achieved i.platinum { color: #E5C100; }

        .milestone-days {
            font-size: 12px;
            font-weight: 700;
            color: #2C3E50;
        }

        /* 日曆 */
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }

        .calendar-header {
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            color: #FF6B35;
            padding: 4px 0;
        }

        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            background: #F5F5F5;
            border: 1px solid #E8E8E8;
        }

        .calendar-day.checked {
            background: linear-gradient(135deg, #4CAF50, #66BB6A);
            border-color: #388E3C;
            color: white;
        }

        .calendar-day.missed {
            background: white;
            color: #DDD;
        }

        .calendar-day-number {
            font-size: 11px;
            font-weight: 700;
            line-height: 1;
        }

        .calendar-day-date {
            font-size: 7px;
            opacity: 0.7;
        }

        /* 底部標語 */
        .cert-footer {
            position: absolute;
            bottom: 25px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 13px;
            color: #BBB;
            letter-spacing: 3px;
        }
    </style>
</head>
<body>
    <div class="toolbar no-print">
        <button onclick="window.print()">
            <i data-lucide="file-down"></i>
            列印 / 存成 PDF
        </button>
    </div>

    <div class="certificate">
        <!-- 角落裝飾 -->
        <div class="corner-decoration top-left">
            <svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z"/></svg>
        </div>
        <div class="corner-decoration top-right">
            <svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z"/></svg>
        </div>
        <div class="corner-decoration bottom-left">
            <svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z"/></svg>
        </div>
        <div class="corner-decoration bottom-right">
            <svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z"/></svg>
        </div>

        <div class="certificate-content">
            <!-- 左側：證書主體 -->
            <div class="cert-main">
                <div class="cert-badge">
                    <i data-lucide="award"></i>
                    CERTIFICATE OF COMPLETION
                </div>

                <h1 class="cert-title">結 業 證 書</h1>
                <p class="cert-subtitle">五週復盤習慣養成挑戰營</p>

                <div class="cert-name-section">
                    <div class="cert-name-label">茲證明</div>
                    <div class="cert-name">${escapeHtml(name)}</div>
                </div>

                <p class="cert-description">
                    已完成「五週復盤習慣養成挑戰營」全部課程，<br>
                    於 35 天挑戰期間展現卓越的堅持與毅力，<br>
                    成功養成每日復盤的良好習慣。
                </p>

                <div class="cert-stats">
                    <div class="cert-stat">
                        <div class="cert-stat-value">${totalDays}</div>
                        <div class="cert-stat-label">打卡天數</div>
                    </div>
                    <div class="cert-stat">
                        <div class="cert-stat-value">${consecutiveDays}</div>
                        <div class="cert-stat-label">最高連續</div>
                    </div>
                    <div class="cert-stat">
                        <div class="cert-stat-value">${milestonesCount}</div>
                        <div class="cert-stat-label">里程碑</div>
                    </div>
                </div>

                <div class="cert-date">結營日期：2026 年 4 月 7 日</div>

                <div class="cert-signature">
                    <div class="cert-signature-line"></div>
                    <div class="cert-signature-name">朱騏</div>
                    <div class="cert-signature-title">課程講師</div>
                </div>
            </div>

            <!-- 右側：成就與日曆 -->
            <div class="cert-side">
                <div class="side-card">
                    <div class="side-card-title">
                        <i data-lucide="medal"></i>
                        連續打卡里程碑
                    </div>
                    <div class="milestones-grid">
                        <div class="milestone-badge ${m7Class}">
                            <i data-lucide="medal" class="bronze"></i>
                            <div class="milestone-days">7天</div>
                        </div>
                        <div class="milestone-badge ${m14Class}">
                            <i data-lucide="medal" class="silver"></i>
                            <div class="milestone-days">14天</div>
                        </div>
                        <div class="milestone-badge ${m21Class}">
                            <i data-lucide="medal" class="gold"></i>
                            <div class="milestone-days">21天</div>
                        </div>
                        <div class="milestone-badge ${m35Class}">
                            <i data-lucide="trophy" class="platinum"></i>
                            <div class="milestone-days">35天</div>
                        </div>
                    </div>
                </div>

                <div class="side-card" style="flex: 1;">
                    <div class="side-card-title">
                        <i data-lucide="calendar-days"></i>
                        35 天打卡紀錄
                    </div>
                    <div class="calendar-grid">
                        <div class="calendar-header">一</div>
                        <div class="calendar-header">二</div>
                        <div class="calendar-header">三</div>
                        <div class="calendar-header">四</div>
                        <div class="calendar-header">五</div>
                        <div class="calendar-header">六</div>
                        <div class="calendar-header">日</div>
                        ${calendarHTML}
                    </div>
                </div>
            </div>
        </div>

        <div class="cert-footer">每天復盤，每天進步</div>
    </div>

    <script>
        lucide.createIcons();
    </script>
</body>
</html>`;
}

/**
 * HTML 特殊字元跳脫
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
