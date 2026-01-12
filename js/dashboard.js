/**
 * Dashboard 業務邏輯模組
 * 包含所有統計、渲染和互動功能
 */

import {
    TEST_TODAY_DATE,
    COURSE_START_DATE,
    SHEET_ID,
    STATS_GID,
    HIGHLIGHTS_GID,
    statsData,
    highlightsData
} from './config.js';

// ============================================
// 渲染整體進度看板
// ============================================
export function renderStatsBanner() {
    const totalStudents = statsData.length;
    const checkedStudents = getTodayCheckedStudents();
    const todayCheckins = checkedStudents.length;
    const todayRate = totalStudents > 0 ? Math.round((todayCheckins / totalStudents) * 100) : 0;

    // 更新總學員數
    document.getElementById('totalStudents').textContent = totalStudents;

    // 更新目前時間
    updateDateTime();

    // 更新今日打卡狀況
    document.getElementById('todayCheckins').textContent = todayCheckins;
    document.getElementById('todayCheckinsTotal').textContent = totalStudents;
    document.getElementById('todayRateInline').textContent = todayRate;

    // 更新進度條
    const progressBar = document.getElementById('todayProgress');
    progressBar.style.width = todayRate + '%';

    console.log(`Stats Banner: ${totalStudents} 位學員, 今日 ${todayCheckins} 人打卡 (${todayRate}%)`);
}

/**
 * 更新目前日期時間
 */
export function updateDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const timeString = `${year}/${month}/${day} ${hours}:${minutes}`;

    // 更新到內層的 strong 元素（使用者修改了 HTML 結構）
    const element = document.getElementById('currentDateTimeValue');
    if (element) {
        element.textContent = timeString;
    }
}

function getTodayCheckedStudents() {
    // 使用測試日期或真實日期
    const today = TEST_TODAY_DATE ? new Date(TEST_TODAY_DATE) : new Date();
    today.setHours(0, 0, 0, 0);

    console.log('=== 今日打卡檢查開始 ===');
    console.log('今天的日期（timestamp）:', today.getTime(), '=', today.toLocaleDateString());
    if (TEST_TODAY_DATE) {
        console.log('⚠️ 測試模式：使用模擬日期');
    }

    const checkedStudents = new Set();

    highlightsData.forEach((highlight, index) => {
        if (!highlight[0] || !highlight[1]) return;

        const originalDateStr = highlight[0];
        const studentName = highlight[1];

        // 處理 Google Sheets 的日期時間格式 (例如: "2026/1/9 下午 4:52:25")
        // 先提取空格前的日期部分
        const dateOnly = originalDateStr.trim().split(' ')[0];

        // 解析日期
        let highlightDate = new Date(dateOnly);

        // 如果解析失敗，嘗試其他格式
        if (isNaN(highlightDate.getTime())) {
            const parts = dateOnly.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    // YYYY-MM-DD 或 YYYY/M/D
                    highlightDate = new Date(parts[0], parts[1] - 1, parts[2]);
                } else {
                    // MM/DD/YYYY
                    highlightDate = new Date(parts[2], parts[0] - 1, parts[1]);
                }
            }
        }

        if (isNaN(highlightDate.getTime())) {
            if (index < 5) { // 只顯示前 5 筆，避免 console 太多
                console.warn(`[${index}] 無法解析日期: "${originalDateStr}"`);
            }
            return;
        }

        highlightDate.setHours(0, 0, 0, 0);

        // 顯示前 5 筆的比對結果
        if (index < 5) {
            console.log(`[${index}] ${studentName}: 原始="${originalDateStr}" → 解析後=${highlightDate.toLocaleDateString()} (${highlightDate.getTime()}) → 是今天？${highlightDate.getTime() === today.getTime()}`);
        }

        // 如果是今天，加入已打卡名單
        if (highlightDate.getTime() === today.getTime()) {
            checkedStudents.add(studentName);
        }
    });

    const result = Array.from(checkedStudents);
    console.log('今日已打卡學員:', result);
    console.log('=== 今日打卡檢查結束 ===\n');

    return result;
}

// ============================================
// 打卡熱力圖
// ============================================

/**
 * 計算指定日期的打卡率
 * @param {Date} date - 要計算的日期
 * @returns {Object} { count, total, rate }
 */
function getCheckinRateForDate(date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const totalStudents = statsData.length;
    let checkedCount = 0;

    // 統計該日期有多少人打卡
    highlightsData.forEach(highlight => {
        if (!highlight[0]) return;

        // 處理 Google Sheets 的日期時間格式
        const dateOnly = highlight[0].trim().split(' ')[0];
        let highlightDate = new Date(dateOnly);

        if (isNaN(highlightDate.getTime())) {
            const parts = dateOnly.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    highlightDate = new Date(parts[0], parts[1] - 1, parts[2]);
                } else {
                    highlightDate = new Date(parts[2], parts[0] - 1, parts[1]);
                }
            }
        }

        if (!isNaN(highlightDate.getTime())) {
            highlightDate.setHours(0, 0, 0, 0);
            if (highlightDate.getTime() === targetDate.getTime()) {
                checkedCount++;
            }
        }
    });

    const rate = totalStudents > 0 ? (checkedCount / totalStudents) * 100 : 0;
    return { count: checkedCount, total: totalStudents, rate: Math.round(rate) };
}

/**
 * 根據打卡率返回顏色等級
 * @param {number} rate - 打卡率 (0-100)
 * @returns {string} CSS class name
 */
function getHeatmapLevel(rate) {
    if (rate === 0) return 'level-0';
    if (rate <= 20) return 'level-0';
    if (rate <= 40) return 'level-1';
    if (rate <= 60) return 'level-2';
    if (rate <= 80) return 'level-3';
    return 'level-4';
}

/**
 * 渲染打卡熱力圖
 */
export function renderHeatmap() {
    const heatmapGrid = document.getElementById('heatmapGrid');
    const tooltip = document.getElementById('heatmapTooltip');

    const today = TEST_TODAY_DATE ? new Date(TEST_TODAY_DATE) : new Date();
    today.setHours(0, 0, 0, 0);

    // 更新挑戰進度資訊
    const daysPassed = Math.floor((today - COURSE_START_DATE) / (1000 * 60 * 60 * 24)) + 1;
    const progressPercentage = Math.round((daysPassed / 35) * 100);

    document.getElementById('challengeCurrentDay').textContent = daysPassed;
    document.getElementById('challengeProgressFill').style.width = progressPercentage + '%';
    document.getElementById('challengePercentage').textContent = progressPercentage + '%';

    // 更新里程碑狀態
    const milestones = document.querySelectorAll('.milestone');
    milestones.forEach(milestone => {
        const milestoneDay = parseInt(milestone.dataset.day);
        if (daysPassed >= milestoneDay) {
            milestone.classList.add('achieved');
        } else {
            milestone.classList.remove('achieved');
        }
    });

    let html = '';

    // 生成 35 天的方格（從課程開始到今天，最多 35 天）
    for (let i = 0; i < 35; i++) {
        const date = new Date(COURSE_START_DATE);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);

        const dayNumber = i + 1;
        const isFuture = date > today;

        if (isFuture) {
            // 未來日期
            html += `
                <div class="heatmap-cell future" data-day="${dayNumber}" data-date="${date.toISOString()}" data-future="true">
                    <span class="day-number">${dayNumber}</span>
                </div>
            `;
        } else {
            // 過去或今天的日期
            const stats = getCheckinRateForDate(date);
            const level = getHeatmapLevel(stats.rate);

            html += `
                <div class="heatmap-cell ${level}"
                     data-day="${dayNumber}"
                     data-date="${date.toISOString()}"
                     data-count="${stats.count}"
                     data-total="${stats.total}"
                     data-rate="${stats.rate}">
                    <span class="day-number">${dayNumber}</span>
                </div>
            `;
        }
    }

    heatmapGrid.innerHTML = html;

    // 加入 hover 和觸控事件
    const cells = heatmapGrid.querySelectorAll('.heatmap-cell');
    let currentOpenCell = null;

    const showTooltip = (cell) => {
        const isFuture = cell.dataset.future === 'true';
        if (isFuture) {
            tooltip.textContent = `第 ${cell.dataset.day} 天：尚未開始`;
        } else {
            const day = cell.dataset.day;
            const count = cell.dataset.count;
            const total = cell.dataset.total;
            const rate = cell.dataset.rate;
            tooltip.textContent = `第 ${day} 天：${count}/${total} 人打卡 (${rate}%)`;
        }

        // 定位 tooltip
        const rect = cell.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + window.scrollY + 'px';
        tooltip.style.display = 'block';
    };

    const hideTooltip = () => {
        tooltip.style.display = 'none';
        currentOpenCell = null;
    };

    cells.forEach(cell => {
        // 桌面版：hover 事件
        cell.addEventListener('mouseenter', (e) => {
            showTooltip(cell);
        });

        cell.addEventListener('mouseleave', () => {
            hideTooltip();
        });

        // 手機版：觸控事件
        cell.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (currentOpenCell === cell) {
                // 如果點擊同一個格子，關閉 tooltip
                hideTooltip();
            } else {
                // 否則顯示 tooltip
                showTooltip(cell);
                currentOpenCell = cell;
            }
        });
    });

    // 點擊其他地方關閉 tooltip
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.heatmap-cell') && !e.target.closest('.heatmap-tooltip')) {
            hideTooltip();
        }
    });

    console.log('熱力圖已渲染：35 天');
}

// ============================================
// 渲染今日打卡動態
// ============================================
export function renderTodayCheckinStatus() {
    const allStudents = statsData.map(s => s[0]); // 所有學員名單
    const checkedStudents = getTodayCheckedStudents(); // 今日已打卡
    const uncheckedStudents = allStudents.filter(name => !checkedStudents.includes(name)); // 未打卡

    // 更新統計數字
    document.getElementById('todayCheckedCount').textContent = checkedStudents.length;
    document.getElementById('todayUncheckedCount').textContent = uncheckedStudents.length;
    document.getElementById('checkedListCount').textContent = checkedStudents.length;
    document.getElementById('uncheckedListCount').textContent = uncheckedStudents.length;

    // 渲染已打卡學員
    const checkedContainer = document.getElementById('checkedStudents');
    let checkedHTML = '';
    checkedStudents.forEach(name => {
        checkedHTML += `
            <div class="student-avatar checked">
                <div class="emoji">✅</div>
                <div>${name}</div>
            </div>
        `;
    });
    checkedContainer.innerHTML = checkedHTML || '<div style="text-align: center; padding: 20px; color: #999;">還沒有人打卡</div>';

    // 渲染未打卡學員
    const uncheckedContainer = document.getElementById('uncheckedStudents');
    let uncheckedHTML = '';
    uncheckedStudents.forEach(name => {
        uncheckedHTML += `
            <div class="student-avatar unchecked">
                <div class="emoji">⏸️</div>
                <div>${name}</div>
            </div>
        `;
    });
    uncheckedContainer.innerHTML = uncheckedHTML || '<div style="text-align: center; padding: 20px; color: #999;">全部都打卡了！🎉</div>';

    console.log(`今日打卡動態: 已打卡 ${checkedStudents.length} 人，未打卡 ${uncheckedStudents.length} 人`);
}

// ============================================
// 切換學員列表顯示（修復版：透明度問題已解決）
// ============================================
export function toggleStudentList() {
    const container = document.getElementById('studentAvatarsContainer');
    const icon = document.getElementById('toggleIcon');
    const buttonText = document.getElementById('toggleText');

    // 檢查必要元素是否存在
    if (!container || !icon || !buttonText) {
        console.error('toggleStudentList: 找不到必要的 DOM 元素');
        return;
    }

    if (container.style.display === 'none' || !container.style.display) {
        // 展開前先確保內容已渲染
        renderTodayCheckinStatus();

        // 展開 - 明確設定所有必要屬性（修復透明度問題）
        container.style.display = 'block';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
        icon.textContent = '▲';
        buttonText.textContent = '收起學員列表';

        // 平滑滾動到容器
        setTimeout(() => {
            container.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 100);
    } else {
        // 收起 - 使用動畫效果
        container.style.opacity = '0';
        container.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            container.style.display = 'none';
        }, 300);

        icon.textContent = '▼';
        buttonText.textContent = '查看學員列表';
    }
}

// ============================================
// 立即刷新今日打卡狀態（改善版：防濫用機制）
// ============================================
let refreshCooldown = false;
let cooldownTimer = null;

export async function refreshTodayStatus() {
    const { loadData } = await import('./data.js');
    const button = document.querySelector('.refresh-button-compact');

    // 如果正在冷卻中，不執行
    if (refreshCooldown) {
        return;
    }

    // 開始冷卻
    refreshCooldown = true;
    button.disabled = true;
    button.classList.add('refreshing');

    try {
        // 顯示刷新中
        button.textContent = '⏳ 刷新中...';

        // 強制從遠端載入
        await loadData(false);

        // 顯示完成狀態
        button.textContent = '✅ 刷新完成';
        button.classList.remove('refreshing');
        button.classList.add('success');

        // 2 秒後開始倒數
        setTimeout(() => {
            button.classList.remove('success');
            startCooldown(button, 10); // 10 秒冷卻
        }, 2000);

    } catch (error) {
        console.error('刷新失敗:', error);
        button.textContent = '❌ 刷新失敗';
        button.classList.remove('refreshing');
        button.classList.add('error');

        // 2 秒後開始倒數（失敗也要冷卻）
        setTimeout(() => {
            button.classList.remove('error');
            startCooldown(button, 5); // 失敗時較短的冷卻時間
        }, 2000);
    }
}

/**
 * 開始冷卻倒數
 * @param {HTMLElement} button - 按鈕元素
 * @param {number} seconds - 冷卻秒數
 */
function startCooldown(button, seconds) {
    let remaining = seconds;

    // 清除舊的計時器（如果有）
    if (cooldownTimer) {
        clearInterval(cooldownTimer);
    }

    // 更新按鈕文字
    const updateButton = () => {
        button.textContent = `⏰ 請稍候 ${remaining} 秒`;
    };

    updateButton();

    // 每秒更新
    cooldownTimer = setInterval(() => {
        remaining--;

        if (remaining <= 0) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
            refreshCooldown = false;
            button.disabled = false;
            button.textContent = '🔄 立即刷新';
        } else {
            updateButton();
        }
    }, 1000);
}

// ============================================
// 渲染連續打卡王排行榜
// ============================================
export function renderLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.classList.remove('loading');

    const sorted = [...statsData].sort((a, b) => parseInt(b[2]) - parseInt(a[2]));
    const top10 = sorted.slice(0, 10);

    let html = '';
    top10.forEach((student, index) => {
        const name = student[0];
        const consecutiveDays = student[2];
        const milestones = getMilestones(student);
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';

        html += `
            <div class="leaderboard-item ${rankClass}">
                <span class="rank">${index + 1}</span>
                <div class="student-info">
                    <div class="student-name">${name}</div>
                    <div class="streak-days">🔥 ${consecutiveDays} 天</div>
                    <div class="milestones">${milestones}</div>
                </div>
            </div>
        `;
    });

    leaderboardList.innerHTML = html;
}

function getMilestones(student) {
    let badges = '';
    if (student[4] === '🏆') badges += '🏆';
    if (student[5] === '🏆') badges += '🏆';
    if (student[6] === '🏆') badges += '🏆';
    if (student[7] === '🏆') badges += '🏆';
    return badges || '-';
}

// ============================================
// 生成文章區塊的 HTML（智能顯示：連結或折疊文字）
// ============================================
function generateArticleHTML(article, index) {
    if (!article || article.trim() === '') {
        return '';  // 沒有文章，不顯示
    }

    const trimmedArticle = article.trim();
    const isURL = /^https?:\/\//i.test(trimmedArticle);

    if (isURL) {
        // 如果是連結，顯示「查看文章」按鈕
        return `
            <div class="highlight-article">
                <div class="article-label">📝 今日文章</div>
                <a href="${trimmedArticle}" target="_blank" rel="noopener noreferrer" class="article-link-button">
                    查看文章 →
                </a>
            </div>
        `;
    } else {
        // 如果是文字，使用折疊功能
        const maxLength = 100;
        const needsToggle = trimmedArticle.length > maxLength;
        const preview = needsToggle ? trimmedArticle.substring(0, maxLength) + '...' : trimmedArticle;
        const uniqueId = `article-${index}`;

        if (needsToggle) {
            return `
                <div class="highlight-article">
                    <div class="article-label">📝 今日文章</div>
                    <div class="article-text-container">
                        <div class="article-text-preview" id="${uniqueId}-preview">${preview}</div>
                        <div class="article-text-full" id="${uniqueId}-full" style="display: none;">${trimmedArticle}</div>
                        <button class="article-toggle-button" onclick="toggleArticle('${uniqueId}')">
                            <span id="${uniqueId}-toggle-text">展開全文</span> <span id="${uniqueId}-toggle-icon">▼</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="highlight-article">
                    <div class="article-label">📝 今日文章</div>
                    <div class="article-text-container">
                        <div class="article-text-full">${trimmedArticle}</div>
                    </div>
                </div>
            `;
        }
    }
}

// ============================================
// 切換文章展開/收起
// ============================================
export function toggleArticle(uniqueId) {
    const preview = document.getElementById(`${uniqueId}-preview`);
    const full = document.getElementById(`${uniqueId}-full`);
    const toggleText = document.getElementById(`${uniqueId}-toggle-text`);
    const toggleIcon = document.getElementById(`${uniqueId}-toggle-icon`);

    if (full.style.display === 'none') {
        // 展開
        preview.style.display = 'none';
        full.style.display = 'block';
        toggleText.textContent = '收起';
        toggleIcon.textContent = '▲';
    } else {
        // 收起
        preview.style.display = 'block';
        full.style.display = 'none';
        toggleText.textContent = '展開全文';
        toggleIcon.textContent = '▼';
    }
}

// ============================================
// 渲染每日亮點牆（只顯示今天）
// ============================================
export function renderHighlights() {
    const highlightsList = document.getElementById('highlightsList');
    highlightsList.classList.remove('loading');

    // 取得今天的日期（不含時間）
    const today = TEST_TODAY_DATE ? new Date(TEST_TODAY_DATE) : new Date();
    today.setHours(0, 0, 0, 0);

    // 過濾出今天的亮點
    const todayHighlights = highlightsData.filter(highlight => {
        if (!highlight[0]) return false;

        // 處理 Google Sheets 的日期時間格式 (例如: "2026/1/9 下午 4:52:25")
        // 先提取空格前的日期部分
        const dateOnly = highlight[0].trim().split(' ')[0];

        // 解析日期
        let highlightDate = new Date(dateOnly);

        // 如果解析失敗，嘗試其他格式
        if (isNaN(highlightDate.getTime())) {
            const parts = dateOnly.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    // YYYY-MM-DD 或 YYYY/M/D
                    highlightDate = new Date(parts[0], parts[1] - 1, parts[2]);
                } else {
                    // MM/DD/YYYY
                    highlightDate = new Date(parts[2], parts[0] - 1, parts[1]);
                }
            }
        }

        // 如果還是無效，跳過
        if (isNaN(highlightDate.getTime())) {
            return false;
        }

        highlightDate.setHours(0, 0, 0, 0);

        // 只返回今天的
        return highlightDate.getTime() === today.getTime();
    });

    console.log(`今日亮點: ${todayHighlights.length} 筆 (總共 ${highlightsData.length} 筆)`);

    let html = '';

    if (todayHighlights.length === 0) {
        html = `
            <div style="text-align: center; padding: 60px 20px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 20px;">📝</div>
                <div style="font-size: 22px; font-weight: 700; margin-bottom: 10px;">今天還沒有同學分享亮點</div>
                <div style="font-size: 18px;">成為第一個分享的人吧！</div>
            </div>
        `;
    } else {
        todayHighlights.forEach((highlight, index) => {
            const date = formatDate(highlight[0]);
            const name = highlight[1];
            const content = highlight[2];
            const method = highlight[3];
            const article = highlight[4];  // 今日撰寫的文章（新增）
            const extra = highlight[5];    // 想對同期戰友說的話（索引改變）

            // 生成文章區塊的 HTML
            const articleHTML = generateArticleHTML(article, index);

            html += `
                <div class="highlight-card">
                    <div class="highlight-header">
                        <div class="highlight-name">${name}</div>
                        <div class="highlight-date">${date}</div>
                    </div>
                    <div class="highlight-content">💡 ${content}</div>
                    ${method ? `<span class="highlight-method">${method}</span>` : ''}
                    ${articleHTML}
                    ${extra ? `<div class="highlight-extra">💬 ${extra}</div>` : ''}
                </div>
            `;
        });

        // 顯示今日統計
        html += `
            <div style="text-align: center; padding: 30px; color: #666; font-size: 18px; font-weight: 700; border-top: 3px dashed #E0E0E0; margin-top: 20px;">
                🎉 今日共有 ${todayHighlights.length} 位同學分享了亮點
            </div>
        `;
    }

    highlightsList.innerHTML = html;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';

    // 處理 Google Sheets 的日期時間格式 (例如: "2026/1/9 下午 4:52:25")
    // 先提取空格前的日期部分
    const dateOnly = dateStr.trim().split(' ')[0];

    // 嘗試解析不同的日期格式
    let date = new Date(dateOnly);

    // 如果日期無效，嘗試其他格式
    if (isNaN(date.getTime())) {
        // 嘗試解析 YYYY-MM-DD 或 YYYY/M/D 格式
        const parts = dateOnly.split(/[-/]/);
        if (parts.length === 3) {
            date = new Date(parts[0], parts[1] - 1, parts[2]);
        }
    }

    // 檢查日期是否有效
    if (isNaN(date.getTime())) {
        return '-';
    }

    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ============================================
// 個人查詢
// ============================================
export function populateStudentSelect() {
    const select = document.getElementById('studentSelect');
    statsData.forEach(student => {
        const option = document.createElement('option');
        option.value = student[0];
        option.textContent = student[0];
        select.appendChild(option);
    });
}

export function lookupStudent() {
    const select = document.getElementById('studentSelect');
    const studentName = select.value;

    if (!studentName) {
        alert('請選擇學員');
        return;
    }

    const student = statsData.find(s => s[0] === studentName);
    if (!student) {
        alert('找不到該學員');
        return;
    }

    const totalDays = student[1];
    const consecutiveDays = student[2];
    const lastDate = student[3];
    const milestones = getMilestones(student);

    // 從 highlightsData 過濾該學員的所有打卡記錄
    const studentHighlights = highlightsData.filter(h => h[1] === studentName);

    console.log(`${studentName} 的打卡記錄: ${studentHighlights.length} 筆`);

    let highlightsHTML = '';
    if (studentHighlights.length > 0) {
        studentHighlights.forEach((highlight, index) => {
            const date = formatDate(highlight[0]);
            const content = highlight[2];
            const method = highlight[3];
            const article = highlight[4];  // 今日撰寫的文章（新增）
            const extra = highlight[5];    // 想對同期戰友說的話（索引改變）

            // 生成文章區塊的 HTML
            const articleHTML = generateArticleHTML(article, `lookup-${index}`);

            highlightsHTML += `
                <div class="highlight-card" style="margin-bottom: 15px;">
                    <div class="highlight-header">
                        <div class="highlight-date" style="font-size: 20px; color: #FF6B35; font-weight: 900;">📅 ${date}</div>
                    </div>
                    <div class="highlight-content" style="font-size: 19px;">💡 ${content}</div>
                    ${method ? `<span class="highlight-method" style="font-size: 15px;">${method}</span>` : ''}
                    ${articleHTML}
                    ${extra ? `<div class="highlight-extra" style="font-size: 16px;">💬 ${extra}</div>` : ''}
                </div>
            `;
        });
    } else {
        highlightsHTML = '<div style="text-align: center; padding: 40px; color: #999; font-size: 18px;">尚無打卡記錄</div>';
    }

    const html = `
        <div class="personal-stats">
            <div class="personal-stat-box">
                <div class="personal-stat-label">累計打卡天數</div>
                <div class="personal-stat-value">${totalDays} 天</div>
            </div>
            <div class="personal-stat-box">
                <div class="personal-stat-label">連續打卡天數</div>
                <div class="personal-stat-value">🔥 ${consecutiveDays} 天</div>
            </div>
            <div class="personal-stat-box">
                <div class="personal-stat-label">最近打卡日期</div>
                <div class="personal-stat-value">${lastDate || '-'}</div>
            </div>
            <div class="personal-stat-box">
                <div class="personal-stat-label">已達成里程碑</div>
                <div class="personal-stat-value">${milestones}</div>
            </div>
        </div>

        <h3 style="margin-top: 30px; margin-bottom: 15px; font-size: 24px; font-weight: 900; color: #2C3E50; border-bottom: 3px solid #2C3E50; padding-bottom: 10px;">
            📝 完整打卡記錄 (共 ${studentHighlights.length} 天)
        </h3>
        <div style="max-height: 600px; overflow-y: auto;">
            ${highlightsHTML}
        </div>
    `;

    document.getElementById('personalResult').innerHTML = html;
}

// ============================================
// 同步區塊高度
// ============================================
export function syncSectionHeights() {
    const leaderboard = document.querySelector('.leaderboard');
    const highlights = document.querySelector('.highlights');

    if (leaderboard && highlights) {
        // 1. 先清除 highlights 的高度設定，讓它自然長高
        highlights.style.height = 'auto';
        highlights.style.maxHeight = 'none';

        // 2. 獲取排行榜的實際高度 (這是我們的基準)
        const leaderboardHeight = leaderboard.offsetHeight;

        // 3. 設定 highlights 的最大高度等於排行榜的高度
        highlights.style.maxHeight = leaderboardHeight + 'px';

        // 4. 設定 highlights 的高度也等於排行榜的高度，確保視覺一致
        highlights.style.height = leaderboardHeight + 'px';

        console.log(`同步高度: 排行榜 ${leaderboardHeight}px -> 亮點牆 (height & max-height set)`);
    }
}
