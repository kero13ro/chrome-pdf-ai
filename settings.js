// 預設設定值
const DEFAULT_SETTINGS = {
  prompt: '以考生的角度，分析問題並撰寫模擬答案，考慮到時間限制，條列式回答，盡可能使用學術性的關鍵字，並且用繁體中文回答。並在每一大題後加上詳解，解釋解題思路和脈絡。',
  aiPlatform: 'chatgpt'
};

// 載入設定
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get(['prompt', 'aiPlatform']);

    // 設定提示詞
    const promptTextarea = document.getElementById('prompt');
    promptTextarea.value = settings.prompt || DEFAULT_SETTINGS.prompt;

    // 設定 AI 平台
    const aiPlatform = settings.aiPlatform || DEFAULT_SETTINGS.aiPlatform;
    const radioButton = document.getElementById(aiPlatform);
    if (radioButton) {
      radioButton.checked = true;
    }
  } catch (error) {
    console.error('載入設定失敗:', error);
    showMessage('載入設定失敗', 'error');
  }
}

// 儲存設定
async function saveSettings(event) {
  event.preventDefault();

  const form = document.getElementById('settingsForm');
  const formData = new FormData(form);

  const settings = {
    prompt: formData.get('prompt').trim(),
    aiPlatform: formData.get('aiPlatform')
  };

  // 驗證
  if (!settings.prompt) {
    showMessage('提示詞不能為空', 'error');
    return;
  }

  if (!settings.aiPlatform) {
    showMessage('請選擇 AI 平台', 'error');
    return;
  }

  try {
    await chrome.storage.local.set(settings);
    showMessage('設定已儲存！', 'success');
  } catch (error) {
    console.error('儲存設定失敗:', error);
    showMessage('儲存失敗，請重試', 'error');
  }
}

// 重設為預設值
async function resetSettings() {
  if (!confirm('確定要重設為預設值嗎？')) {
    return;
  }

  try {
    await chrome.storage.local.set(DEFAULT_SETTINGS);

    // 更新 UI
    document.getElementById('prompt').value = DEFAULT_SETTINGS.prompt;
    document.getElementById(DEFAULT_SETTINGS.aiPlatform).checked = true;

    showMessage('已重設為預設值', 'success');
  } catch (error) {
    console.error('重設失敗:', error);
    showMessage('重設失敗，請重試', 'error');
  }
}

// 顯示訊息
function showMessage(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;

  // 3秒後自動隱藏成功訊息
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 載入設定
  loadSettings();

  // 綁定事件
  const form = document.getElementById('settingsForm');
  form.addEventListener('submit', saveSettings);

  const resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', resetSettings);

  // 即時儲存提示（optional）
  const promptTextarea = document.getElementById('prompt');
  let saveTimeout;
  promptTextarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    // 可以加入自動儲存功能
  });
});
