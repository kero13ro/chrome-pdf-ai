# YouTube & PDF to AI Assistant - Chrome Extension

A Chrome extension that extracts YouTube video transcripts and sends PDF files to AI assistants (Claude or ChatGPT) for instant analysis with one click.

[English](#english) | [繁體中文](#繁體中文)

---

## English

### Features

- 🎬 **YouTube Transcript Extraction**: Extract video transcripts from any YouTube video with one click
- 📄 **One-Click PDF Upload**: Click the extension icon on any PDF page
- 🤖 **Multiple AI Platforms**: Choose between Claude AI or ChatGPT for each feature
- 📤 **Auto-Upload**: Automatically uploads content and submits your prompt
- 💬 **Custom Prompts**: Set separate prompts for YouTube and PDF
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

**For YouTube Videos:**
1. **Open any YouTube video**
2. **Click the extension icon** in your toolbar
3. **Transcript is automatically**:
   - Extracted from the video
   - Sent to your chosen AI platform
   - Submitted with your custom prompt

**For PDF Files:**
1. **Navigate to any PDF file** in your browser
2. **Click the extension icon** in your toolbar
3. **PDF is automatically**:
   - Downloaded and processed locally
   - Uploaded to your chosen AI platform
   - Submitted with your custom prompt

### Settings

The extension popup allows you to configure:

- **AI Platform**: Choose Claude or ChatGPT for YouTube and PDF separately
- **YouTube Prompt**: Set your default prompt for video transcripts (e.g., "Summarize" or "Translate to Traditional Chinese")
- **PDF Prompt**: Set your default prompt for PDF analysis
- **Auto-Save Settings**: Prompts and platform selection auto-save as you type

### Example Use Cases

**YouTube Transcript Translation**
```
Translate all English subtitles to Traditional Chinese, and attach them after each line.
```

**YouTube Video Summary**
```
Summarize the main points of this video in 3-4 paragraphs in English, with a Traditional Chinese version.
```

**Exam Paper Analysis (PDF)**
```
Analyze this exam paper from a student's perspective. Provide concise,
bullet-point answers with explanations and key academic concepts.
```

**Document Summary (PDF)**
```
Provide a comprehensive summary of this PDF, highlighting the main points
and key takeaways.
```

### Technical Details

- **manifest.json**: Extension configuration (Manifest V3)
- **background.js**: Service worker handling PDF downloads and YouTube transcript processing
- **content-youtube.js**: YouTube page integration for transcript extraction
- **content-claude.js**: Claude.ai page integration
- **content-chatgpt.js**: ChatGPT page integration
- **popup.html/js**: Extension popup with settings

### Permissions

- `activeTab`: Detect YouTube video pages and PDF pages, get current URL
- `storage`: Save your preferences locally
- `host_permissions` (youtube.com): Extract video transcripts
- `host_permissions` (claude.ai, chatgpt.com): Auto-upload content and insert prompts

### Privacy & Security

- ✅ No data collection - we don't have servers
- ✅ YouTube transcripts and PDFs processed locally on your device
- ✅ Data sent only to your chosen AI platform
- ✅ All settings stored securely in Chrome storage
- ✅ Automatic cleanup after 5 minutes

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details.

### Troubleshooting

**YouTube transcript not extracting?**
- Ensure the video has captions/subtitles available
- Check you're on a YouTube video page (youtube.com/watch)
- Open browser console (F12) for error messages

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

**v1.1.0** (2025-02-19)
- Auto-save prompts and AI platform selection (no need to submit to save)
- Simplified Makefile with auto version bump on release

**v1.0.0** (2024-10-15)
- Initial release
- YouTube transcript extraction
- PDF upload support
- Support for Claude and ChatGPT
- Separate custom prompts for YouTube and PDF
- Auto-upload and submit
- Loading indicators for better UX

---

## 繁體中文

### 功能特色

- 🎬 **YouTube 字幕提取**：一鍵提取任何 YouTube 影片的字幕
- 📄 **一鍵上傳 PDF**：在任何 PDF 頁面點擊插件圖標
- 🤖 **多 AI 平台支援**：分別為 YouTube 和 PDF 選擇 Claude AI 或 ChatGPT
- 📤 **自動上傳**：自動上傳內容並送出提示詞
- 💬 **自訂提示詞**：為 YouTube 和 PDF 分別設定提示詞
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

**YouTube 影片：**
1. **開啟任何 YouTube 影片**
2. **點擊工具列中的插件圖標**
3. **字幕會自動**：
   - 從影片中提取
   - 傳送到您選擇的 AI 平台
   - 使用您的自訂提示詞送出

**PDF 檔案：**
1. **在瀏覽器中開啟任何 PDF 檔案**
2. **點擊工具列中的插件圖標**
3. **PDF 會自動**：
   - 在本地下載和處理
   - 上傳到您選擇的 AI 平台
   - 使用您的自訂提示詞送出

### 設定選項

插件彈出視窗可進行設定：

- **AI 平台**：分別為 YouTube 和 PDF 選擇 Claude 或 ChatGPT
- **YouTube 提示詞**：設定影片字幕的預設提示詞（例如：「摘要」或「翻譯成繁體中文」）
- **PDF 提示詞**：設定 PDF 分析的預設提示詞
- **自動儲存設定**：提示詞和平台選擇在輸入時自動儲存

### 使用範例

**YouTube 字幕翻譯**
```
將所有英文字幕翻譯成繁體中文，並附在每一行後面。
```

**YouTube 影片摘要**
```
用英文簡要彙整三、四個段落的重點，並附上繁體中文版本。
```

**考試試題分析（PDF）**
```
以考生的角度，分析問題並撰寫模擬答案，考慮到時間限制，
條列式回答，盡可能使用學術性的關鍵字，並且用繁體中文回答。
並在每一大題後加上詳解，解釋解題思路和脈絡。
```

**文件摘要（PDF）**
```
請提供這份 PDF 文件的摘要，重點整理主要內容和關鍵要點。
```

### 權限說明

- `activeTab`：偵測 YouTube 影片頁面和 PDF 頁面，取得當前網址
- `storage`：在本地儲存您的偏好設定
- `host_permissions` (youtube.com)：提取影片字幕
- `host_permissions` (claude.ai, chatgpt.com)：自動上傳內容並插入提示詞

### 隱私與安全

- ✅ 不收集資料 - 我們沒有伺服器
- ✅ YouTube 字幕和 PDF 在您的裝置上本地處理
- ✅ 資料僅傳送到您選擇的 AI 平台
- ✅ 所有設定安全地儲存在 Chrome 儲存空間
- ✅ 5 分鐘後自動清除

詳見 [PRIVACY_POLICY.md](PRIVACY_POLICY.md)。

### 疑難排解

**YouTube 字幕無法提取？**
- 確保影片有可用的字幕/CC
- 檢查您在 YouTube 影片頁面（youtube.com/watch）
- 開啟瀏覽器控制台（F12）查看錯誤訊息

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

**v1.1.0** (2025-02-19)
- 提示詞和 AI 平台選擇自動儲存（無需按送出即可保存）
- 簡化 Makefile，release 時自動升版

**v1.0.0** (2024-10-15)
- 初始版本發布
- YouTube 字幕提取功能
- PDF 上傳支援
- 支援 Claude 和 ChatGPT
- YouTube 和 PDF 分別的自訂提示詞
- 自動上傳和送出
- 載入指示器改善使用體驗
