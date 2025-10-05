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

const DEFAULT_SETTINGS = {
  prompt: '以考生的角度，分析問題並撰寫模擬答案，考慮到時間限制，條列式回答，盡可能使用學術性的關鍵字，並且用繁體中文回答。並在每一大題後加上詳解，解釋解題思路和脈絡。',
  aiPlatform: 'chatgpt'
};

// Prevent duplicate clicks
let isProcessing = false;
let processingTabId = null;

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
      method: 'GET',
      headers: { 'Range': 'bytes=0-10' }
    });

    const contentType = response.headers.get('Content-Type');

    if (contentType && contentType.includes('application/pdf')) {
      return true;
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length >= 4 &&
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46) {
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
}

chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (isProcessing && processingTabId === tab.id) {
      return;
    }

    isProcessing = true;
    processingTabId = tab.id;

    const settings = await chrome.storage.local.get(['prompt', 'aiPlatform']);
    const prompt = settings.prompt || DEFAULT_SETTINGS.prompt;
    const aiPlatform = settings.aiPlatform || DEFAULT_SETTINGS.aiPlatform;
    const pdfUrl = tab.url;

    const isPDF = await checkIfPDF(pdfUrl);

    if (!isPDF) {
      isProcessing = false;
      processingTabId = null;

      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon128.png',
        title: 'PDF to AI Assistant',
        message: 'Please use this extension on a PDF page',
      });
      return;
    }

    await handleDownloadPDF(pdfUrl, prompt, aiPlatform);

    isProcessing = false;
    processingTabId = null;
  } catch (error) {
    console.error('Error in action click handler:', error);
    isProcessing = false;
    processingTabId = null;
  }
});

async function handleDownloadPDF(pdfUrl, prompt, aiPlatform) {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error('Cannot download PDF');
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    await chrome.storage.local.set({
      pdfData: base64,
      pdfFileName: extractFileName(pdfUrl),
      pendingPrompt: prompt,
      pendingPlatform: aiPlatform,
      timestamp: Date.now()
    });

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPDFData') {
    chrome.storage.local.get(['pdfData', 'pdfFileName', 'pendingPrompt', 'pendingPlatform', 'timestamp'])
      .then(data => {
        if (data.timestamp && (Date.now() - data.timestamp) < 5 * 60 * 1000) {
          sendResponse({
            success: true,
            pdfData: data.pdfData,
            fileName: data.pdfFileName,
            prompt: data.pendingPrompt,
            platform: data.pendingPlatform || 'claude'
          });
          chrome.storage.local.remove(['pdfData', 'pdfFileName', 'pendingPrompt', 'pendingPlatform', 'timestamp']);
        } else {
          sendResponse({ success: false, error: 'No pending PDF data' });
        }
      });
    return true;
  }
});
