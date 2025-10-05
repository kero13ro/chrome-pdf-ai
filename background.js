// 監聽來自 popup 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadPDF') {
    handleDownloadPDF(message.url, message.prompt)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持訊息通道開放以便異步回應
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
