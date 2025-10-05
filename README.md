# PDF to Claude AI Chrome 插件

這是一個 Chrome 瀏覽器插件，可以下載 PDF 檔案並自動傳送到 Claude AI 進行分析。

## 功能特色

- 📄 自動下載 PDF 檔案
- 🤖 自動開啟 Claude AI 頁面
- 📤 自動上傳 PDF 到 Claude
- 💬 自訂提示詞

## 安裝方式

### 開發模式安裝

1. 下載或 clone 這個專案到本地
2. 開啟 Chrome 瀏覽器，前往 `chrome://extensions/`
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇這個專案的資料夾

### 準備圖標檔案

在專案根目錄建立 `icons` 資料夾，並放入以下尺寸的圖標：
- `icon16.png` (16x16 像素)
- `icon48.png` (48x48 像素)
- `icon128.png` (128x128 像素)

或者使用線上工具生成圖標：
- [favicon.io](https://favicon.io/)
- [IconKitchen](https://icon.kitchen/)

## 使用方法

1. **輸入 PDF 網址**
   - 點擊瀏覽器工具列上的插件圖標
   - 在彈出視窗中輸入 PDF 檔案的網址
   - 或者在已開啟 PDF 的頁面上點擊插件（會自動填入網址）

2. **設定提示詞**
   - 在「提示詞」欄位輸入你想要問 Claude 的問題
   - 預設提示詞：「請幫我分析這份試題並提供答案」
   - 提示詞會被儲存，下次使用時會自動填入

3. **下載並傳送**
   - 點擊「下載並傳送到 Claude」按鈕
   - 插件會自動：
     - 下載 PDF 檔案
     - 開啟新分頁到 Claude AI
     - 上傳 PDF 檔案
     - 填入提示詞

## 使用範例

### 考試試題分析
```
PDF URL: https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?t=Q&code=114040&c=107&s=1205&q=1
提示詞: 請幫我分析這份試題並提供答案
```

### 文件摘要
```
提示詞: 請提供這份 PDF 文件的摘要，重點整理主要內容
```

### 翻譯需求
```
提示詞: 請將這份 PDF 文件翻譯成中文
```

## 技術架構

- **manifest.json**: Chrome 插件配置檔案（Manifest V3）
- **popup.html/popup.js**: 插件彈出視窗介面
- **background.js**: 背景服務工作者，處理 PDF 下載和資料儲存
- **content.js**: 內容腳本，注入到 Claude.ai 頁面自動上傳檔案

## 注意事項

1. **權限說明**
   - `activeTab`: 讀取當前分頁資訊
   - `downloads`: 下載 PDF 檔案
   - `storage`: 儲存提示詞和 PDF 資料
   - `tabs`: 開啟新分頁

2. **資料安全**
   - PDF 資料僅暫存於瀏覽器本地儲存空間
   - 上傳到 Claude 後會自動清除
   - 資料有效期為 5 分鐘

3. **限制**
   - 僅支援公開可訪問的 PDF 網址
   - 需要有效的 Claude.ai 帳號
   - PDF 檔案大小受 Claude 平台限制

## 疑難排解

### 無法下載 PDF
- 確認 PDF 網址可以直接訪問
- 檢查是否有跨域問題
- 嘗試在無痕模式下使用

### 無法上傳到 Claude
- 確認已登入 Claude.ai 帳號
- 檢查 Claude 頁面是否正常載入
- 查看瀏覽器控制台是否有錯誤訊息

### 提示詞沒有自動填入
- Claude 頁面結構可能已更新
- 可以手動複製貼上提示詞

## 開發與貢獻

歡迎提交 Issue 和 Pull Request！

### 本地開發

1. Clone 專案
```bash
git clone https://github.com/yourusername/pdf-claude.git
cd pdf-claude
```

2. 修改程式碼
3. 在 Chrome 中重新載入插件（chrome://extensions/ → 重新載入）
4. 測試功能

## 授權

MIT License

## 更新日誌

### v1.0.0 (2025-10-05)
- 初始版本發布
- 支援 PDF 下載和上傳到 Claude
- 自訂提示詞功能
