# Chrome Web Store 權限說明填寫參考

## 單一用途說明 (Single Purpose Statement)
```
This extension serves a single purpose: to streamline the process of sending PDF documents to AI assistants (Claude or ChatGPT) by automating the file upload and prompt submission workflow.
```

中文版本：
```
此擴充功能具有單一用途：簡化將 PDF 文件發送到 AI 助手（Claude 或 ChatGPT）的流程，自動化檔案上傳和提示詞提交工作流程。
```

---

## 要求 activeTab 的理由
```
Required to detect when the user is viewing a PDF file in their browser and to retrieve the PDF URL from the current active tab for processing and sending to the AI platform.
```

中文版本：
```
需要此權限來偵測使用者正在瀏覽的 PDF 檔案，並從當前活躍分頁取得 PDF URL 以進行處理並發送到 AI 平台。
```

---

## 要求 storage 的理由
```
Required to save user preferences locally on the device, including:
1. Selected AI platform (Claude or ChatGPT)
2. Custom prompt text
3. Temporary PDF data for transfer between extension pages

All data is stored locally using Chrome's storage API and automatically cleared after use. No data is sent to external servers.
```

中文版本：
```
需要此權限在裝置本地儲存使用者偏好設定，包括：
1. 選擇的 AI 平台（Claude 或 ChatGPT）
2. 自訂提示詞文字
3. 用於擴充功能頁面間傳輸的臨時 PDF 資料

所有資料都使用 Chrome 的 storage API 在本地儲存，使用後自動清除。不會將資料發送到外部伺服器。
```

---

## 要求 notifications 的理由
```
Required to show error notifications to users when:
1. They attempt to use the extension on a non-PDF page
2. PDF processing fails
3. The extension cannot access the required resources

Notifications provide immediate user feedback for better user experience.
```

中文版本：
```
需要此權限向使用者顯示錯誤通知，當：
1. 使用者嘗試在非 PDF 頁面使用擴充功能
2. PDF 處理失敗
3. 擴充功能無法存取所需資源

通知提供即時的使用者回饋，以提升使用體驗。
```

---

## 要求網站存取權限的理由 (host_permissions)

### claude.ai 和 chatgpt.com
```
Required to automatically upload PDF files and insert custom prompts on the AI platform websites. The extension needs to:
1. Detect input fields on Claude.ai and ChatGPT.com
2. Programmatically upload PDF files to these platforms
3. Insert user-defined prompts into the chat interface
4. Submit the request to the AI assistant

These permissions are essential for the core functionality of automating the PDF upload workflow to AI platforms.
```

中文版本：
```
需要此權限在 AI 平台網站上自動上傳 PDF 檔案並插入自訂提示詞。擴充功能需要：
1. 偵測 Claude.ai 和 ChatGPT.com 上的輸入欄位
2. 以程式方式將 PDF 檔案上傳到這些平台
3. 將使用者定義的提示詞插入聊天介面
4. 向 AI 助手提交請求

這些權限對於自動化 PDF 上傳到 AI 平台的核心功能至關重要。
```

---

## 你正在使用遠端程式碼嗎？

**選擇：否，我沒有使用遠端程式碼**

如果不小心選了「是」，理由可以填：
```
This extension does NOT use remote code. All JavaScript code is included in the extension package and executed locally. No code is fetched from remote servers during runtime.
```

中文版本：
```
此擴充功能不使用遠端程式碼。所有 JavaScript 程式碼都包含在擴充功能套件中並在本地執行。執行期間不會從遠端伺服器獲取程式碼。
```

---

## 快速複製版本（精簡英文）

### Single Purpose (132 chars max)
```
Automate PDF upload and prompt submission to AI assistants (Claude/ChatGPT) for document analysis.
```

### activeTab
```
Detect PDF pages and retrieve PDF URLs from the active tab for processing.
```

### storage
```
Store user preferences (AI platform choice, custom prompts) and temporary PDF data locally. All data is cleared after use.
```

### notifications
```
Display error messages when the extension is used on non-PDF pages or when processing fails.
```

### host_permissions (claude.ai, chatgpt.com)
```
Access AI platform websites to automatically upload PDFs, insert prompts, and interact with chat interfaces.
```

### Remote Code
```
No remote code is used. All code is included in the extension package.
```
