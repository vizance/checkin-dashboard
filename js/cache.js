/**
 * 緩存管理模組
 * 負責 LocalStorage 的讀寫操作
 */

import { CACHE_DURATION } from './config.js';

/**
 * 從 LocalStorage 讀取緩存
 * @param {string} key - 緩存鍵名
 * @returns {any|null} 緩存的資料，如果過期或不存在則返回 null
 */
export function getCachedData(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch (e) {
        console.error('讀取緩存失敗:', e);
        return null;
    }
}

/**
 * 儲存資料到 LocalStorage
 * @param {string} key - 緩存鍵名
 * @param {any} data - 要緩存的資料
 */
export function setCachedData(key, data) {
    try {
        const cacheData = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (e) {
        console.warn('無法儲存緩存:', e);
    }
}
