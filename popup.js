// Default settings
const DEFAULT_SETTINGS = {
  prompt: '以考生的角度，分析問題並撰寫模擬答案，考慮到時間限制，條列式回答，盡可能使用學術性的關鍵字，並且用繁體中文回答。並在每一大題後加上詳解，解釋解題思路和脈絡。',
  youtubePrompt: '將所有英文字幕 翻譯成繁體中文，並附在每一行後面',
  aiPlatform: 'chatgpt',
  youtubeAiPlatform: 'chatgpt'
};

let currentMode = null; // 'youtube' or 'pdf'

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 檢查頁面類型
  const isYouTube = tab.url && tab.url.includes('youtube.com/watch');
  const isPDF = await checkIfPDF(tab.url);

  if (isYouTube) {
    currentMode = 'youtube';
    await initializeYouTubeMode();
  } else if (isPDF) {
    currentMode = 'pdf';
    await initializePDFMode();
  } else {
    showError('請在 YouTube 影片頁面或 PDF 頁面使用此功能');
  }

  // 綁定送出按鈕
  document.getElementById('submitBtn').addEventListener('click', handleSubmit);
});

async function initializeYouTubeMode() {
  // 更新標題
  document.getElementById('headerTitle').textContent = '🎬 YouTube AI Assistant';
  document.getElementById('headerSubtitle').textContent = '提取字幕並送至 AI 平台';

  // 載入設定
  const settings = await chrome.storage.local.get(['youtubePrompt', 'youtubeAiPlatform']);

  // 設定提示詞
  const prompt = settings.youtubePrompt || DEFAULT_SETTINGS.youtubePrompt;
  document.getElementById('promptInput').value = prompt;

  // 設定 AI 平台
  const platform = settings.youtubeAiPlatform || DEFAULT_SETTINGS.youtubeAiPlatform;
  document.getElementById(platform === 'claude' ? 'claudeRadio' : 'chatgptRadio').checked = true;
}

async function initializePDFMode() {
  // 更新標題
  document.getElementById('headerTitle').textContent = '📄 PDF to AI Assistant';
  document.getElementById('headerSubtitle').textContent = '傳送 PDF 到 AI 平台';

  // 載入設定
  const settings = await chrome.storage.local.get(['prompt', 'aiPlatform']);

  // 設定提示詞
  const prompt = settings.prompt || DEFAULT_SETTINGS.prompt;
  document.getElementById('promptInput').value = prompt;

  // 設定 AI 平台
  const platform = settings.aiPlatform || DEFAULT_SETTINGS.aiPlatform;
  document.getElementById(platform === 'claude' ? 'claudeRadio' : 'chatgptRadio').checked = true;
}

async function handleSubmit() {
  const submitBtn = document.getElementById('submitBtn');
  const promptInput = document.getElementById('promptInput');
  const prompt = promptInput.value.trim();

  // 驗證提示詞
  if (!prompt) {
    showMessage('請輸入提示詞', 'error');
    return;
  }

  // 取得選擇的平台
  const platformRadios = document.querySelectorAll('input[name="aiPlatform"]');
  let selectedPlatform = null;
  for (const radio of platformRadios) {
    if (radio.checked) {
      selectedPlatform = radio.value;
      break;
    }
  }

  if (!selectedPlatform) {
    showMessage('請選擇 AI 平台', 'error');
    return;
  }

  // 儲存設定
  if (currentMode === 'youtube') {
    await chrome.storage.local.set({
      youtubePrompt: prompt,
      youtubeAiPlatform: selectedPlatform
    });
  } else if (currentMode === 'pdf') {
    await chrome.storage.local.set({
      prompt: prompt,
      aiPlatform: selectedPlatform
    });
  }

  // 停用按鈕
  submitBtn.disabled = true;
  showMessage('處理中...', 'info');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (currentMode === 'youtube') {
      await handleYouTubeSubmit(tab, prompt, selectedPlatform);
    } else if (currentMode === 'pdf') {
      await handlePDFSubmit(tab, prompt, selectedPlatform);
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage('發生錯誤: ' + error.message, 'error');
    submitBtn.disabled = false;
  }
}

async function handleYouTubeSubmit(tab, prompt, platform) {
  const response = await chrome.runtime.sendMessage({
    action: 'processYouTubeTranscript',
    prompt: prompt,
    platform: platform,
    tabId: tab.id
  });

  if (response.success) {
    showMessage('正在跳轉到 AI 平台...', 'success');
    setTimeout(() => window.close(), 1000);
  } else {
    showMessage(response.error || '處理失敗', 'error');
    document.getElementById('submitBtn').disabled = false;
  }
}

async function handlePDFSubmit(tab, prompt, platform) {
  const response = await chrome.runtime.sendMessage({
    action: 'processPDF',
    url: tab.url,
    prompt: prompt,
    platform: platform
  });

  if (response.success) {
    showMessage('正在跳轉到 AI 平台...', 'success');
    setTimeout(() => window.close(), 1000);
  } else {
    showMessage(response.error || '處理失敗', 'error');
    document.getElementById('submitBtn').disabled = false;
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
    return urlLower.includes('.pdf');
  }
}

function showMessage(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = `status-message show ${type}`;
}

function showError(message) {
  document.getElementById('headerTitle').textContent = '⚠️ 無法使用';
  document.getElementById('headerSubtitle').textContent = message;
  document.getElementById('promptInput').disabled = true;
  document.getElementById('submitBtn').disabled = true;
  document.querySelectorAll('input[name="aiPlatform"]').forEach(radio => {
    radio.disabled = true;
  });
}
