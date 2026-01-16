// 清除所有緩存的指令
// 在瀏覽器開發者工具的 Console 中執行

// 1. 清除 localStorage 中的緩存
localStorage.removeItem('checkin_stats_cache');
localStorage.removeItem('checkin_highlights_cache');

// 2. 顯示確認訊息
console.log('✅ 緩存已清除！');
console.log('請按 Ctrl+Shift+R (或 Cmd+Shift+R) 重新載入頁面');

// 3. 自動重新載入（可選）
// location.reload(true);
