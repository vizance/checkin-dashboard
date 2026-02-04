/**
 * 主程式入口
 * 初始化應用程式並設定自動刷新
 */

import { loadData } from './data.js';
import { SHEET_ID, STATS_GID, HIGHLIGHTS_GID } from './config.js';

/**
 * 設定 Google Sheet 連結
 */
function setupSheetLinks() {
    const statsLink = document.getElementById('statsSheetLink');
    const highlightsLink = document.getElementById('highlightsSheetLink');

    if (statsLink) {
        statsLink.href = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${STATS_GID}`;
    }

    if (highlightsLink) {
        highlightsLink.href = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${HIGHLIGHTS_GID}`;
    }
}

/**
 * 初始化應用程式
 */
window.onload = function() {
    setupSheetLinks(); // 設定 Google Sheet 連結
    loadData(true); // 首次載入使用緩存

    // 每 10 分鐘自動刷新資料
    setInterval(async () => {
        console.log('⏰ 自動刷新資料...');
        await loadData(false);

        // 如果有選中學員，同步更新個人快覽
        const select = document.getElementById('overviewStudentSelect');
        if (select && select.value && window.updatePersonalOverview) {
            window.updatePersonalOverview();
        }
    }, 10 * 60 * 1000); // 10 分鐘
};

// 將必要的函數暴露給全局，供 HTML 的 onclick 使用
import { refreshTodayStatus, toggleStudentList, toggleArticle } from './dashboard.js';
window.refreshTodayStatus = refreshTodayStatus;
window.toggleStudentList = toggleStudentList;
window.toggleArticle = toggleArticle;

// 確認函數已掛載
console.log('全局函數掛載完成:', {
    refreshTodayStatus: typeof window.refreshTodayStatus,
    toggleStudentList: typeof window.toggleStudentList,
    toggleArticle: typeof window.toggleArticle,
    updatePersonalOverview: typeof window.updatePersonalOverview,
    togglePersonalCalendar: typeof window.togglePersonalCalendar,
    toggleTeammatesSection: typeof window.toggleTeammatesSection
});

