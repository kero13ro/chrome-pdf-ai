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
  youtubePrompt: '用英文簡要彙整三、四個段落的重點，並附上繁體中文版本',
  aiPlatform: 'chatgpt',
  youtubeAiPlatform: 'chatgpt'
};

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

async function handleYouTubeTranscript(prompt, platform, tabId) {
  try {
    let response;
    try {
      response = await chrome.tabs.sendMessage(tabId, { action: 'extractTranscript' });
    } catch (messageError) {
      throw new Error('無法連接到頁面。請重新整理 YouTube 頁面後再試。');
    }

    if (!response || !response.success || !response.transcript) {
      throw new Error(response?.error || '無法提取字幕');
    }

    const fullText = `${prompt}\n\n字幕內容:\n${response.transcript}`;

    await chrome.storage.local.set({
      youtubeText: fullText,
      youtubePrompt: prompt,
      youtubePlatform: platform,
      youtubeTimestamp: Date.now()
    });

    const aiPlatform = AI_PLATFORMS[platform] || AI_PLATFORMS.chatgpt;
    await chrome.tabs.create({ url: aiPlatform.url });

    return { success: true };
  } catch (error) {
    console.error('處理 YouTube 字幕時發生錯誤:', error);
    return { success: false, error: error.message };
  }
}

async function handlePDFFromPopup(pdfUrl, prompt, platform) {
  try {
    const isPDF = await checkIfPDF(pdfUrl);

    if (!isPDF) {
      return { success: false, error: 'Please use this extension on a PDF page' };
    }

    await handleDownloadPDF(pdfUrl, prompt, platform);

    return { success: true };
  } catch (error) {
    console.error('Error processing PDF:', error);
    return { success: false, error: error.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkIfPDF') {
    checkIfPDF(message.url)
      .then(isPDF => sendResponse({ isPDF: isPDF }))
      .catch(() => sendResponse({ isPDF: false }));
    return true;
  }

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

  if (message.action === 'processYouTubeTranscript') {
    handleYouTubeTranscript(message.prompt, message.platform, message.tabId)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'getYouTubeData') {
    chrome.storage.local.get(['youtubeText', 'youtubePrompt', 'youtubePlatform', 'youtubeTimestamp'])
      .then(data => {
        if (data.youtubeTimestamp && (Date.now() - data.youtubeTimestamp) < 5 * 60 * 1000) {
          sendResponse({
            success: true,
            text: data.youtubeText,
            prompt: data.youtubePrompt,
            platform: data.youtubePlatform || 'chatgpt'
          });
          chrome.storage.local.remove(['youtubeText', 'youtubePrompt', 'youtubePlatform', 'youtubeTimestamp']);
        } else {
          sendResponse({ success: false, error: 'No pending YouTube data' });
        }
      });
    return true;
  }

  if (message.action === 'processPDF') {
    handlePDFFromPopup(message.url, message.prompt, message.platform)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'fetchCaptionUrl') {
    fetch(message.url)
      .then(response => {
        console.log('Subtitle fetch status:', response.status);
        console.log('Subtitle fetch headers:', [...response.headers.entries()]);
        return response.text();
      })
      .then(text => {
        console.log('Subtitle text length:', text.length);
        console.log('Subtitle text preview:', text.substring(0, 500));
        sendResponse({ success: true, text: text });
      })
      .catch(error => {
        console.error('Subtitle fetch error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
