// AI 平台配置
const AI_PLATFORMS = {
  claude: {
    name: 'Claude',
    url: 'https://claude.ai/new',
    displayName: 'Claude AI'
  },
  chatgpt: {
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    displayName: 'ChatGPT'
  }
};

// 預設設定
const DEFAULT_SETTINGS = {
  prompt: '以考生的角度，分析問題並撰寫模擬答案，考慮到時間限制，條列式回答，盡可能使用學術性的關鍵字，並且用繁體中文回答。並在每一大題後加上詳解，解釋解題思路和脈絡。',
  aiPlatform: 'chatgpt'
};

// 監聽 icon 點擊事件
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 從 storage 取得設定
    const settings = await chrome.storage.local.get(['prompt', 'aiPlatform']);
    const prompt = settings.prompt || DEFAULT_SETTINGS.prompt;
    const aiPlatform = settings.aiPlatform || DEFAULT_SETTINGS.aiPlatform;

    // 取得當前頁面的 URL 作為 PDF URL
    const pdfUrl = tab.url;

    // 檢查是否為有效的 URL
    if (!pdfUrl || (!pdfUrl.includes('.pdf') && !pdfUrl.includes('moex.gov.tw'))) {
      // 顯示通知
      const platformName = AI_PLATFORMS[aiPlatform]?.displayName || 'AI';
      chrome.notifications.create('pdf-ai-error', {
        type: 'basic',
        title: 'PDF to AI',
        message: '請在 PDF 頁面或考選部網站上使用此插件',
        iconUrl: '/icons/icon128.png'
      });
      return;
    }

    // 下載並處理 PDF
    await handleDownloadPDF(pdfUrl, prompt, aiPlatform);
  } catch (error) {
    console.error('Error in action click handler:', error);
  }
});

async function handleDownloadPDF(pdfUrl, prompt, aiPlatform) {
  try {
    // 下載 PDF 檔案
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error('無法下載 PDF 檔案');
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    // 儲存 PDF 資料和提示詞到 storage
    await chrome.storage.local.set({
      pdfData: base64,
      pdfFileName: extractFileName(pdfUrl),
      pendingPrompt: prompt,
      pendingPlatform: aiPlatform,
      timestamp: Date.now()
    });

    // 根據選擇的 AI 平台開啟對應頁面
    const platform = AI_PLATFORMS[aiPlatform] || AI_PLATFORMS.claude;
    await chrome.tabs.create({ url: platform.url });

    return { success: true };
  } catch (error) {
    console.error('Error in handleDownloadPDF:', error);
    return { success: false, error: error.message };
  }
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function extractFileName(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return filename || 'document.pdf';
  } catch (error) {
    return 'document.pdf';
  }
}

// 監聽來自 content script 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPDFData') {
    chrome.storage.local.get(['pdfData', 'pdfFileName', 'pendingPrompt', 'pendingPlatform', 'timestamp'])
      .then(data => {
        // 檢查資料是否過期（5分鐘內有效）
        if (data.timestamp && (Date.now() - data.timestamp) < 5 * 60 * 1000) {
          sendResponse({
            success: true,
            pdfData: data.pdfData,
            fileName: data.pdfFileName,
            prompt: data.pendingPrompt,
            platform: data.pendingPlatform || 'claude'
          });
          // 清除已使用的資料
          chrome.storage.local.remove(['pdfData', 'pdfFileName', 'pendingPrompt', 'pendingPlatform', 'timestamp']);
        } else {
          sendResponse({ success: false, error: 'No pending PDF data' });
        }
      });
    return true;
  }
});
