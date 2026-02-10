/**
 * 配置檔案
 * 包含所有系統配置常數
 */

// Google Sheets 配置
export const SHEET_ID = '1C1t_hUTFDaQlxS4np8NiieyOiwPdG0ZGK_zn2wlHDSA';
export const STATS_GID = '1618258511';
export const HIGHLIGHTS_GID = '365956972';  // 表單回應工作表

// CSV 匯出 URL
export const STATS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${STATS_GID}`;
export const HIGHLIGHTS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${HIGHLIGHTS_GID}`;

// 課程日期配置（以台灣時區 UTC+8 為準）
// 活動期間：2026/03/02 - 2026/04/07（共 35 天 + 2 天緩衝）
export const COURSE_START_DATE = new Date('2026-03-02T00:00:00+08:00');

// 正式模式：使用真實日期
// 注意：如果你有歷史測試資料需要查看，可以設定為特定日期來「時間旅行」
// 例如： export const TEST_TODAY_DATE = '2026-01-09';
export const TEST_TODAY_DATE = null; // null = 使用真實的今天日期（台灣時區）

/**
 * 取得台灣時區的當前時間
 * @returns {Date} 台灣時區的當前時間
 */
export function getTaiwanNow() {
    // 取得 UTC 時間，再加上台灣時區偏移（+8 小時）
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (8 * 60 * 60 * 1000));
}

/**
 * 取得台灣時區的今天日期（午夜 00:00:00 ）
 * 如果有設定 TEST_TODAY_DATE，則使用測試日期
 * @returns {Date} 台灣時區的今天午夜
 */
export function getTaiwanToday() {
    if (TEST_TODAY_DATE) {
        // 測試日期也以台灣時區解析
        return new Date(TEST_TODAY_DATE + 'T00:00:00+08:00');
    }
    const taiwanNow = getTaiwanNow();
    taiwanNow.setHours(0, 0, 0, 0);
    return taiwanNow;
}

// 緩存配置
export const CACHE_KEY_STATS = 'checkin_stats_cache';
export const CACHE_KEY_HIGHLIGHTS = 'checkin_highlights_cache';
export const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘緩存

// 全局資料儲存
export const statsData = [];
export const highlightsData = [];

// 設置資料的函數
export function setStatsData(data) {
    statsData.length = 0;  // 清空現有數據
    statsData.push(...data);  // 添加新數據
}

export function setHighlightsData(data) {
    highlightsData.length = 0;  // 清空現有數據
    highlightsData.push(...data);  // 添加新數據
}
