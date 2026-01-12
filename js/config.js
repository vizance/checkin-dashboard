/**
 * 配置檔案
 * 包含所有系統配置常數
 */

// Google Sheets 配置
export const SHEET_ID = '1C1t_hUTFDaQlxS4np8NiieyOiwPdG0ZGK_zn2wlHDSA';
export const STATS_GID = '1618258511';
export const HIGHLIGHTS_GID = '532678141';

// CSV 匯出 URL
export const STATS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${STATS_GID}`;
export const HIGHLIGHTS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${HIGHLIGHTS_GID}`;

// 課程日期配置
export const COURSE_START_DATE = new Date('2025-12-07');

// 正式模式：使用真實日期
// 注意：如果你有歷史測試資料需要查看，可以設定為特定日期來「時間旅行」
// 例如：export const TEST_TODAY_DATE = new Date('2026-01-09');
export const TEST_TODAY_DATE = null; // null = 使用真實的今天日期

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
