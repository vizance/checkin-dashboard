/**
 * 五週復盤習慣養成挑戰營 - 入營宣誓卡生成器
 *
 * 使用方式：
 * 1. 建立 Google Form 收集學員報名資料，包含「姓名」和「挑戰宣言」
 * 2. 將表單回應連結到 Google Sheets
 * 3. 在 Google Sheets 中開啟「擴充功能」>「Apps Script」
 * 4. 將此程式碼貼入
 * 5. 執行 generateAllPledgeCards() 函數
 * 6. HTML 檔案會存到 Google Drive 的「復盤挑戰營宣誓卡」資料夾
 */

// ========== 配置區 ==========
const PLEDGE_CONFIG = {
  // 活動日期
  COURSE_START_DATE: new Date('2026-03-02'),
  COURSE_END_DATE: new Date('2026-04-07'),

  // 工作表名稱（表單回應的工作表）
  // 請依照你的表單回應工作表名稱調整
  PLEDGE_SHEET_NAME: '報名表單回應',

  // 欄位對應（從 0 開始計算）
  // 請依照你的表單欄位順序調整
  COLUMNS: {
    TIMESTAMP: 0,    // 時間戳記
    NAME: 1,         // 姓名
    PLEDGE: 2,       // 挑戰宣言
  },

  // Google Drive 資料夾名稱
  OUTPUT_FOLDER_NAME: '復盤挑戰營宣誓卡',
};

// ========== 主要函數 ==========

/**
 * 生成所有學員的宣誓卡
 */
function generateAllPledgeCards() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 取得資料
  const pledgeSheet = ss.getSheetByName(PLEDGE_CONFIG.PLEDGE_SHEET_NAME);

  if (!pledgeSheet) {
    throw new Error(`找不到工作表「${PLEDGE_CONFIG.PLEDGE_SHEET_NAME}」，請確認 PLEDGE_CONFIG 中的工作表名稱是否正確`);
  }

  const data = pledgeSheet.getDataRange().getValues();

  // 移除標題列
  data.shift();

  // 建立或取得輸出資料夾
  const folder = getOrCreatePledgeFolder(PLEDGE_CONFIG.OUTPUT_FOLDER_NAME);

  // 生成每位學員的宣誓卡
  let count = 0;
  for (const row of data) {
    const name = row[PLEDGE_CONFIG.COLUMNS.NAME];
    const pledge = row[PLEDGE_CONFIG.COLUMNS.PLEDGE] || '我要養成每日復盤的好習慣！';

    if (!name) continue;

    try {
      generatePledgeCard(name, pledge, folder);
      count++;
      Logger.log(`✅ 已生成：${name}`);
    } catch (e) {
      Logger.log(`❌ 生成失敗：${name} - ${e.message}`);
    }
  }

  Logger.log(`\n🎉 完成！共生成 ${count} 份宣誓卡`);
  Logger.log(`📁 位置：Google Drive > ${PLEDGE_CONFIG.OUTPUT_FOLDER_NAME}`);
  Logger.log(`\n📌 下一步：`);
  Logger.log(`   1. 開啟 Google Drive 的「${PLEDGE_CONFIG.OUTPUT_FOLDER_NAME}」資料夾`);
  Logger.log(`   2. 對 HTML 檔案按右鍵 → 開啟方式 → 在新視窗中預覽`);
  Logger.log(`   3. 點擊右上角「列印 / 存成 PDF」按鈕`);
}

/**
 * 生成單一學員的宣誓卡（用於測試）
 * @param {string} studentName - 學員姓名
 * @param {string} pledge - 挑戰宣言（選填）
 */
function generateSinglePledgeCard(studentName, pledge) {
  pledge = pledge || '我要養成每日復盤的好習慣！';

  const folder = getOrCreatePledgeFolder(PLEDGE_CONFIG.OUTPUT_FOLDER_NAME);
  generatePledgeCard(studentName, pledge, folder);

  Logger.log(`✅ 已生成宣誓卡：${studentName}`);
  Logger.log(`📁 位置：Google Drive > ${PLEDGE_CONFIG.OUTPUT_FOLDER_NAME}`);
}

// ========== 宣誓卡生成邏輯 ==========

/**
 * 生成單一學員的宣誓卡
 */
function generatePledgeCard(name, pledge, folder) {
  // 生成日曆 HTML
  let calendarHTML = '';
  for (let day = 1; day <= 35; day++) {
    const date = new Date(PLEDGE_CONFIG.COURSE_START_DATE);
    date.setDate(date.getDate() + day - 1);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

    calendarHTML += `
      <div class="calendar-day">
        <span class="calendar-day-number">${day}</span>
        <span class="calendar-day-date">${dateStr}</span>
      </div>`;
  }

  // 生成 HTML
  const html = generatePledgeCardHTML(name, pledge, calendarHTML);

  // 儲存為 HTML 檔案
  const blob = Utilities.newBlob(html, 'text/html', `${name}_入營宣誓卡.html`);

  // 檢查是否已存在同名檔案，若有則刪除
  const existingFiles = folder.getFilesByName(`${name}_入營宣誓卡.html`);
  while (existingFiles.hasNext()) {
    existingFiles.next().setTrashed(true);
  }

  folder.createFile(blob);
}

/**
 * 取得或建立資料夾
 */
function getOrCreatePledgeFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * HTML 特殊字元跳脫
 */
function escapePledgeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ========== HTML 模板 ==========

function generatePledgeCardHTML(name, pledge, calendarHTML) {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapePledgeHtml(name)} - 入營宣誓卡</title>
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

        .certificate {
            width: 297mm;
            height: 210mm;
            margin: 0 auto;
            background: linear-gradient(135deg, #FFF8F0 0%, #FFFAF5 50%, #FFF5EB 100%);
            position: relative;
            box-shadow: 0 25px 80px rgba(0,0,0,0.3);
            overflow: hidden;
        }

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

        .certificate-content {
            position: relative;
            z-index: 1;
            height: 100%;
            display: flex;
            padding: 35px 50px;
            gap: 40px;
        }

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
            font-size: 48px;
            font-weight: 900;
            color: #2C3E50;
            margin-bottom: 8px;
            letter-spacing: 6px;
        }

        .cert-subtitle {
            font-size: 16px;
            color: #888;
            letter-spacing: 4px;
            margin-bottom: 25px;
        }

        .cert-name-section { margin: 15px 0 20px; }
        .cert-name-label { font-size: 14px; color: #999; margin-bottom: 8px; }

        .cert-name {
            font-family: 'Noto Serif TC', serif;
            font-size: 52px;
            font-weight: 900;
            color: #FF6B35;
            border-bottom: 3px solid #FF6B35;
            padding-bottom: 8px;
            display: inline-block;
            min-width: 260px;
        }

        .cert-pledge-section {
            background: white;
            border-radius: 16px;
            padding: 20px 30px;
            margin: 20px 0;
            max-width: 460px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            border-left: 4px solid #FF6B35;
        }

        .cert-pledge-label {
            font-size: 13px;
            color: #999;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .cert-pledge-label i { width: 14px; height: 14px; color: #FF6B35; }

        .cert-pledge-text {
            font-size: 18px;
            color: #2C3E50;
            line-height: 1.8;
            font-style: italic;
        }

        .cert-commitment {
            margin-top: 20px;
            font-size: 15px;
            color: #666;
            line-height: 1.8;
        }

        .cert-date { font-size: 14px; color: #999; margin-top: 15px; }

        .cert-signature { margin-top: 18px; text-align: center; }
        .cert-signature-label { font-size: 12px; color: #BBB; margin-bottom: 5px; }
        .cert-signature-line { width: 180px; height: 1px; background: #CCC; margin: 0 auto; }
        .cert-signature-hint { font-size: 11px; color: #CCC; margin-top: 5px; }

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

        .side-card-title i { width: 18px; height: 18px; color: #FF6B35; }

        .milestones-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }

        .milestone-badge {
            text-align: center;
            padding: 12px 5px;
            background: #F8F9FA;
            border-radius: 10px;
            border: 2px dashed #DDD;
            opacity: 0.6;
        }

        .milestone-badge i { width: 26px; height: 26px; margin-bottom: 4px; color: #CCC; }
        .milestone-days { font-size: 12px; font-weight: 700; color: #999; }
        .milestone-status { font-size: 10px; color: #BBB; margin-top: 2px; }

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
            background: white;
            border: 1px dashed #DDD;
        }

        .calendar-day-number { font-size: 11px; font-weight: 700; color: #BBB; line-height: 1; }
        .calendar-day-date { font-size: 7px; color: #CCC; }

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

        .motivation-banner {
            background: linear-gradient(135deg, #FF6B35, #FF8C52);
            color: white;
            text-align: center;
            padding: 12px 20px;
            border-radius: 12px;
            margin-top: auto;
        }

        .motivation-text { font-size: 15px; font-weight: 700; letter-spacing: 1px; }
        .motivation-sub { font-size: 11px; opacity: 0.9; margin-top: 4px; }
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
            <div class="cert-main">
                <div class="cert-badge">
                    <i data-lucide="rocket"></i>
                    CHALLENGE BEGINS
                </div>

                <h1 class="cert-title">入 營 宣 誓 卡</h1>
                <p class="cert-subtitle">五週復盤習慣養成挑戰營</p>

                <div class="cert-name-section">
                    <div class="cert-name-label">挑戰者</div>
                    <div class="cert-name">${escapePledgeHtml(name)}</div>
                </div>

                <div class="cert-pledge-section">
                    <div class="cert-pledge-label">
                        <i data-lucide="quote"></i>
                        我的挑戰宣言
                    </div>
                    <div class="cert-pledge-text">
                        「${escapePledgeHtml(pledge)}」
                    </div>
                </div>

                <div class="cert-commitment">
                    我承諾在接下來的 35 天裡，<br>
                    每天花時間復盤、記錄、成長。
                </div>

                <div class="cert-date">挑戰期間：2026/03/02 - 2026/04/07</div>

                <div class="cert-signature">
                    <div class="cert-signature-label">挑戰者簽名</div>
                    <div class="cert-signature-line"></div>
                    <div class="cert-signature-hint">於開營日簽署</div>
                </div>
            </div>

            <div class="cert-side">
                <div class="side-card">
                    <div class="side-card-title">
                        <i data-lucide="lock"></i>
                        待解鎖里程碑
                    </div>
                    <div class="milestones-grid">
                        <div class="milestone-badge">
                            <i data-lucide="medal"></i>
                            <div class="milestone-days">7天</div>
                            <div class="milestone-status">待解鎖</div>
                        </div>
                        <div class="milestone-badge">
                            <i data-lucide="medal"></i>
                            <div class="milestone-days">14天</div>
                            <div class="milestone-status">待解鎖</div>
                        </div>
                        <div class="milestone-badge">
                            <i data-lucide="medal"></i>
                            <div class="milestone-days">21天</div>
                            <div class="milestone-status">待解鎖</div>
                        </div>
                        <div class="milestone-badge">
                            <i data-lucide="trophy"></i>
                            <div class="milestone-days">35天</div>
                            <div class="milestone-status">待解鎖</div>
                        </div>
                    </div>
                </div>

                <div class="side-card" style="flex: 1;">
                    <div class="side-card-title">
                        <i data-lucide="calendar-days"></i>
                        35 天打卡挑戰
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

                <div class="motivation-banner">
                    <div class="motivation-text">35 天後，遇見更好的自己</div>
                    <div class="motivation-sub">每一天的堅持，都是對自己的承諾</div>
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
