chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractTranscript') {
    extractYouTubeTranscript()
      .then(transcript => {
        sendResponse({ success: true, transcript: transcript });
      })
      .catch(error => {
        console.error('Failed to extract transcript:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

async function extractYouTubeTranscript() {
  try {
    console.log('Extracting YouTube transcript...');

    const panelTranscript = await fetchFromOpenPanel();
    if (panelTranscript) {
      console.log('Successfully extracted from transcript panel');
      return panelTranscript;
    }

    const transcript = await fetchTranscriptFromPlayerResponse();
    if (transcript) {
      console.log('Successfully extracted from PlayerResponse');
      return transcript;
    }

    throw new Error('Unable to extract transcript. Please ensure the video has captions available.');
  } catch (error) {
    console.error('Error extracting transcript:', error);
    throw error;
  }
}

async function fetchTranscriptFromPlayerResponse() {
  try {
    const videoId = getVideoId();
    if (!videoId) {
      console.log('Unable to get video ID');
      return null;
    }

    console.log('Video ID:', videoId);

    let playerResponse = null;

    if (window.ytInitialPlayerResponse) {
      playerResponse = window.ytInitialPlayerResponse;
    } else {
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
      console.log('Unable to find ytInitialPlayerResponse');
      return null;
    }

    const captionTracks = findCaptionTracks(playerResponse);
    if (!captionTracks || captionTracks.length === 0) {
      console.log('No caption tracks found');
      return null;
    }

    console.log(`Found ${captionTracks.length} caption tracks`);

    let selectedTrack = captionTracks.find(track =>
      track.languageCode === 'en' ||
      track.languageCode === 'en-US' ||
      track.languageCode === 'en-GB'
    );

    if (!selectedTrack) {
      selectedTrack = captionTracks[0];
    }

    console.log('Selected caption language:', selectedTrack.languageCode);

    let captionUrl = selectedTrack.baseUrl;
    if (!captionUrl.includes('fmt=')) {
      captionUrl += '&fmt=json3';
    }

    console.log('Caption URL:', captionUrl);

    const fetchResponse = await chrome.runtime.sendMessage({
      action: 'fetchCaptionUrl',
      url: captionUrl
    });

    if (!fetchResponse || !fetchResponse.success) {
      console.error('Failed to fetch caption content:', fetchResponse?.error);
      return null;
    }

    const text = fetchResponse.text;
    console.log('Caption content length:', text.length);
    console.log('Caption content preview:', text.substring(0, 200));

    let transcript = '';

    try {
      const jsonData = JSON.parse(text);
      console.log('Successfully parsed as JSON');

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
          console.log('Extracted transcript from JSON, length:', transcript.length);
          return transcript;
        }
      }
    } catch (jsonError) {
      console.log('Not JSON format, trying XML parsing');

      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const textNodes = xmlDoc.getElementsByTagName('text');

        console.log('Found XML text nodes:', textNodes.length);

        if (textNodes.length > 0) {
          for (let i = 0; i < textNodes.length; i++) {
            const nodeText = textNodes[i].textContent;
            const decodedText = decodeHTML(nodeText);
            transcript += decodedText + '\n';
          }

          transcript = transcript.trim();
          if (transcript) {
            console.log('Extracted transcript from XML, length:', transcript.length);
            return transcript;
          }
        }
      } catch (xmlError) {
        console.error('XML parsing failed:', xmlError);
      }
    }

    console.log('Unable to extract content from caption URL');
    return null;
  } catch (error) {
    console.error('Failed to extract transcript from PlayerResponse:', error);
    return null;
  }
}

async function fetchFromOpenPanel() {
  try {
    console.log('Attempting to extract from transcript panel...');

    let transcriptPanel = document.querySelector('ytd-transcript-renderer');

    if (!transcriptPanel) {
      console.log('Transcript panel not open, attempting to open...');

      const moreButton = document.querySelector('tp-yt-paper-button#expand, #expand');
      if (moreButton) {
        const buttonText = moreButton.textContent.toLowerCase();
        if (buttonText.includes('more')) {
          console.log('Clicking expand description button...');
          moreButton.click();
          await sleep(300); // Reduced delay, description expansion is usually fast
        }
      }

      const transcriptSelectors = [
        'button[aria-label*="transcript" i]',
        'button[aria-label*="Show transcript" i]',
        'yt-button-shape button:has-text("Show transcript")',
        '[class*="transcript"] button',
        'ytd-button-renderer button:has-text("Show transcript")'
      ];

      let transcriptButton = null;

      for (const selector of transcriptSelectors) {
        try {
          transcriptButton = document.querySelector(selector);
          if (transcriptButton) {
            console.log('Found transcript button (selector):', selector);
            break;
          }
        } catch (e) {
        }
      }

      if (!transcriptButton) {
        const allButtons = document.querySelectorAll('button, yt-button-shape button');
        for (const button of allButtons) {
          const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
          const text = (button.textContent || '').toLowerCase();

          if (ariaLabel.includes('transcript') ||
              ariaLabel.includes('show transcript') ||
              text.includes('show transcript')) {
            transcriptButton = button;
            console.log('Found transcript button (iteration)');
            break;
          }
        }
      }

      if (transcriptButton) {
        console.log('Clicking transcript button...');
        transcriptButton.click();

        // Use polling to wait for transcript panel, max 3 seconds
        transcriptPanel = await waitForElement('ytd-transcript-renderer', 3000, 50);

        if (!transcriptPanel) {
          console.log('Transcript panel did not appear after clicking button');
          return null;
        }
        console.log('Transcript panel appeared');
      } else {
        console.log('Show transcript button not found, please manually open transcript panel');
        return null;
      }
    }

    if (!transcriptPanel) {
      console.log('Transcript panel not found');
      return null;
    }

    console.log('Transcript panel found, extracting content...');

    let transcriptSegments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');

    if (transcriptSegments.length === 0) {
      console.log('No transcript segments in panel, waiting...');
      // Use polling to wait for transcript segments, max 2 seconds
      const startTime = Date.now();
      while (Date.now() - startTime < 2000) {
        transcriptSegments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');
        if (transcriptSegments.length > 0) {
          console.log('Transcript segments loaded');
          break;
        }
        await sleep(50);
      }

      if (transcriptSegments.length === 0) {
        console.log('Still no transcript segments');
        return null;
      }
    }

    const finalSegments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');
    console.log(`Found ${finalSegments.length} transcript segments`);

    let transcript = '';
    for (const segment of finalSegments) {
      const textElement = segment.querySelector('yt-formatted-string.segment-text');
      if (textElement) {
        transcript += textElement.textContent.trim() + ' ';
      }
    }

    transcript = transcript.trim();
    if (transcript) {
      console.log(`Successfully extracted transcript, length: ${transcript.length}`);
      return transcript;
    }

    return null;
  } catch (error) {
    console.error('Failed to extract from transcript panel:', error);
    return null;
  }
}

function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

function findCaptionTracks(playerResponse) {
  try {
    if (playerResponse.captions &&
        playerResponse.captions.playerCaptionsTracklistRenderer &&
        playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks) {
      return playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
    }
    return null;
  } catch (error) {
    console.error('Error finding caption tracks:', error);
    return null;
  }
}

function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(selector, timeout = 5000, checkInterval = 100) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await sleep(checkInterval);
  }
  return null;
}
