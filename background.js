// 監聽 icon 點擊事件
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 預設提示詞
    const defaultPrompt = `以考生的角度，分析問題並撰寫模擬答案，考慮到時間限制，條列式回答，盡可能使用學術性的關鍵字，並且用繁體中文回答。並在每一大題後加上詳解，解釋解題思路和脈絡。`;

    // 從 storage 取得儲存的提示詞（如果有的話）
    const saved = await chrome.storage.local.get(['prompt']);
    const prompt = saved.prompt || defaultPrompt;

    // 取得當前頁面的 URL 作為 PDF URL
    const pdfUrl = tab.url;

    // 檢查是否為有效的 URL
    if (!pdfUrl || (!pdfUrl.includes('.pdf') && !pdfUrl.includes('moex.gov.tw'))) {
      // 顯示通知
      chrome.notifications.create('pdf-claude-error', {
        type: 'basic',
        title: 'PDF to Claude AI',
        message: '請在 PDF 頁面或考選部網站上使用此插件',
        iconUrl: '/icons/icon128.png'
      });
      return;
    }

    // 下載並處理 PDF
    await handleDownloadPDF(pdfUrl, prompt);
  } catch (error) {
    console.error('Error in action click handler:', error);
  }
});

async function handleDownloadPDF(pdfUrl, prompt) {
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
      timestamp: Date.now()
    });

    // 開啟 Claude 頁面
    const claudeUrl = 'https://claude.ai/new';
    await chrome.tabs.create({ url: claudeUrl });

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
    chrome.storage.local.get(['pdfData', 'pdfFileName', 'pendingPrompt', 'timestamp'])
      .then(data => {
        // 檢查資料是否過期（5分鐘內有效）
        if (data.timestamp && (Date.now() - data.timestamp) < 5 * 60 * 1000) {
          sendResponse({
            success: true,
            pdfData: data.pdfData,
            fileName: data.pdfFileName,
            prompt: data.pendingPrompt
          });
          // 清除已使用的資料
          chrome.storage.local.remove(['pdfData', 'pdfFileName', 'pendingPrompt', 'timestamp']);
        } else {
          sendResponse({ success: false, error: 'No pending PDF data' });
        }
      });
    return true;
  }
});
