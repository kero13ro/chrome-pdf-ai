# Chrome Web Store Publishing Checklist

## 上架前必須完成的事項

### ✅ 已完成的修正

1. **移除不必要的權限**
   - ✅ 移除 `downloads` 權限（改用 fetch API）
   - ✅ 移除 `tabs` 權限（用 `activeTab` 替代）
   - ✅ 移除特定網站的 host_permissions（改用 `optional_host_permissions`）

2. **manifest.json 優化**
   - ✅ 使用英文名稱和描述（國際化）
   - ✅ 加入 `author` 欄位
   - ✅ 加入 `default_title`
   - ✅ 移除 Gemini 相關配置
   - ✅ 使用 `optional_host_permissions` 允許用戶自行授權

3. **隱私與安全**
   - ✅ 建立 PRIVACY_POLICY.md
   - ✅ 確保不收集用戶資料
   - ✅ 本地儲存所有設定
   - ✅ 自動清除暫存的 PDF 資料

4. **程式碼品質**
   - ✅ 移除無用的檔案（content-gemini.js, popup.html, popup.js）
   - ✅ 移除 Gemini 平台支援
   - ✅ 預設使用 ChatGPT
   - ✅ 完整的錯誤處理和 console.log

5. **文檔**
   - ✅ 建立雙語 README（英文/繁中）
   - ✅ 建立 STORE_LISTING.md
   - ✅ 建立 PRIVACY_POLICY.md

---

## 🔴 上架前還需要做的事情

### 1. **圖標檔案** (必須)
- [ ] 確認 `icons/` 目錄有三個圖標檔案：
  - `icon16.png` (16x16)
  - `icon48.png` (48x48)
  - `icon128.png` (128x128)
- [ ] 圖標應該清晰且代表插件功能
- ✅ 目前已有圖標（來自 IconKitchen）

### 2. **截圖準備** (必須至少 1 張，建議 5 張)
- [ ] 螢幕截圖 1: 主要使用場景（在 PDF 頁面點擊圖標）
- [ ] 螢幕截圖 2: 設定頁面
- [ ] 螢幕截圖 3: Claude 整合效果
- [ ] 螢幕截圖 4: ChatGPT 整合效果
- [ ] 螢幕截圖 5: Before/After 對比

尺寸要求：1280x800 或 640x400

### 3. **宣傳圖片** (可選但強烈建議)
- [ ] Small Promotional Tile (440x280)
- [ ] Marquee Promotional Image (1400x560)

### 4. **隱私政策託管** (必須)
- [ ] 將 PRIVACY_POLICY.md 託管到公開 URL
  - 選項 1: GitHub Pages
  - 選項 2: GitHub 原始檔案連結
  - 選項 3: 自己的網站

**當前 URL 格式**:
```
https://github.com/[your-username]/pdf-claude/blob/main/PRIVACY_POLICY.md
```

### 5. **manifest.json 最後檢查**
- [ ] 更新 `author` 欄位為你的名字
- [ ] 確認 `version` 號碼
- [ ] 確認所有權限都有合理的使用說明

### 6. **測試**
- [ ] 在 Chrome 中測試所有功能
- [ ] 測試 Claude 平台上傳和送出
- [ ] 測試 ChatGPT 平台上傳和送出
- [ ] 測試設定頁面儲存和載入
- [ ] 測試錯誤處理（非 PDF 頁面）
- [ ] 在無痕模式測試

### 7. **程式碼清理**
- [ ] 移除所有 console.log（或保留必要的）
- [ ] 移除無用的程式碼和註解
- [ ] 確保沒有硬編碼的測試資料

### 8. **準備提交材料**
- [ ] 準備簡短描述（132 字元以內）
- [ ] 準備詳細描述（參考 STORE_LISTING.md）
- [ ] 選擇類別：Productivity
- [ ] 準備關鍵字/標籤

---

## 可能的審核問題與解決方案

### 問題 1: 權限過多
**已解決** ✅
- 移除了 `downloads` 和 `tabs` 權限
- 使用 `optional_host_permissions` 讓用戶自行授權

### 問題 2: 單一用途不明確
**已解決** ✅
- manifest 描述清楚說明單一用途
- STORE_LISTING.md 有明確的 Single Purpose 說明

### 問題 3: 隱私政策缺失
**已解決** ✅
- 建立完整的 PRIVACY_POLICY.md
- 需要託管到公開 URL

### 問題 4: 不當使用 host_permissions
**已解決** ✅
- 只請求必要的 claude.ai 和 chatgpt.com
- 其他網站使用 optional_host_permissions

### 問題 5: 圖標或截圖不符合規範
**需要檢查** ⚠️
- 確保圖標尺寸正確
- 截圖需要準備

---

## 提交流程

1. **創建 Chrome Web Store 開發者帳號**
   - 前往: https://chrome.google.com/webstore/devconsole
   - 支付一次性 $5 USD 註冊費

2. **準備發布包**
   ```bash
   # 移除不需要的檔案
   rm -rf .git .claude IconKitchen-Output
   rm PUBLISHING_CHECKLIST.md STORE_LISTING.md

   # 打包成 ZIP
   zip -r pdf-to-ai-assistant.zip . -x "*.git*" -x "*node_modules*"
   ```

3. **上傳到 Chrome Web Store**
   - 上傳 ZIP 檔案
   - 填寫商店資訊（使用 STORE_LISTING.md）
   - 上傳截圖和宣傳圖片
   - 填寫隱私政策 URL
   - 選擇定價（免費）
   - 選擇發布地區

4. **審核說明**
   - 在「為什麼需要這些權限」欄位填寫清楚的說明
   - 提供測試帳號（如果需要）
   - 說明單一用途

5. **提交審核**
   - 通常需要幾天到幾週
   - 注意郵件通知

---

## 審核後的維護

- 定期檢查是否有政策更新
- 如果 AI 平台 UI 更新，需要更新 content scripts
- 回應用戶評論和問題
- 根據反饋優化功能

---

## 常見拒絕原因

1. **權限濫用**: 請求了不需要的權限
2. **隱私問題**: 收集用戶資料但沒有說明
3. **商標問題**: 使用了 Claude 或 ChatGPT 的商標
4. **功能不完整**: 基本功能無法運作
5. **詐欺或誤導**: 描述與實際功能不符

---

## 提交前最後檢查

- [ ] 所有功能正常運作
- [ ] 隱私政策已託管
- [ ] 截圖已準備
- [ ] manifest.json 所有欄位填寫完整
- [ ] 移除開發用的 console.log
- [ ] README 完整且正確
- [ ] 沒有硬編碼的敏感資訊
