/* Author: DiskoZawr - https://github.com/Diskoza */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action !== 'openPopout') return false;

  const { videoId, startTime = 0 } = message;
  const url = message.url || (
    videoId ? 'https://www.youtube.com/watch?v=' + videoId + (startTime > 0 ? '&t=' + startTime : '') : ''
  );

  if (!url) {
    sendResponse({ success: false, error: 'Missing page url.' });
    return false;
  }

  chrome.windows.create({
    url,
    type: 'popup',
    width: 800,
    height: 500,
    focused: true
  });

  sendResponse({ success: true });
  return false;
});
