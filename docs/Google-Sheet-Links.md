# Google Sheets 連結資訊

## 📊 Google Sheets 基本資訊

**Sheet ID**: `1C1t_hUTFDaQlxS4np8NiieyOiwPdG0ZGK_zn2wlHDSA`

**主連結**: https://docs.google.com/spreadsheets/d/1C1t_hUTFDaQlxS4np8NiieyOiwPdG0ZGK_zn2wlHDSA/edit

---

## 🔍 如何取得各工作表的 gid

### 步驟：

1. 開啟你的 Google Sheet
2. 點擊想要的工作表（底部標籤）
3. 看網址最後的 `#gid=數字`
4. 複製那個數字

### 範例：
如果網址是：
```
https://docs.google.com/spreadsheets/d/1C1t_hUTFDaQlxS4np8NiieyOiwPdG0ZGK_zn2wlHDSA/edit#gid=123456789
```

則 gid 是：`123456789`

---

## 📋 工作表 gid 清單（請填入）

| 工作表名稱 | gid | CSV 匯出連結 |
|----------|-----|-------------|
| 表單回應 | `待填入` | 待產生 |
| 學員名單 | `待填入` | 待產生 |
| 打卡統計 | `待填入` | 待產生 |
| 每日亮點牆 | `待填入` | 待產生 |

---

## 🔧 如何填寫 gid

請按照以下步驟：

### 1. 取得「打卡統計」的 gid
1. 開啟你的 Google Sheet
2. 點擊底部的「**打卡統計**」工作表
3. 看網址最後的 `#gid=` 後面的數字
4. 告訴我這個數字

### 2. 取得「每日亮點牆」的 gid
1. 點擊底部的「**每日亮點牆**」工作表
2. 看網址最後的 `#gid=` 後面的數字
3. 告訴我這個數字

---

## 📊 CSV 匯出連結格式

取得 gid 後，CSV 連結格式為：

```
https://docs.google.com/spreadsheets/d/1C1t_hUTFDaQlxS4np8NiieyOiwPdG0ZGK_zn2wlHDSA/export?format=csv&gid=[GID]
```

### 範例（假設 gid）：

**打卡統計**（假設 gid=12345）：
```
https://docs.google.com/spreadsheets/d/1C1t_hUTFDaQlxS4np8NiieyOiwPdG0ZGK_zn2wlHDSA/export?format=csv&gid=12345
```

**每日亮點牆**（假設 gid=67890）：
```
https://docs.google.com/spreadsheets/d/1C1t_hUTFDaQlxS4np8NiieyOiwPdG0ZGK_zn2wlHDSA/export?format=csv&gid=67890
```

---

## ⚠️ 重要：確認共用設定

在產生 CSV 連結之前，請確認你的 Google Sheet 已設定為「知道連結的任何人都能檢視」：

1. 在 Google Sheet 點擊右上角「**共用**」按鈕
2. 在「一般存取權」區域，點擊「限制」
3. 改為「**知道連結的任何人**」
4. 權限設為「**檢視者**」
5. 點擊「完成」

這樣 Vibe 儀表板才能讀取資料。

---

## 📝 待辦事項

- [ ] 確認 Google Sheet 共用設定為「知道連結的任何人都能檢視」
- [ ] 取得「打卡統計」工作表的 gid
- [ ] 取得「每日亮點牆」工作表的 gid
- [ ] 產生 CSV 匯出連結
- [ ] 測試 CSV 連結可以正常下載
- [ ] 提供給開發者建立 Vibe 儀表板

---

## 🚀 下一步

取得 gid 後，我將：
1. 建立完整的 CSV 匯出連結
2. 開發 Vibe 儀表板
3. 串接 Google Sheet 資料
4. 實作所有視覺化功能

請提供「打卡統計」和「每日亮點牆」的 gid！
