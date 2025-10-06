const DEFAULT_SETTINGS = {
  prompt: '以考生的角度，分析問題並撰寫模擬答案，考慮到時間限制，條列式回答，盡可能使用學術性的關鍵字，並且用繁體中文回答。並在每一大題後加上詳解，解釋解題思路和脈絡。',
  aiPlatform: 'chatgpt',
  transcriptPrompt: '將所有英文字幕 翻譯成繁體中文，並附在每一行後面',
  summarizePrompt: '用英文簡要彙整重點，約三個段落以內，並附上繁體中文版本',
  youtubeAiPlatform: 'chatgpt'
};

async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get([
      'prompt',
      'aiPlatform',
      'transcriptPrompt',
      'summarizePrompt',
      'youtubeAiPlatform'
    ]);

    // PDF 設定
    const promptTextarea = document.getElementById('prompt');
    promptTextarea.value = settings.prompt || DEFAULT_SETTINGS.prompt;

    const aiPlatform = settings.aiPlatform || DEFAULT_SETTINGS.aiPlatform;
    const radioButton = document.getElementById(aiPlatform);
    if (radioButton) {
      radioButton.checked = true;
    }

    // YouTube 設定
    const transcriptPromptTextarea = document.getElementById('transcriptPrompt');
    transcriptPromptTextarea.value = settings.transcriptPrompt || DEFAULT_SETTINGS.transcriptPrompt;

    const summarizePromptTextarea = document.getElementById('summarizePrompt');
    summarizePromptTextarea.value = settings.summarizePrompt || DEFAULT_SETTINGS.summarizePrompt;

    const youtubeAiPlatform = settings.youtubeAiPlatform || DEFAULT_SETTINGS.youtubeAiPlatform;
    const youtubeRadioButton = document.getElementById(`youtube${youtubeAiPlatform.charAt(0).toUpperCase() + youtubeAiPlatform.slice(1)}`);
    if (youtubeRadioButton) {
      youtubeRadioButton.checked = true;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showMessage('載入設定失敗', 'error');
  }
}

async function saveSettings(event) {
  event.preventDefault();

  const form = document.getElementById('settingsForm');
  const formData = new FormData(form);

  const settings = {
    prompt: formData.get('prompt').trim(),
    aiPlatform: formData.get('aiPlatform'),
    transcriptPrompt: formData.get('transcriptPrompt').trim(),
    summarizePrompt: formData.get('summarizePrompt').trim(),
    youtubeAiPlatform: formData.get('youtubeAiPlatform')
  };

  if (!settings.prompt) {
    showMessage('PDF 提示詞不能為空', 'error');
    return;
  }

  if (!settings.aiPlatform) {
    showMessage('請選擇 PDF AI 平台', 'error');
    return;
  }

  if (!settings.transcriptPrompt) {
    showMessage('Transcript 提示詞不能為空', 'error');
    return;
  }

  if (!settings.summarizePrompt) {
    showMessage('Summarize 提示詞不能為空', 'error');
    return;
  }

  if (!settings.youtubeAiPlatform) {
    showMessage('請選擇 YouTube AI 平台', 'error');
    return;
  }

  try {
    await chrome.storage.local.set(settings);
    showMessage('設定已儲存！', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showMessage('儲存失敗，請重試', 'error');
  }
}

async function resetSettings() {
  if (!confirm('確定要重設為預設值嗎？')) {
    return;
  }

  try {
    await chrome.storage.local.set(DEFAULT_SETTINGS);

    document.getElementById('prompt').value = DEFAULT_SETTINGS.prompt;
    document.getElementById(DEFAULT_SETTINGS.aiPlatform).checked = true;
    document.getElementById('transcriptPrompt').value = DEFAULT_SETTINGS.transcriptPrompt;
    document.getElementById('summarizePrompt').value = DEFAULT_SETTINGS.summarizePrompt;
    document.getElementById(`youtube${DEFAULT_SETTINGS.youtubeAiPlatform.charAt(0).toUpperCase() + DEFAULT_SETTINGS.youtubeAiPlatform.slice(1)}`).checked = true;

    showMessage('已重設為預設值', 'success');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showMessage('重設失敗，請重試', 'error');
  }
}

function showMessage(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;

  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  const form = document.getElementById('settingsForm');
  form.addEventListener('submit', saveSettings);

  const resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', resetSettings);
});
