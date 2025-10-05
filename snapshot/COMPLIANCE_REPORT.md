# Chrome Web Store 上架合規性檢查報告

## ✅ 通過項目

### 1. 基本資訊
- ✅ Extension Name: 已設定（但有錯字，見下方問題）
- ✅ Version: 1.0.0
- ✅ Description: 清楚描述功能
- ✅ Author: kero13ro
- ✅ Icons: 16x16, 48x48, 128x128 都已準備

### 2. 權限使用（Permissions）

| 權限 | 使用情況 | 必要性 | 狀態 |
|------|---------|--------|------|
| `activeTab` | ✅ background.js:35 (獲取 tab.url) | 必要 | ✅ 合規 |
| `storage` | ✅ background.js, settings.js (儲存設定) | 必要 | ✅ 合規 |
| `notifications` | ✅ background.js:41 (錯誤通知) | 必要 | ✅ 合規 |

### 3. Host Permissions

| 權限 | 使用情況 | 必要性 | 狀態 |
|------|---------|--------|------|
| `https://claude.ai/*` | ✅ content-claude.js 需要 | 必要 | ✅ 合規 |
| `https://chatgpt.com/*` | ✅ content-chatgpt.js 需要 | 必要 | ✅ 合規 |

### 4. 單一用途（Single Purpose）
- ✅ 功能明確：將 PDF 發送到 AI 平台
- ✅ 沒有多餘功能
- ✅ 符合單一用途政策

### 5. 程式碼品質
- ✅ 無遠端程式碼執行
- ✅ 所有程式碼都在本地
- ✅ 無外部資源載入

---

## ⚠️ 需要注意的項目

### 1. **錯字問題（重要）**
```json
"name": "PDF to AI - 快速打打開 PDF 文件到 AI 助手"
                        ^^^
                        錯字
```

**問題**: "打打開" 應該是 "打開"

**建議**:
```json
"name": "PDF to AI - 快速打開 PDF 文件到 AI 助手"
```

或者更簡潔的英文版本：
```json
"name": "PDF to AI Assistant"
```

### 2. **Optional Host Permissions: `<all_urls>` （高風險）**

**當前配置**:
```json
"optional_host_permissions": [
  "<all_urls>"
]
```

**問題分析**:
- ⚠️ 請求所有網站的權限會引起審核團隊的高度關注
- ⚠️ 可能被視為過度請求權限
- ✅ 但因為是 **optional**（可選），用戶需主動授權，風險較低

**為什麼需要這個權限？**
```javascript
// background.js:63
const response = await fetch(pdfUrl);  // 需要權限訪問 PDF URL
```

擴充功能需要從各種網站下載 PDF，因此需要用戶授權訪問這些網站。

**審核時的說明（重要）**:
```
This optional permission allows users to grant access to PDFs hosted on any website.
The extension only requests this permission when users attempt to process PDFs from
websites outside of claude.ai and chatgpt.com. Users must explicitly approve this
permission, and it is only used to fetch PDF files via the Fetch API - no other
data is accessed or collected from these websites.
```

中文版本：
```
此可選權限允許使用者授予訪問任何網站上託管的 PDF 的權限。
擴充功能僅在使用者嘗試處理來自 claude.ai 和 chatgpt.com 以外網站的 PDF 時請求此權限。
使用者必須明確批准此權限，且僅用於透過 Fetch API 獲取 PDF 檔案 - 不會訪問或收集這些網站的其他資料。
```

### 3. **moex.gov.tw 硬編碼檢查**

在 background.js 中發現：
```javascript
if (!pdfUrl || (!pdfUrl.includes('.pdf') && !pdfUrl.includes('moex.gov.tw')))
```

**問題**:
- 硬編碼了特定網站 `moex.gov.tw`
- 可能讓審核團隊認為有隱藏的功能或特定用途

**建議**: 移除此特殊判斷，統一使用 `.pdf` 判斷

---

## 🔧 需要修正的問題

### 問題 1: 修正 manifest.json 中的錯字

**優先級**: 🔴 高

**現況**:
```json
"name": "PDF to AI - 快速打打開 PDF 文件到 AI 助手"
```

**建議修正**:
```json
"name": "PDF to AI Assistant"
```
或
```json
"name": "PDF to AI - Send PDFs to Claude & ChatGPT"
```

### 問題 2: 移除 moex.gov.tw 硬編碼

**優先級**: 🟡 中

**現況** (background.js:37):
```javascript
if (!pdfUrl || (!pdfUrl.includes('.pdf') && !pdfUrl.includes('moex.gov.tw'))) {
```

**建議修正**:
```javascript
if (!pdfUrl || !pdfUrl.toLowerCase().includes('.pdf')) {
```

或者更嚴格的判斷：
```javascript
if (!pdfUrl || !(pdfUrl.toLowerCase().endsWith('.pdf') ||
                 pdfUrl.toLowerCase().includes('.pdf?') ||
                 pdfUrl.toLowerCase().includes('.pdf#'))) {
```

### 問題 3: 完善 optional_host_permissions 的說明文檔

**優先級**: 🟡 中

在 STORE_LISTING.md 和提交時的說明中，需要清楚解釋：
1. 為什麼需要 `<all_urls>`
2. 何時會請求此權限
3. 如何使用此權限（僅 fetch PDF，不收集其他資料）

---

## 📋 Chrome Web Store 政策檢查表

### Manifest V3 要求
- ✅ 使用 manifest_version: 3
- ✅ 使用 service_worker 而非 background page
- ✅ 正確使用 host_permissions

### 權限最小化原則
- ✅ 沒有請求不必要的權限
- ✅ 使用 optional_host_permissions 而非直接請求
- ⚠️ `<all_urls>` 可能需要額外說明

### 單一用途政策
- ✅ 功能單一明確
- ✅ 所有功能都服務於同一目的
- ✅ 沒有不相關的功能

### 用戶資料政策
- ✅ 不收集用戶資料
- ✅ 資料僅本地儲存
- ✅ 有明確的隱私政策

### 程式碼品質
- ✅ 沒有混淆的程式碼
- ✅ 沒有遠端程式碼執行
- ✅ 沒有惡意行為

---

## 🎯 上架前建議行動清單

### 必須完成（發布前）
1. ✅ 修正 manifest.json 中的錯字
2. ✅ 移除 moex.gov.tw 硬編碼
3. ✅ 準備好所有權限的詳細說明
4. ✅ 測試所有功能正常運作

### 建議完成（提高審核通過率）
1. 準備 5 張高質量截圖（1280x800）
2. 錄製功能演示影片（可選，但推薦）
3. 準備完整的隱私政策頁面（託管到 GitHub Pages）
4. 在 STORE_LISTING.md 中加入 `<all_urls>` 的詳細說明

### 審核時注意事項
1. 在「為什麼需要此權限」欄位中詳細解釋 `<all_urls>` 的用途
2. 強調這是 **optional**（可選）權限
3. 說明只用於 fetch PDF，不訪問其他資料
4. 提供測試帳號（如果 AI 平台需要）

---

## 📊 審核通過率評估

| 項目 | 評分 | 說明 |
|------|------|------|
| 基本資訊完整性 | ⚠️ 80% | 有錯字需修正 |
| 權限合理性 | ⚠️ 75% | `<all_urls>` 需詳細說明 |
| 程式碼品質 | ✅ 95% | 乾淨，無問題 |
| 政策合規性 | ✅ 90% | 基本符合所有政策 |
| 文檔完整性 | ✅ 85% | 已有 PRIVACY_POLICY |

**總體評估**: 🟡 良好（修正錯字和硬編碼後可達 90%+）

---

## 🚀 建議的發布順序

1. **修正程式碼問題**（30 分鐘）
   - 修正 manifest.json 錯字
   - 移除 moex.gov.tw 硬編碼

2. **準備視覺素材**（1-2 小時）
   - 5 張功能截圖
   - （可選）錄製演示影片

3. **完善文檔**（30 分鐘）
   - 更新 PERMISSIONS_JUSTIFICATION.md
   - 託管隱私政策到 GitHub Pages

4. **最後測試**（30 分鐘）
   - 測試所有功能
   - 檢查權限請求流程

5. **打包上傳**（15 分鐘）
   - `make release`
   - 上傳到 Chrome Web Store
   - 填寫所有必要資訊

**預估總時間**: 3-4 小時
