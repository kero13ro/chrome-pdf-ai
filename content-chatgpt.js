// 使用智能重試機制，而不是固定延遲
async function initializeWithRetry() {
  const maxAttempts = 5;
  const retryDelay = 800; // 每次重試間隔 800ms

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // 檢查是否有 pending data
      const hasPendingData = await checkForPendingData();

      if (hasPendingData) {
        // 成功處理，結束
        return;
      }

      // 沒有 pending data，停止重試
      return;
    } catch (error) {
      console.log(`ChatGPT: Attempt ${attempt + 1}/${maxAttempts} failed, retrying...`);

      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

// 立即開始，但使用重試機制
initializeWithRetry();

async function checkForPendingData() {
  try {
    // 檢查是否有 PDF 數據
    const pdfResponse = await chrome.runtime.sendMessage({ action: 'getPDFData' });

    if (pdfResponse.success && pdfResponse.pdfData && pdfResponse.platform === 'chatgpt') {
      await uploadPDFToChatGPT(pdfResponse.pdfData, pdfResponse.fileName, pdfResponse.prompt);
      return true; // 成功處理
    }

    // 檢查是否有 YouTube 數據
    const youtubeResponse = await chrome.runtime.sendMessage({ action: 'getYouTubeData' });

    if (youtubeResponse.success && youtubeResponse.text && youtubeResponse.platform === 'chatgpt') {
      await insertTextToChatGPT(youtubeResponse.text);
      return true; // 成功處理
    }

    return false; // 沒有 pending data
  } catch (error) {
    console.error('ChatGPT: Error checking for pending data:', error);
    throw error; // 重新拋出以觸發重試
  }
}

async function uploadPDFToChatGPT(base64Data, fileName, prompt) {
  try {
    const blob = base64ToBlob(base64Data, 'application/pdf');
    const file = new File([blob], fileName, { type: 'application/pdf' });

    const fileInput = await findFileInput();

    if (fileInput) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);

      await new Promise(resolve => setTimeout(resolve, 5000));

      const textarea = await waitForElement('div#prompt-textarea[contenteditable="true"], #prompt-textarea', 10000);

      if (!textarea) {
        console.error('PDF to ChatGPT: Could not find ChatGPT input field after upload');
        return;
      }

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

async function insertPromptAndSubmit(element, prompt) {
  element.focus();
  await new Promise(resolve => setTimeout(resolve, 300));

  if (element.getAttribute('contenteditable') === 'true') {
    element.innerHTML = '';

    let p = element.querySelector('p');
    if (!p) {
      p = document.createElement('p');
      element.appendChild(p);
    }

    p.removeAttribute('data-placeholder');
    p.classList.remove('placeholder');
    p.textContent = prompt;

    element.textContent = prompt;
    element.innerText = prompt;
  } else {
    element.value = prompt;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, prompt);
    }
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: prompt
  }));

  await new Promise(resolve => setTimeout(resolve, 2000));

  const submitButton = await findSubmitButton();
  if (submitButton) {
    if (!submitButton.disabled) {
      submitButton.click();
    } else {
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
  for (let i = 0; i < 10; i++) {
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
        return button;
      }
    }

    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const buttonText = button.textContent?.toLowerCase() || '';

      if ((ariaLabel.includes('send') || buttonText.includes('send')) && !button.disabled) {
        return button;
      }
    }

    if (i < 9) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const form = document.querySelector('form[data-type="unified-composer"]');
  if (form) {
    const trailingArea = form.querySelector('[class*="grid-area:trailing"], .\\[grid-area\\:trailing\\]');
    if (trailingArea) {
      const buttons = trailingArea.querySelectorAll('button');

      for (const button of buttons) {
        const classes = button.className;
        if ((classes.includes('rounded-full') || classes.includes('composer-secondary-button'))
            && !button.disabled
            && !button.getAttribute('aria-label')?.includes('Dictate')
            && !button.getAttribute('aria-label')?.includes('voice')) {
          return button;
        }
      }
    }

    const roundButtons = form.querySelectorAll('button.rounded-full, button[class*="rounded-full"]');
    for (const button of roundButtons) {
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      if (!ariaLabel.includes('voice') &&
          !ariaLabel.includes('dictate') &&
          !ariaLabel.includes('remove') &&
          !ariaLabel.includes('delete') &&
          !ariaLabel.includes('移除') &&
          !ariaLabel.includes('刪除') &&
          !button.disabled) {
        return button;
      }
    }
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  const allButtons = document.querySelectorAll('button');
  let rightmostButton = null;
  let maxRight = 0;

  for (const button of allButtons) {
    if (button.disabled) continue;

    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
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
    return rightmostButton;
  }

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

async function insertTextToChatGPT(text) {
  try {
    const textarea = await waitForElement('div#prompt-textarea[contenteditable="true"], #prompt-textarea', 10000);

    if (!textarea) {
      console.error('ChatGPT: Could not find ChatGPT input field');
      return;
    }

    await insertPromptAndSubmit(textarea, text);
  } catch (error) {
    console.error('ChatGPT: Error inserting text:', error);
  }
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
