/**
 * 資料處理模組
 * 負責 CSV 解析和資料載入
 */

import {
    STATS_CSV_URL,
    HIGHLIGHTS_CSV_URL,
    CACHE_KEY_STATS,
    CACHE_KEY_HIGHLIGHTS,
    statsData,
    highlightsData,
    setStatsData,
    setHighlightsData
} from './config.js';
import { getCachedData, setCachedData } from './cache.js';
import {
    renderStatsBanner,
    renderHeatmap,
    renderTodayCheckinStatus,
    renderLeaderboard,
    renderHighlights,
    populateStudentSelect
} from './dashboard.js';

/**
 * CSV 解析函數
 * @param {string} csv - CSV 原始字串
 * @returns {Array<Array<string>>} 解析後的二維陣列
 */
export function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        result.push(values);
    }

    return result;
}

/**
 * 載入資料（帶緩存優化）
 * @param {boolean} useCache - 是否使用緩存
 */
export async function loadData(useCache = true) {
    try {
        // 嘗試使用緩存
        if (useCache) {
            const cachedStats = getCachedData(CACHE_KEY_STATS);
            const cachedHighlights = getCachedData(CACHE_KEY_HIGHLIGHTS);

            if (cachedStats && cachedHighlights) {
                console.log('使用緩存資料');
                setStatsData(cachedStats);
                setHighlightsData(cachedHighlights);

                renderStatsBanner();
                renderHeatmap();
                renderTodayCheckinStatus();
                renderLeaderboard();
                renderHighlights();
                populateStudentSelect();
                return;
            }
        }

        // 從遠端載入資料
        console.log('從 Google Sheets 載入資料...');
        const [statsResponse, highlightsResponse] = await Promise.all([
            fetch(STATS_CSV_URL),
            fetch(HIGHLIGHTS_CSV_URL)
        ]);

        const statsCSV = await statsResponse.text();
        const highlightsCSV = await highlightsResponse.text();

        const newStatsData = parseCSV(statsCSV);
        const newHighlightsData = parseCSV(highlightsCSV);

        setStatsData(newStatsData);
        setHighlightsData(newHighlightsData);

        // 儲存到緩存
        setCachedData(CACHE_KEY_STATS, newStatsData);
        setCachedData(CACHE_KEY_HIGHLIGHTS, newHighlightsData);

        renderStatsBanner();
        renderHeatmap();
        renderTodayCheckinStatus();
        renderLeaderboard();
        renderHighlights();
        populateStudentSelect();

    } catch (error) {
        console.error('載入資料失敗:', error);
        alert('載入資料失敗，請確認 Google Sheet 共用設定正確。');
    }
}
