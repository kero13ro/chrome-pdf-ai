setTimeout(async () => {
  await checkForPendingPDF();
}, 2000);

async function checkForPendingPDF() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getPDFData' });

    if (response.success && response.pdfData && response.platform === 'claude') {
      await uploadPDFToClaude(response.pdfData, response.fileName, response.prompt);
    }
  } catch (error) {
    console.error('PDF to Claude: Error checking for pending PDF:', error);
  }
}

async function uploadPDFToClaude(base64Data, fileName, prompt) {
  try {
    const textarea = await waitForElement('div[contenteditable="true"]', 10000);

    if (!textarea) {
      console.error('PDF to Claude: Could not find Claude input field');
      return;
    }

    const blob = base64ToBlob(base64Data, 'application/pdf');
    const file = new File([blob], fileName, { type: 'application/pdf' });

    const fileInput = await findFileInput();

    if (fileInput) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;

      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (prompt) {
        await insertPromptAndSubmit(textarea, prompt);
      }
    } else {
      await uploadViaDragDrop(textarea, file, prompt);
    }
  } catch (error) {
    console.error('PDF to Claude: Error uploading PDF:', error);
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
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dataTransfer
  });

  element.dispatchEvent(dropEvent);

  await new Promise(resolve => setTimeout(resolve, 2000));

  if (prompt) {
    await insertPromptAndSubmit(element, prompt);
  }
}

async function insertPromptAndSubmit(textarea, prompt) {
  textarea.textContent = prompt;

  const inputEvent = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    data: prompt
  });
  textarea.dispatchEvent(inputEvent);

  textarea.focus();
  document.execCommand('insertText', false, prompt);

  await new Promise(resolve => setTimeout(resolve, 500));

  const submitButton = await findSubmitButton();
  if (submitButton) {
    submitButton.click();
  } else {
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    textarea.dispatchEvent(enterEvent);
  }
}

async function findSubmitButton() {
  const selectors = [
    'button[type="submit"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="submit"]',
    'button[data-testid*="send"]',
    'button[data-testid*="submit"]'
  ];

  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button) {
      return button;
    }
  }

  const buttons = document.querySelectorAll('button');
  for (const button of buttons) {
    const text = button.textContent.toLowerCase();
    const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

    if (text.includes('send') || text.includes('submit') ||
        ariaLabel.includes('send') || ariaLabel.includes('submit') ||
        text.includes('發送') || text.includes('送出')) {
      return button;
    }
  }

  const svgButtons = document.querySelectorAll('button svg');
  for (const svg of svgButtons) {
    const button = svg.closest('button');
    if (button && !button.disabled) {
      return button;
    }
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
