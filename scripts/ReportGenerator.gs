// prettier-ignore-start
/**
 * 五週復盤習慣養成挑戰營 - 結業證書 HTML 生成器
 *
 * 使用方式：
 * 1. 在 Google Sheets 中開啟「擴充功能」>「Apps Script」
 * 2. 將此程式碼貼入
 * 3. 執行 generateAllReports() 或 generateTestReport()
 * 4. HTML 檔案會存到 Google Drive 指定資料夾
 * 5. 在瀏覽器開啟 HTML 後截圖保存
 */

/* eslint-disable */

// ========== 配置區 ==========
var CONFIG = {
  COURSE_START_DATE: new Date('2026-03-02'),
  COURSE_END_DATE: new Date('2026-04-07'),
  STATS_SHEET_NAME: '\u6253\u5361\u7d71\u8a08',
  HIGHLIGHTS_SHEET_NAME: '\u8868\u55ae\u56de\u61c9',
  OUTPUT_FOLDER_PATH: '01_Projects/2026.Q1/2026 5 \u9031\u5fa9\u76e4\u7fd2\u6163\u990a\u6210\u6311\u6230\u71df (\u5fa9\u76e4\u966a\u8dd1)/5 \u9031\u5fa9\u76e4\u6311\u6230\u71df\u7d50\u71df\u5831\u544a',
};

// ========== 主要函數 ==========

function generateAllReports() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var statsSheet = ss.getSheetByName(CONFIG.STATS_SHEET_NAME);
  var highlightsSheet = ss.getSheetByName(CONFIG.HIGHLIGHTS_SHEET_NAME);

  if (!statsSheet || !highlightsSheet) {
    throw new Error('\u627e\u4e0d\u5230\u5de5\u4f5c\u8868');
  }

  var statsData = statsSheet.getDataRange().getValues();
  var highlightsData = highlightsSheet.getDataRange().getValues();
  statsData.shift();
  highlightsData.shift();

  var folder = getOrCreateFolderByPath(CONFIG.OUTPUT_FOLDER_PATH);

  var count = 0;
  for (var i = 0; i < statsData.length; i++) {
    var name = statsData[i][0];
    if (!name) continue;
    try {
      generateStudentReport(statsData[i], highlightsData, folder);
      count++;
      Logger.log('\u2705 \u5df2\u751f\u6210\uff1a' + name);
    } catch (e) {
      Logger.log('\u274c \u751f\u6210\u5931\u6557\uff1a' + name + ' - ' + e.message);
    }
  }

  Logger.log('\u5b8c\u6210\uff01\u5171\u751f\u6210 ' + count + ' \u4efd HTML \u5831\u544a');
}

function generateTestReport() {
  var studentName = '\u5fa9\u76e4\u5c0e\u904a-\u6731\u9a0e';
  generateSingleReport(studentName);
}

function generateSingleReport(studentName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var statsSheet = ss.getSheetByName(CONFIG.STATS_SHEET_NAME);
  var highlightsSheet = ss.getSheetByName(CONFIG.HIGHLIGHTS_SHEET_NAME);
  var statsData = statsSheet.getDataRange().getValues();
  var highlightsData = highlightsSheet.getDataRange().getValues();
  statsData.shift();
  highlightsData.shift();

  var student = null;
  for (var i = 0; i < statsData.length; i++) {
    if (statsData[i][0] === studentName) {
      student = statsData[i];
      break;
    }
  }
  if (!student) {
    throw new Error('\u627e\u4e0d\u5230\u5b78\u54e1\uff1a' + studentName);
  }

  var folder = getOrCreateFolderByPath(CONFIG.OUTPUT_FOLDER_PATH);
  generateStudentReport(student, highlightsData, folder);
  Logger.log('\u2705 \u5df2\u751f\u6210 HTML \u5831\u544a\uff1a' + studentName);
}

// ========== 報告生成邏輯 ==========

function generateStudentReport(student, highlightsData, folder) {
  var name = student[0];
  var totalDays = student[1] || 0;

  var studentHighlights = [];
  for (var i = 0; i < highlightsData.length; i++) {
    if (highlightsData[i][2] === name && isCheckinCompleted(highlightsData[i][4])) {
      studentHighlights.push(highlightsData[i]);
    }
  }

  var consecutiveDays = calculateConsecutiveDays(studentHighlights);

  var milestones = {
    day7: student[4] === '\u{1F3C6}',
    day14: student[5] === '\u{1F3C6}',
    day21: student[6] === '\u{1F3C6}',
    day35: student[7] === '\u{1F3C6}',
  };
  var milestonesCount = 0;
  if (milestones.day7) milestonesCount++;
  if (milestones.day14) milestonesCount++;
  if (milestones.day21) milestonesCount++;
  if (milestones.day35) milestonesCount++;

  var checkedDates = getCheckedDates(studentHighlights);

  var html = generateReportHTML({
    name: name,
    totalDays: totalDays,
    consecutiveDays: consecutiveDays,
    milestonesCount: milestonesCount,
    milestones: milestones,
    checkedDates: checkedDates,
  });

  var fileName = name + '_\u7d50\u696d\u8b49\u66f8.html';
  var blob = Utilities.newBlob(html, 'text/html', fileName);

  var existingFiles = folder.getFilesByName(fileName);
  while (existingFiles.hasNext()) {
    existingFiles.next().setTrashed(true);
  }

  folder.createFile(blob);
}

function isCheckinCompleted(status) {
  if (!status) return false;
  var s = String(status).toLowerCase();
  return s.indexOf('yes') >= 0 ||
         s.indexOf('\u2705') >= 0 ||
         (s.indexOf('\u662f') >= 0 && s.indexOf('\u5b8c\u6210') >= 0);
}

function calculateConsecutiveDays(studentHighlights) {
  if (studentHighlights.length === 0) return 0;

  var dates = [];
  for (var i = 0; i < studentHighlights.length; i++) {
    var h = studentHighlights[i];
    var date;
    if (h[3] instanceof Date) {
      date = h[3];
    } else {
      var dateStr = String(h[3]).split(' ')[0];
      date = new Date(dateStr);
    }
    if (!isNaN(date.getTime())) {
      dates.push(date);
    }
  }

  dates.sort(function(a, b) { return a - b; });
  if (dates.length === 0) return 0;

  var dateStrs = {};
  var uniqueDates = [];
  for (var i = 0; i < dates.length; i++) {
    var ds = dates[i].toISOString().split('T')[0];
    if (!dateStrs[ds]) {
      dateStrs[ds] = true;
      uniqueDates.push(ds);
    }
  }
  uniqueDates.sort();

  var maxConsecutive = 1;
  var currentConsecutive = 1;

  for (var i = 1; i < uniqueDates.length; i++) {
    var prev = new Date(uniqueDates[i - 1]);
    var curr = new Date(uniqueDates[i]);
    var diffDays = (curr - prev) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentConsecutive++;
      if (currentConsecutive > maxConsecutive) maxConsecutive = currentConsecutive;
    } else {
      currentConsecutive = 1;
    }
  }

  return maxConsecutive;
}

function getCheckedDates(studentHighlights) {
  var dates = {};

  for (var i = 0; i < studentHighlights.length; i++) {
    var h = studentHighlights[i];
    var date;
    if (h[3] instanceof Date) {
      date = h[3];
    } else {
      var dateStr = String(h[3]).split(' ')[0];
      date = new Date(dateStr);
    }

    if (!isNaN(date.getTime())) {
      var dayNumber = Math.floor((date - CONFIG.COURSE_START_DATE) / (1000 * 60 * 60 * 24)) + 1;
      if (dayNumber >= 1 && dayNumber <= 35) {
        dates[dayNumber] = true;
      }
    }
  }

  return dates;
}

function getOrCreateFolderByPath(path) {
  var folderNames = path.split('/');
  var currentFolder = DriveApp.getRootFolder();

  for (var i = 0; i < folderNames.length; i++) {
    var folderName = folderNames[i].trim();
    if (!folderName) continue;
    var folders = currentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      currentFolder = folders.next();
    } else {
      currentFolder = currentFolder.createFolder(folderName);
    }
  }

  return currentFolder;
}

// ========== HTML 模板（瀏覽器截圖版）==========

function generateReportHTML(data) {
  var name = data.name;
  var totalDays = data.totalDays;
  var consecutiveDays = data.consecutiveDays;
  var milestonesCount = data.milestonesCount;
  var milestones = data.milestones;
  var checkedDates = data.checkedDates;

  // 生成日曆 HTML
  var calendarHTML = '';
  for (var day = 1; day <= 35; day++) {
    var date = new Date(CONFIG.COURSE_START_DATE);
    date.setDate(date.getDate() + day - 1);
    var dateStr = (date.getMonth() + 1) + '/' + date.getDate();

    var isChecked = checkedDates[day] === true;
    var dayClass = isChecked ? 'checked' : 'missed';

    calendarHTML += '<div class="calendar-day ' + dayClass + '">' +
      '<span class="calendar-day-number">' + day + '</span>' +
      '<span class="calendar-day-date">' + dateStr + '</span>' +
      '</div>';
  }

  // 里程碑狀態
  var m7Class = milestones.day7 ? 'achieved' : 'locked';
  var m14Class = milestones.day14 ? 'achieved' : 'locked';
  var m21Class = milestones.day21 ? 'achieved' : 'locked';
  var m35Class = milestones.day35 ? 'achieved' : 'locked';

  return '<!DOCTYPE html>\n' +
'<html lang="zh-TW">\n' +
'<head>\n' +
'    <meta charset="UTF-8">\n' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'    <title>' + escapeHtml(name) + ' - \u7d50\u696d\u8b49\u66f8</title>\n' +
'    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Noto+Serif+TC:wght@600;700;900&display=swap" rel="stylesheet">\n' +
'    <script src="https://unpkg.com/lucide@latest"><\/script>\n' +
'    <style>\n' +
'        * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
'        body {\n' +
'            font-family: "Noto Sans TC", sans-serif;\n' +
'            background: #2C3E50;\n' +
'            min-height: 100vh;\n' +
'            display: flex;\n' +
'            align-items: center;\n' +
'            justify-content: center;\n' +
'            padding: 40px 20px;\n' +
'        }\n' +
'        .certificate {\n' +
'            width: 1120px;\n' +
'            height: 790px;\n' +
'            background: linear-gradient(135deg, #FFFAF5 0%, #FFF8F0 50%, #FFFAF5 100%);\n' +
'            position: relative;\n' +
'            box-shadow: 0 25px 80px rgba(0,0,0,0.3);\n' +
'            overflow: hidden;\n' +
'        }\n' +
'        .certificate::before {\n' +
'            content: "";\n' +
'            position: absolute;\n' +
'            top: 12px; left: 12px; right: 12px; bottom: 12px;\n' +
'            border: 3px solid #FF6B35;\n' +
'            border-radius: 8px;\n' +
'            pointer-events: none;\n' +
'        }\n' +
'        .certificate::after {\n' +
'            content: "";\n' +
'            position: absolute;\n' +
'            top: 20px; left: 20px; right: 20px; bottom: 20px;\n' +
'            border: 1px solid #FFB088;\n' +
'            border-radius: 4px;\n' +
'            pointer-events: none;\n' +
'        }\n' +
'        .corner-decoration {\n' +
'            position: absolute;\n' +
'            width: 80px; height: 80px;\n' +
'            opacity: 0.15;\n' +
'        }\n' +
'        .corner-decoration.top-left { top: 30px; left: 30px; }\n' +
'        .corner-decoration.top-right { top: 30px; right: 30px; transform: rotate(90deg); }\n' +
'        .corner-decoration.bottom-left { bottom: 30px; left: 30px; transform: rotate(-90deg); }\n' +
'        .corner-decoration.bottom-right { bottom: 30px; right: 30px; transform: rotate(180deg); }\n' +
'        .corner-decoration svg { width: 100%; height: 100%; fill: #FF6B35; }\n' +
'        .certificate-content {\n' +
'            position: relative;\n' +
'            z-index: 1;\n' +
'            height: 100%;\n' +
'            display: flex;\n' +
'            padding: 35px 50px;\n' +
'            gap: 40px;\n' +
'        }\n' +
'        .cert-main {\n' +
'            flex: 1;\n' +
'            display: flex;\n' +
'            flex-direction: column;\n' +
'            align-items: center;\n' +
'            justify-content: center;\n' +
'            text-align: center;\n' +
'        }\n' +
'        .cert-badge {\n' +
'            display: inline-flex;\n' +
'            align-items: center;\n' +
'            gap: 8px;\n' +
'            background: linear-gradient(135deg, #FF6B35, #FF8C52);\n' +
'            color: white;\n' +
'            padding: 8px 24px;\n' +
'            border-radius: 25px;\n' +
'            font-size: 13px;\n' +
'            font-weight: 700;\n' +
'            letter-spacing: 2px;\n' +
'            margin-bottom: 15px;\n' +
'        }\n' +
'        .cert-badge i { width: 16px; height: 16px; }\n' +
'        .cert-title {\n' +
'            font-family: "Noto Serif TC", serif;\n' +
'            font-size: 52px;\n' +
'            font-weight: 900;\n' +
'            color: #2C3E50;\n' +
'            margin-bottom: 8px;\n' +
'            letter-spacing: 8px;\n' +
'        }\n' +
'        .cert-subtitle {\n' +
'            font-size: 16px;\n' +
'            color: #888;\n' +
'            letter-spacing: 4px;\n' +
'            margin-bottom: 30px;\n' +
'        }\n' +
'        .cert-name-section { margin: 20px 0 25px; }\n' +
'        .cert-name-label { font-size: 14px; color: #999; margin-bottom: 8px; }\n' +
'        .cert-name {\n' +
'            font-family: "Noto Serif TC", serif;\n' +
'            font-size: 56px;\n' +
'            font-weight: 900;\n' +
'            color: #FF6B35;\n' +
'            border-bottom: 3px solid #FF6B35;\n' +
'            padding-bottom: 8px;\n' +
'            display: inline-block;\n' +
'            min-width: 280px;\n' +
'        }\n' +
'        .cert-description {\n' +
'            font-size: 18px;\n' +
'            color: #555;\n' +
'            line-height: 2;\n' +
'            max-width: 480px;\n' +
'            margin-bottom: 25px;\n' +
'        }\n' +
'        .cert-stats {\n' +
'            display: flex;\n' +
'            justify-content: center;\n' +
'            gap: 50px;\n' +
'            margin-bottom: 25px;\n' +
'        }\n' +
'        .cert-stat { text-align: center; }\n' +
'        .cert-stat-value {\n' +
'            font-family: "Noto Serif TC", serif;\n' +
'            font-size: 48px;\n' +
'            font-weight: 900;\n' +
'            color: #FF6B35;\n' +
'            line-height: 1;\n' +
'        }\n' +
'        .cert-stat-label { font-size: 13px; color: #888; margin-top: 5px; }\n' +
'        .cert-date { font-size: 14px; color: #999; margin-top: 15px; }\n' +
'        .cert-signature { margin-top: 20px; text-align: center; }\n' +
'        .cert-signature-line {\n' +
'            width: 160px; height: 1px;\n' +
'            background: #CCC;\n' +
'            margin: 0 auto 8px;\n' +
'        }\n' +
'        .cert-signature-name { font-size: 18px; font-weight: 700; color: #2C3E50; }\n' +
'        .cert-signature-title { font-size: 12px; color: #999; }\n' +
'        .cert-side {\n' +
'            width: 320px;\n' +
'            display: flex;\n' +
'            flex-direction: column;\n' +
'            gap: 15px;\n' +
'        }\n' +
'        .side-card {\n' +
'            background: white;\n' +
'            border-radius: 16px;\n' +
'            padding: 18px;\n' +
'            box-shadow: 0 4px 20px rgba(0,0,0,0.06);\n' +
'        }\n' +
'        .side-card-title {\n' +
'            display: flex;\n' +
'            align-items: center;\n' +
'            gap: 8px;\n' +
'            font-size: 14px;\n' +
'            font-weight: 700;\n' +
'            color: #2C3E50;\n' +
'            margin-bottom: 12px;\n' +
'        }\n' +
'        .side-card-title i { width: 18px; height: 18px; color: #FF6B35; }\n' +
'        .milestones-grid {\n' +
'            display: grid;\n' +
'            grid-template-columns: repeat(4, 1fr);\n' +
'            gap: 8px;\n' +
'        }\n' +
'        .milestone-badge {\n' +
'            text-align: center;\n' +
'            padding: 10px 5px;\n' +
'            background: #F8F9FA;\n' +
'            border-radius: 10px;\n' +
'            border: 2px solid #E9ECEF;\n' +
'        }\n' +
'        .milestone-badge.achieved {\n' +
'            background: linear-gradient(135deg, #FFF8E1, #FFECB3);\n' +
'            border-color: #FFD93D;\n' +
'        }\n' +
'        .milestone-badge.locked { opacity: 0.35; }\n' +
'        .milestone-badge i { width: 24px; height: 24px; margin-bottom: 4px; }\n' +
'        .milestone-badge.achieved i.bronze { color: #CD7F32; }\n' +
'        .milestone-badge.achieved i.silver { color: #A8A8A8; }\n' +
'        .milestone-badge.achieved i.gold { color: #FFD700; }\n' +
'        .milestone-badge.achieved i.platinum { color: #E5C100; }\n' +
'        .milestone-days { font-size: 12px; font-weight: 700; color: #2C3E50; }\n' +
'        .calendar-grid {\n' +
'            display: grid;\n' +
'            grid-template-columns: repeat(7, 1fr);\n' +
'            gap: 4px;\n' +
'        }\n' +
'        .calendar-header {\n' +
'            text-align: center;\n' +
'            font-size: 10px;\n' +
'            font-weight: 700;\n' +
'            color: #FF6B35;\n' +
'            padding: 4px 0;\n' +
'        }\n' +
'        .calendar-day {\n' +
'            aspect-ratio: 1;\n' +
'            display: flex;\n' +
'            flex-direction: column;\n' +
'            align-items: center;\n' +
'            justify-content: center;\n' +
'            border-radius: 6px;\n' +
'            background: #F5F5F5;\n' +
'            border: 1px solid #E8E8E8;\n' +
'        }\n' +
'        .calendar-day.checked {\n' +
'            background: linear-gradient(135deg, #4CAF50, #66BB6A);\n' +
'            border-color: #388E3C;\n' +
'            color: white;\n' +
'        }\n' +
'        .calendar-day.missed { background: white; color: #DDD; }\n' +
'        .calendar-day-number { font-size: 11px; font-weight: 700; line-height: 1; }\n' +
'        .calendar-day-date { font-size: 7px; opacity: 0.7; }\n' +
'        .cert-footer {\n' +
'            position: absolute;\n' +
'            bottom: 25px; left: 0; right: 0;\n' +
'            text-align: center;\n' +
'            font-size: 13px;\n' +
'            color: #BBB;\n' +
'            letter-spacing: 3px;\n' +
'        }\n' +
'    </style>\n' +
'</head>\n' +
'<body>\n' +
'    <div class="certificate">\n' +
'        <div class="corner-decoration top-left"><svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z"/></svg></div>\n' +
'        <div class="corner-decoration top-right"><svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z"/></svg></div>\n' +
'        <div class="corner-decoration bottom-left"><svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z"/></svg></div>\n' +
'        <div class="corner-decoration bottom-right"><svg viewBox="0 0 100 100"><path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z"/></svg></div>\n' +
'\n' +
'        <div class="certificate-content">\n' +
'            <div class="cert-main">\n' +
'                <div class="cert-badge">\n' +
'                    <i data-lucide="award"></i>\n' +
'                    CERTIFICATE OF COMPLETION\n' +
'                </div>\n' +
'                <h1 class="cert-title">\u7d50 \u696d \u8b49 \u66f8</h1>\n' +
'                <p class="cert-subtitle">\u4e94\u9031\u5fa9\u76e4\u7fd2\u6163\u990a\u6210\u6311\u6230\u71df</p>\n' +
'                <div class="cert-name-section">\n' +
'                    <div class="cert-name-label">\u8332\u8b49\u660e</div>\n' +
'                    <div class="cert-name">' + escapeHtml(name) + '</div>\n' +
'                </div>\n' +
'                <p class="cert-description">\n' +
'                    \u5df2\u5b8c\u6210\u300c\u4e94\u9031\u5fa9\u76e4\u7fd2\u6163\u990a\u6210\u6311\u6230\u71df\u300d\u5168\u90e8\u8ab2\u7a0b\uff0c<br>\n' +
'                    \u65bc 35 \u5929\u6311\u6230\u671f\u9593\u5c55\u73fe\u5353\u8d8a\u7684\u5805\u6301\u8207\u6bc5\u529b\uff0c<br>\n' +
'                    \u6210\u529f\u990a\u6210\u6bcf\u65e5\u5fa9\u76e4\u7684\u826f\u597d\u7fd2\u6163\u3002\n' +
'                </p>\n' +
'                <div class="cert-stats">\n' +
'                    <div class="cert-stat">\n' +
'                        <div class="cert-stat-value">' + totalDays + '</div>\n' +
'                        <div class="cert-stat-label">\u6253\u5361\u5929\u6578</div>\n' +
'                    </div>\n' +
'                    <div class="cert-stat">\n' +
'                        <div class="cert-stat-value">' + consecutiveDays + '</div>\n' +
'                        <div class="cert-stat-label">\u6700\u9ad8\u9023\u7e8c</div>\n' +
'                    </div>\n' +
'                    <div class="cert-stat">\n' +
'                        <div class="cert-stat-value">' + milestonesCount + '</div>\n' +
'                        <div class="cert-stat-label">\u91cc\u7a0b\u7891</div>\n' +
'                    </div>\n' +
'                </div>\n' +
'                <div class="cert-date">\u7d50\u71df\u65e5\u671f\uff1a2026 \u5e74 4 \u6708 7 \u65e5</div>\n' +
'                <div class="cert-signature">\n' +
'                    <div class="cert-signature-line"></div>\n' +
'                    <div class="cert-signature-name">\u6731\u9a0e</div>\n' +
'                    <div class="cert-signature-title">\u8ab2\u7a0b\u8b1b\u5e2b</div>\n' +
'                </div>\n' +
'            </div>\n' +
'            <div class="cert-side">\n' +
'                <div class="side-card">\n' +
'                    <div class="side-card-title">\n' +
'                        <i data-lucide="medal"></i>\n' +
'                        \u9023\u7e8c\u6253\u5361\u91cc\u7a0b\u7891\n' +
'                    </div>\n' +
'                    <div class="milestones-grid">\n' +
'                        <div class="milestone-badge ' + m7Class + '"><i data-lucide="medal" class="bronze"></i><div class="milestone-days">7 \u5929</div></div>\n' +
'                        <div class="milestone-badge ' + m14Class + '"><i data-lucide="medal" class="silver"></i><div class="milestone-days">14 \u5929</div></div>\n' +
'                        <div class="milestone-badge ' + m21Class + '"><i data-lucide="medal" class="gold"></i><div class="milestone-days">21 \u5929</div></div>\n' +
'                        <div class="milestone-badge ' + m35Class + '"><i data-lucide="trophy" class="platinum"></i><div class="milestone-days">35 \u5929</div></div>\n' +
'                    </div>\n' +
'                </div>\n' +
'                <div class="side-card" style="flex: 1;">\n' +
'                    <div class="side-card-title">\n' +
'                        <i data-lucide="calendar-days"></i>\n' +
'                        35 \u5929\u6253\u5361\u7d00\u9304\n' +
'                    </div>\n' +
'                    <div class="calendar-grid">\n' +
'                        <div class="calendar-header">\u4e00</div>\n' +
'                        <div class="calendar-header">\u4e8c</div>\n' +
'                        <div class="calendar-header">\u4e09</div>\n' +
'                        <div class="calendar-header">\u56db</div>\n' +
'                        <div class="calendar-header">\u4e94</div>\n' +
'                        <div class="calendar-header">\u516d</div>\n' +
'                        <div class="calendar-header">\u65e5</div>\n' +
'                        ' + calendarHTML + '\n' +
'                    </div>\n' +
'                </div>\n' +
'            </div>\n' +
'        </div>\n' +
'        <div class="cert-footer">\u6bcf\u5929\u5fa9\u76e4\uff0c\u6bcf\u5929\u9032\u6b65</div>\n' +
'    </div>\n' +
'    <script>lucide.createIcons();<\/script>\n' +
'</body>\n' +
'</html>';
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
// prettier-ignore-end
