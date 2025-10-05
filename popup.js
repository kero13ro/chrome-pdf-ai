document.addEventListener('DOMContentLoaded', async () => {
  const pdfUrlInput = document.getElementById('pdfUrl');
  const promptInput = document.getElementById('prompt');
  const processBtn = document.getElementById('processBtn');
  const statusDiv = document.getElementById('status');

  // 嘗試從當前頁面獲取 PDF URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url && tab.url.includes('.pdf')) {
    pdfUrlInput.value = tab.url;
  }

  // 載入儲存的提示詞
  const saved = await chrome.storage.local.get(['prompt']);
  if (saved.prompt) {
    promptInput.value = saved.prompt;
  }

  processBtn.addEventListener('click', async () => {
    const pdfUrl = pdfUrlInput.value.trim();
    const prompt = promptInput.value.trim();

    if (!pdfUrl) {
      showStatus('請輸入 PDF 網址', 'error');
      return;
    }

    if (!prompt) {
      showStatus('請輸入提示詞', 'error');
      return;
    }

    // 儲存提示詞
    await chrome.storage.local.set({ prompt });

    processBtn.disabled = true;
    showStatus('正在下載 PDF...', 'info');

    try {
      // 發送訊息到 background script 處理下載
      const response = await chrome.runtime.sendMessage({
        action: 'downloadPDF',
        url: pdfUrl,
        prompt: prompt
      });

      if (response.success) {
        showStatus('PDF 已下載，正在開啟 Claude...', 'success');

        // 等待一下再關閉 popup（讓用戶看到成功訊息）
        setTimeout(() => {
          window.close();
        }, 1000);
      } else {
        showStatus('錯誤: ' + response.error, 'error');
        processBtn.disabled = false;
      }
    } catch (error) {
      showStatus('錯誤: ' + error.message, 'error');
      processBtn.disabled = false;
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
  }
});
