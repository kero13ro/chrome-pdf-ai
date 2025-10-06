document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 檢查頁面類型
  const isYouTube = tab.url && tab.url.includes('youtube.com/watch');
  const isPDF = await checkIfPDF(tab.url);

  const youtubeMode = document.getElementById('youtubeMode');
  const pdfMode = document.getElementById('pdfMode');

  if (isYouTube) {
    // 顯示 YouTube 模式
    youtubeMode.style.display = 'flex';
    document.querySelector('.header h1').textContent = '🎬 YouTube AI Assistant';
    document.querySelector('.header p').textContent = '選擇字幕處理方式';

    const transcriptBtn = document.getElementById('transcriptBtn');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const settingsBtn = document.getElementById('settingsBtn');

    transcriptBtn.addEventListener('click', () => handleYouTubeAction('transcript'));
    summarizeBtn.addEventListener('click', () => handleYouTubeAction('summarize'));
    settingsBtn.addEventListener('click', openSettings);
  } else if (isPDF) {
    // 顯示 PDF 模式
    pdfMode.style.display = 'flex';
    document.querySelector('.header h1').textContent = '📄 PDF to AI Assistant';
    document.querySelector('.header p').textContent = '傳送 PDF 到 AI 平台';

    const sendPdfBtn = document.getElementById('sendPdfBtn');
    const settingsPdfBtn = document.getElementById('settingsPdfBtn');

    sendPdfBtn.addEventListener('click', handlePDFAction);
    settingsPdfBtn.addEventListener('click', openSettings);
  } else {
    showMessage('請在 YouTube 影片頁面或 PDF 頁面使用此功能', 'error');
  }
});

async function handleYouTubeAction(actionType) {
  try {
    showMessage('處理中...', 'info');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 向 background.js 發送請求
    const response = await chrome.runtime.sendMessage({
      action: 'processYouTubeTranscript',
      actionType: actionType,
      tabId: tab.id
    });

    if (response.success) {
      showMessage('正在跳轉到 AI 平台...', 'success');
      setTimeout(() => window.close(), 1000);
    } else {
      showMessage(response.error || '處理失敗', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('發生錯誤: ' + error.message, 'error');
  }
}

async function handlePDFAction() {
  try {
    showMessage('處理中...', 'info');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 向 background.js 發送請求處理 PDF
    const response = await chrome.runtime.sendMessage({
      action: 'processPDF',
      url: tab.url
    });

    if (response.success) {
      showMessage('正在跳轉到 AI 平台...', 'success');
      setTimeout(() => window.close(), 1000);
    } else {
      showMessage(response.error || '處理失敗', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('發生錯誤: ' + error.message, 'error');
  }
}

async function checkIfPDF(url) {
  if (!url) return false;

  const urlLower = url.toLowerCase();
  if (urlLower.endsWith('.pdf') ||
      urlLower.includes('.pdf?') ||
      urlLower.includes('.pdf#')) {
    return true;
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors'
    });
    const contentType = response.headers.get('Content-Type');
    return contentType && contentType.includes('application/pdf');
  } catch (error) {
    // 如果無法檢查，根據 URL 判斷
    return urlLower.includes('.pdf');
  }
}

function openSettings() {
  chrome.runtime.openOptionsPage();
  window.close();
}

function showMessage(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = `status-message show ${type}`;
}
