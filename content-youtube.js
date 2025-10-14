// YouTube 字幕提取腳本

// 監聽來自 background.js 的訊息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractTranscript') {
    extractYouTubeTranscript()
      .then(transcript => {
        sendResponse({ success: true, transcript: transcript });
      })
      .catch(error => {
        console.error('提取字幕失敗:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持訊息通道開啟以便異步回應
  }
});

/**
 * 提取 YouTube 影片字幕
 */
async function extractYouTubeTranscript() {
  try {
    console.log('開始提取 YouTube 字幕...');

    // 方法1: 從字幕面板獲取（最可靠）
    const panelTranscript = await fetchFromOpenPanel();
    if (panelTranscript) {
      console.log('成功從字幕面板提取字幕');
      return panelTranscript;
    }

    // 方法2: 從頁面的 ytInitialPlayerResponse 獲取
    const transcript = await fetchTranscriptFromPlayerResponse();
    if (transcript) {
      console.log('成功從 PlayerResponse 提取字幕');
      return transcript;
    }

    throw new Error('無法提取字幕。請確保影片有字幕可用。');
  } catch (error) {
    console.error('提取字幕時發生錯誤:', error);
    throw error;
  }
}

/**
 * 從 ytInitialPlayerResponse 獲取字幕
 */
async function fetchTranscriptFromPlayerResponse() {
  try {
    const videoId = getVideoId();
    if (!videoId) {
      console.log('無法獲取影片 ID');
      return null;
    }

    console.log('影片 ID:', videoId);

    // 獲取 ytInitialPlayerResponse
    let playerResponse = null;

    // 嘗試從全域變數獲取
    if (window.ytInitialPlayerResponse) {
      playerResponse = window.ytInitialPlayerResponse;
    } else {
      // 從頁面腳本中提取
      const scripts = document.getElementsByTagName('script');
      for (const script of scripts) {
        const content = script.textContent;
        if (content.includes('ytInitialPlayerResponse')) {
          const match = content.match(/var ytInitialPlayerResponse = ({.+?});/);
          if (match) {
            try {
              playerResponse = JSON.parse(match[1]);
              break;
            } catch (e) {
              continue;
            }
          }
        }
      }
    }

    if (!playerResponse) {
      console.log('無法找到 ytInitialPlayerResponse');
      return null;
    }

    // 獲取字幕軌道
    const captionTracks = findCaptionTracks(playerResponse);
    if (!captionTracks || captionTracks.length === 0) {
      console.log('找不到字幕軌道');
      return null;
    }

    console.log(`找到 ${captionTracks.length} 個字幕軌道`);

    // 優先選擇英文字幕
    let selectedTrack = captionTracks.find(track =>
      track.languageCode === 'en' ||
      track.languageCode === 'en-US' ||
      track.languageCode === 'en-GB'
    );

    // 如果沒有英文字幕，選擇第一個可用的字幕
    if (!selectedTrack) {
      selectedTrack = captionTracks[0];
    }

    console.log('選擇的字幕語言:', selectedTrack.languageCode);

    // 獲取字幕內容，添加 fmt=json3 參數來獲取 JSON 格式
    let captionUrl = selectedTrack.baseUrl;

    // 嘗試使用 JSON 格式
    if (!captionUrl.includes('fmt=')) {
      captionUrl += '&fmt=json3';
    }

    console.log('字幕 URL:', captionUrl);

    // 使用 background script 來獲取字幕內容（避免 CORS 問題）
    const fetchResponse = await chrome.runtime.sendMessage({
      action: 'fetchCaptionUrl',
      url: captionUrl
    });

    if (!fetchResponse || !fetchResponse.success) {
      console.error('獲取字幕內容失敗:', fetchResponse?.error);
      return null;
    }

    const text = fetchResponse.text;

    console.log('字幕內容長度:', text.length);
    console.log('字幕內容前 200 字元:', text.substring(0, 200));

    let transcript = '';

    // 嘗試作為 JSON 解析
    try {
      const jsonData = JSON.parse(text);
      console.log('成功解析為 JSON');

      if (jsonData.events) {
        for (const event of jsonData.events) {
          if (event.segs) {
            for (const seg of event.segs) {
              if (seg.utf8) {
                transcript += seg.utf8 + ' ';
              }
            }
          }
        }
        transcript = transcript.trim();
        if (transcript) {
          console.log('從 JSON 提取到字幕，長度:', transcript.length);
          return transcript;
        }
      }
    } catch (jsonError) {
      console.log('不是 JSON 格式，嘗試 XML 解析');

      // 嘗試作為 XML 解析
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const textNodes = xmlDoc.getElementsByTagName('text');

        console.log('找到的 XML 文字節點數量:', textNodes.length);

        if (textNodes.length > 0) {
          for (let i = 0; i < textNodes.length; i++) {
            const nodeText = textNodes[i].textContent;
            const decodedText = decodeHTML(nodeText);
            transcript += decodedText + '\n';
          }

          transcript = transcript.trim();
          if (transcript) {
            console.log('從 XML 提取到字幕，長度:', transcript.length);
            return transcript;
          }
        }
      } catch (xmlError) {
        console.error('XML 解析失敗:', xmlError);
      }
    }

    console.log('無法從字幕 URL 提取內容');
    return null;
  } catch (error) {
    console.error('從 PlayerResponse 提取字幕失敗:', error);
    return null;
  }
}

/**
 * 從已經開啟的字幕面板獲取字幕
 */
async function fetchFromOpenPanel() {
  try {
    console.log('嘗試從字幕面板提取...');

    // 檢查字幕面板是否已經開啟
    let transcriptPanel = document.querySelector('ytd-transcript-renderer');

    if (!transcriptPanel) {
      // 嘗試打開字幕面板 - 先展開描述區域
      console.log('字幕面板未開啟，嘗試自動開啟...');

      // 方法1: 點擊「更多」按鈕展開描述
      const moreButton = document.querySelector('tp-yt-paper-button#expand, #expand');
      if (moreButton) {
        const buttonText = moreButton.textContent.toLowerCase();
        if (buttonText.includes('more') || buttonText.includes('更多')) {
          console.log('點擊展開描述按鈕...');
          moreButton.click();
          await sleep(800);
        }
      }

      // 方法2: 查找 Show transcript 按鈕（多種可能的選擇器）
      const transcriptSelectors = [
        'button[aria-label*="transcript" i]',
        'button[aria-label*="Show transcript" i]',
        'yt-button-shape button:has-text("Show transcript")',
        '[class*="transcript"] button',
        'ytd-button-renderer button:has-text("Show transcript")'
      ];

      let transcriptButton = null;

      // 先用選擇器快速查找
      for (const selector of transcriptSelectors) {
        try {
          transcriptButton = document.querySelector(selector);
          if (transcriptButton) {
            console.log('找到字幕按鈕 (選擇器):', selector);
            break;
          }
        } catch (e) {
          // 某些選擇器可能不支援，跳過
        }
      }

      // 如果還沒找到，遍歷所有按鈕
      if (!transcriptButton) {
        const allButtons = document.querySelectorAll('button, yt-button-shape button');
        for (const button of allButtons) {
          const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
          const text = (button.textContent || '').toLowerCase();

          if (ariaLabel.includes('transcript') ||
              ariaLabel.includes('show transcript') ||
              text.includes('show transcript') ||
              ariaLabel.includes('資訊文字') ||
              text.includes('顯示完整資訊文字')) {
            transcriptButton = button;
            console.log('找到字幕按鈕 (遍歷):', { ariaLabel, text: text.substring(0, 50) });
            break;
          }
        }
      }

      if (transcriptButton) {
        console.log('點擊字幕按鈕...');
        transcriptButton.click();
        await sleep(2000); // 等待字幕面板載入
      } else {
        console.log('找不到 Show transcript 按鈕，請手動開啟字幕面板');
        return null;
      }

      // 再次檢查字幕面板
      transcriptPanel = document.querySelector('ytd-transcript-renderer');
    }

    if (!transcriptPanel) {
      console.log('找不到字幕面板');
      return null;
    }

    console.log('找到字幕面板，提取內容...');

    // 提取字幕文字
    const transcriptSegments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');

    if (transcriptSegments.length === 0) {
      console.log('字幕面板中沒有字幕片段，等待載入...');
      await sleep(1000);
      const retrySegments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');
      if (retrySegments.length === 0) {
        console.log('仍然沒有字幕片段');
        return null;
      }
    }

    const finalSegments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');
    console.log(`找到 ${finalSegments.length} 個字幕片段`);

    let transcript = '';
    for (const segment of finalSegments) {
      const textElement = segment.querySelector('yt-formatted-string.segment-text');
      if (textElement) {
        transcript += textElement.textContent.trim() + ' ';
      }
    }

    transcript = transcript.trim();
    if (transcript) {
      console.log(`成功提取字幕，長度: ${transcript.length}`);
      return transcript;
    }

    return null;
  } catch (error) {
    console.error('從字幕面板提取失敗:', error);
    return null;
  }
}

/**
 * 獲取影片 ID
 */
function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

/**
 * 查找字幕軌道
 */
function findCaptionTracks(playerResponse) {
  try {
    if (playerResponse.captions &&
        playerResponse.captions.playerCaptionsTracklistRenderer &&
        playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks) {
      return playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
    }
    return null;
  } catch (error) {
    console.error('查找字幕軌道時發生錯誤:', error);
    return null;
  }
}

/**
 * 解碼 HTML 實體
 */
function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

/**
 * 延遲執行
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
