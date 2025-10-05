# PDF to AI Assistant - Chrome Extension

A Chrome extension that instantly sends PDF files to AI assistants (Claude or ChatGPT) for analysis with one click.

[English](#english) | [繁體中文](#繁體中文)

---

## English

### Features

- 📄 **One-Click PDF Upload**: Click the extension icon on any PDF page
- 🤖 **Multiple AI Platforms**: Choose between Claude AI or ChatGPT
- 📤 **Auto-Upload**: Automatically uploads PDF and submits your prompt
- 💬 **Custom Prompts**: Set your own default questions and prompts
- 🔒 **Privacy-Focused**: All processing happens locally on your device
- ⚡ **Fast & Easy**: No manual copy-paste needed

### Installation

#### Development Mode

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the project folder

#### Icons Setup

Icons are already included in the `icons/` folder. If you need to replace them:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

Use online tools like [favicon.io](https://favicon.io/) or [IconKitchen](https://icon.kitchen/)

### How to Use

1. **Navigate to any PDF file** in your browser
2. **Click the extension icon** in your toolbar
3. **PDF is automatically**:
   - Downloaded and processed locally
   - Uploaded to your chosen AI platform
   - Submitted with your custom prompt

### Settings

Right-click the extension icon → **Options** to configure:

- **AI Platform**: Choose Claude or ChatGPT (default: ChatGPT)
- **Custom Prompt**: Set your default question or instruction
- **Save Settings**: All preferences stored locally

### Example Use Cases

**Exam Paper Analysis**
```
Analyze this exam paper from a student's perspective. Provide concise,
bullet-point answers with explanations and key academic concepts.
```

**Document Summary**
```
Provide a comprehensive summary of this PDF, highlighting the main points
and key takeaways.
```

**Translation**
```
Translate this PDF document to Traditional Chinese.
```

### Technical Details

- **manifest.json**: Extension configuration (Manifest V3)
- **background.js**: Service worker handling PDF downloads
- **content-claude.js**: Claude.ai page integration
- **content-chatgpt.js**: ChatGPT page integration
- **settings.html/js**: Options page

### Permissions

- `activeTab`: Detect PDF pages and get current URL
- `storage`: Save your preferences locally
- `notifications`: Show error messages when needed
- `host_permissions`: Access Claude.ai and ChatGPT for auto-upload

### Privacy & Security

- ✅ No data collection - we don't have servers
- ✅ PDFs processed locally on your device
- ✅ Data sent only to your chosen AI platform
- ✅ All settings stored securely in Chrome storage
- ✅ Automatic cleanup after 5 minutes

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details.

### Troubleshooting

**PDF not uploading?**
- Ensure you're on a PDF page or direct PDF URL
- Check you're logged into Claude/ChatGPT
- Open browser console (F12) for error messages

**Prompt not inserting?**
- AI platform UI may have changed
- Check console logs for debugging info
- Manually paste prompt as fallback

### Contributing

Issues and Pull Requests are welcome!

### License

MIT License

### Changelog

**v1.0.0** (2024-10-05)
- Initial release
- Support for Claude and ChatGPT
- Custom prompts
- Auto-upload and submit

---

## 繁體中文

### 功能特色

- 📄 **一鍵上傳 PDF**：在任何 PDF 頁面點擊插件圖標
- 🤖 **多 AI 平台支援**：選擇 Claude AI 或 ChatGPT
- 📤 **自動上傳**：自動上傳 PDF 並送出提示詞
- 💬 **自訂提示詞**：設定您自己的預設問題和指令
- 🔒 **注重隱私**：所有處理都在您的裝置本地進行
- ⚡ **快速簡單**：無需手動複製貼上

### 安裝方式

#### 開發模式安裝

1. Clone 或下載此專案
2. 開啟 Chrome 瀏覽器，前往 `chrome://extensions/`
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇專案資料夾

### 使用方法

1. **在瀏覽器中開啟任何 PDF 檔案**
2. **點擊工具列中的插件圖標**
3. **PDF 會自動**：
   - 在本地下載和處理
   - 上傳到您選擇的 AI 平台
   - 使用您的自訂提示詞送出

### 設定選項

右鍵點擊插件圖標 → **選項** 進行設定：

- **AI 平台**：選擇 Claude 或 ChatGPT（預設：ChatGPT）
- **自訂提示詞**：設定您的預設問題或指令
- **儲存設定**：所有偏好設定都儲存在本地

### 使用範例

**考試試題分析**
```
以考生的角度，分析問題並撰寫模擬答案，考慮到時間限制，
條列式回答，盡可能使用學術性的關鍵字，並且用繁體中文回答。
並在每一大題後加上詳解，解釋解題思路和脈絡。
```

**文件摘要**
```
請提供這份 PDF 文件的摘要，重點整理主要內容和關鍵要點。
```

**翻譯需求**
```
請將這份 PDF 文件翻譯成繁體中文。
```

### 權限說明

- `activeTab`：偵測 PDF 頁面和取得當前網址
- `storage`：在本地儲存您的偏好設定
- `notifications`：在需要時顯示錯誤訊息
- `host_permissions`：存取 Claude.ai 和 ChatGPT 以自動上傳

### 隱私與安全

- ✅ 不收集資料 - 我們沒有伺服器
- ✅ PDF 在您的裝置上本地處理
- ✅ 資料僅傳送到您選擇的 AI 平台
- ✅ 所有設定安全地儲存在 Chrome 儲存空間
- ✅ 5 分鐘後自動清除

詳見 [PRIVACY_POLICY.md](PRIVACY_POLICY.md)。

### 疑難排解

**PDF 無法上傳？**
- 確保您在 PDF 頁面或直接的 PDF 網址上
- 檢查您是否已登入 Claude/ChatGPT
- 開啟瀏覽器控制台（F12）查看錯誤訊息

**提示詞沒有插入？**
- AI 平台介面可能已更改
- 查看控制台日誌以進行除錯
- 可以手動貼上提示詞作為備案

### 貢獻

歡迎提交 Issue 和 Pull Request！

### 授權

MIT License

### 更新日誌

**v1.0.0** (2024-10-05)
- 初始版本發布
- 支援 Claude 和 ChatGPT
- 自訂提示詞功能
- 自動上傳和送出
