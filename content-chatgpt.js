// Content script 注入到 ChatGPT 頁面
console.log('PDF to ChatGPT: Content script loaded');

// 等待頁面完全載入後再檢查是否有待處理的 PDF
setTimeout(async () => {
  await checkForPendingPDF();
}, 2000);

async function checkForPendingPDF() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getPDFData' });

    if (response.success && response.pdfData && response.platform === 'chatgpt') {
      console.log('PDF to ChatGPT: Found pending PDF, preparing to upload');
      await uploadPDFToChatGPT(response.pdfData, response.fileName, response.prompt);
    }
  } catch (error) {
    console.error('PDF to ChatGPT: Error checking for pending PDF:', error);
  }
}

async function uploadPDFToChatGPT(base64Data, fileName, prompt) {
  try {
    // 將 base64 轉換為 Blob
    const blob = base64ToBlob(base64Data, 'application/pdf');
    const file = new File([blob], fileName, { type: 'application/pdf' });

    // 尋找檔案上傳按鈕
    const fileInput = await findFileInput();

    if (fileInput) {
      // 模擬檔案選擇
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      // 觸發 change 事件
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);

      console.log('PDF to ChatGPT: File uploaded via input');

      // 等待檔案上傳完成（延長等待時間）
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 重新尋找輸入框（上傳後可能會重新渲染）
      // ChatGPT 使用 contenteditable div，id 為 prompt-textarea
      const textarea = await waitForElement('div#prompt-textarea[contenteditable="true"], #prompt-textarea', 10000);

      if (!textarea) {
        console.error('PDF to ChatGPT: Could not find ChatGPT input field after upload');
        return;
      }

      console.log('PDF to ChatGPT: Found input field:', textarea);

      // 插入提示詞並送出
      if (prompt) {
        await insertPromptAndSubmit(textarea, prompt);
      }
    } else {
      console.error('PDF to ChatGPT: Could not find file input');
    }
  } catch (error) {
    console.error('PDF to ChatGPT: Error uploading PDF:', error);
  }
}

async function findFileInput() {
  // ChatGPT 的檔案輸入選擇器
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

  // 尋找附件按鈕並點擊
  const attachButtons = document.querySelectorAll('button[aria-label*="Attach"], button[aria-label*="附加"], button svg');
  for (const button of attachButtons) {
    const btn = button.tagName === 'BUTTON' ? button : button.closest('button');
    if (btn) {
      btn.click();
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
  console.log('PDF to ChatGPT: Attempting drag-drop upload');

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });

  element.dispatchEvent(dropEvent);

  // 等待上傳完成
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 插入提示詞並送出
  if (prompt) {
    await insertPromptAndSubmit(element, prompt);
  }
}

async function insertPromptAndSubmit(element, prompt) {
  // 先聚焦到輸入框
  element.focus();
  await new Promise(resolve => setTimeout(resolve, 300));

  console.log('PDF to ChatGPT: Element type:', element.tagName, 'contenteditable:', element.getAttribute('contenteditable'));

  // ChatGPT 使用 contenteditable div，需要特殊處理
  if (element.getAttribute('contenteditable') === 'true') {
    // 清除現有內容
    element.innerHTML = '';

    // 找到內部的 <p> 標籤
    let p = element.querySelector('p');
    if (!p) {
      p = document.createElement('p');
      element.appendChild(p);
    }

    // 移除 placeholder 類別
    p.removeAttribute('data-placeholder');
    p.classList.remove('placeholder');

    // 設定文字內容
    p.textContent = prompt;

    // 也設定元素的 textContent
    element.textContent = prompt;
    element.innerText = prompt;

    console.log('PDF to ChatGPT: Set content to contenteditable div');
  } else {
    // 傳統 textarea 的處理
    element.value = prompt;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, prompt);
    }
  }

  // 觸發多種輸入事件
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: prompt
  }));

  console.log('PDF to ChatGPT: Prompt inserted, content:', element.textContent?.substring(0, 50));

  // 等待確保提示詞已插入並且送出按鈕啟用（延長時間）
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 尋找並點擊送出按鈕
  const submitButton = await findSubmitButton();
  if (submitButton) {
    console.log('PDF to ChatGPT: Found submit button, clicking');

    // 確保按鈕已啟用
    if (!submitButton.disabled) {
      submitButton.click();
      console.log('PDF to ChatGPT: Submit button clicked');
    } else {
      console.log('PDF to ChatGPT: Submit button is disabled, trying Enter key');
      // 使用 Enter 鍵作為備案
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true,
        cancelable: false
      });
      element.dispatchEvent(enterEvent);
    }
  } else {
    // 如果找不到送出按鈕，使用 Enter 鍵
    console.log('PDF to ChatGPT: Submit button not found, using Enter key');
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      bubbles: true,
      cancelable: false
    });
    element.dispatchEvent(enterEvent);
  }
}

async function findSubmitButton() {
  // 先等待送出按鈕出現並啟用（最多等待 5 秒）
  for (let i = 0; i < 10; i++) {
    // ChatGPT 的送出按鈕選擇器（多種可能性）
    const selectors = [
      'button[data-testid="send-button"]',
      'button[data-testid="fruitjuice-send-button"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="送出"]',
      'button[type="submit"]'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button && !button.disabled) {
        console.log(`PDF to ChatGPT: Found submit button with selector: ${selector}`);
        return button;
      }
    }

    // 尋找包含特定文字的按鈕
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const buttonText = button.textContent?.toLowerCase() || '';

      if ((ariaLabel.includes('send') || buttonText.includes('send')) && !button.disabled) {
        console.log('PDF to ChatGPT: Found submit button by text/aria-label');
        return button;
      }
    }

    // 如果還沒找到，等待 500ms 再試
    if (i < 9) {
      console.log(`PDF to ChatGPT: Waiting for submit button... attempt ${i + 1}/10`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 根據 HTML 結構，尋找 form 內部靠右的按鈕（通常是送出按鈕）
  const form = document.querySelector('form[data-type="unified-composer"]');
  if (form) {
    console.log('PDF to ChatGPT: Found composer form');

    // 在 [grid-area:trailing] 區域尋找按鈕
    const trailingArea = form.querySelector('[class*="grid-area:trailing"], .\\[grid-area\\:trailing\\]');
    if (trailingArea) {
      console.log('PDF to ChatGPT: Found trailing area');
      const buttons = trailingArea.querySelectorAll('button');

      // 尋找圓形按鈕（通常是送出按鈕）
      for (const button of buttons) {
        const classes = button.className;
        if ((classes.includes('rounded-full') || classes.includes('composer-secondary-button'))
            && !button.disabled
            && !button.getAttribute('aria-label')?.includes('Dictate')
            && !button.getAttribute('aria-label')?.includes('voice')) {
          console.log('PDF to ChatGPT: Found potential submit button in trailing area');
          return button;
        }
      }
    }

    // 備案：尋找 form 內所有的圓形按鈕
    const roundButtons = form.querySelectorAll('button.rounded-full, button[class*="rounded-full"]');
    for (const button of roundButtons) {
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      // 排除語音按鈕、移除檔案按鈕等
      if (!ariaLabel.includes('voice') &&
          !ariaLabel.includes('dictate') &&
          !ariaLabel.includes('remove') &&
          !ariaLabel.includes('delete') &&
          !ariaLabel.includes('移除') &&
          !ariaLabel.includes('刪除') &&
          !button.disabled) {
        console.log('PDF to ChatGPT: Found round button (likely submit):', ariaLabel);
        return button;
      }
    }
  }

  // 如果在輸入框有內容的情況下，送出按鈕可能才會出現
  // 等待一下讓按鈕出現
  await new Promise(resolve => setTimeout(resolve, 500));

  // 最後嘗試：尋找所有按鈕，找到最右側的啟用按鈕
  const allButtons = document.querySelectorAll('button');
  let rightmostButton = null;
  let maxRight = 0;

  for (const button of allButtons) {
    if (button.disabled) continue;

    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
    // 排除不相關的按鈕
    if (ariaLabel.includes('remove') ||
        ariaLabel.includes('delete') ||
        ariaLabel.includes('voice') ||
        ariaLabel.includes('dictate') ||
        ariaLabel.includes('plus') ||
        ariaLabel.includes('add')) {
      continue;
    }

    const rect = button.getBoundingClientRect();
    if (rect.right > maxRight && rect.bottom > window.innerHeight - 200) {
      maxRight = rect.right;
      rightmostButton = button;
    }
  }

  if (rightmostButton) {
    console.log('PDF to ChatGPT: Found rightmost button (likely submit):', rightmostButton.getAttribute('aria-label'));
    return rightmostButton;
  }

  console.log('PDF to ChatGPT: No submit button found');
  return null;
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
