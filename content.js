// Content script 注入到 Claude.ai 頁面
console.log('PDF to Claude: Content script loaded');

// 等待頁面完全載入後再檢查是否有待處理的 PDF
setTimeout(async () => {
  await checkForPendingPDF();
}, 2000);

async function checkForPendingPDF() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getPDFData' });

    if (response.success && response.pdfData) {
      console.log('PDF to Claude: Found pending PDF, preparing to upload');
      await uploadPDFToClaude(response.pdfData, response.fileName, response.prompt);
    }
  } catch (error) {
    console.error('PDF to Claude: Error checking for pending PDF:', error);
  }
}

async function uploadPDFToClaude(base64Data, fileName, prompt) {
  try {
    // 等待 Claude 的輸入框出現
    const textarea = await waitForElement('div[contenteditable="true"]', 10000);

    if (!textarea) {
      console.error('PDF to Claude: Could not find Claude input field');
      return;
    }

    // 將 base64 轉換為 Blob
    const blob = base64ToBlob(base64Data, 'application/pdf');
    const file = new File([blob], fileName, { type: 'application/pdf' });

    // 尋找檔案上傳按鈕或輸入框
    const fileInput = await findFileInput();

    if (fileInput) {
      // 模擬檔案選擇
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      // 觸發 change 事件
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);

      console.log('PDF to Claude: File uploaded via input');

      // 等待檔案上傳完成（觀察頁面變化）
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 插入提示詞
      if (prompt) {
        insertPrompt(textarea, prompt);
      }
    } else {
      // 嘗試使用拖放方式
      await uploadViaDragDrop(textarea, file, prompt);
    }
  } catch (error) {
    console.error('PDF to Claude: Error uploading PDF:', error);
  }
}

async function findFileInput() {
  // 嘗試多種選擇器找到檔案輸入
  const selectors = [
    'input[type="file"]',
    'input[accept*="pdf"]',
    'input[accept*="application/pdf"]'
  ];

  for (const selector of selectors) {
    const input = document.querySelector(selector);
    if (input) {
      return input;
    }
  }

  // 如果沒有找到可見的輸入框，尋找上傳按鈕並點擊
  const uploadButtons = document.querySelectorAll('button, [role="button"]');
  for (const button of uploadButtons) {
    const text = button.textContent.toLowerCase();
    if (text.includes('attach') || text.includes('upload') || text.includes('file')) {
      button.click();
      await new Promise(resolve => setTimeout(resolve, 500));

      const input = document.querySelector('input[type="file"]');
      if (input) {
        return input;
      }
    }
  }

  return null;
}

async function uploadViaDragDrop(element, file, prompt) {
  console.log('PDF to Claude: Attempting drag-drop upload');

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  // 模擬拖放事件
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });

  element.dispatchEvent(dropEvent);

  // 等待上傳完成
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 插入提示詞
  if (prompt) {
    insertPrompt(element, prompt);
  }
}

function insertPrompt(textarea, prompt) {
  // 使用多種方法嘗試插入文字

  // 方法 1: 直接設置 textContent
  textarea.textContent = prompt;

  // 方法 2: 觸發輸入事件
  const inputEvent = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    data: prompt
  });
  textarea.dispatchEvent(inputEvent);

  // 方法 3: 使用 execCommand（較舊的方法但有時有效）
  textarea.focus();
  document.execCommand('insertText', false, prompt);

  console.log('PDF to Claude: Prompt inserted');
}

function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}
