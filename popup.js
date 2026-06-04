/* Author: DiskoZawr - https://github.com/Diskoza */

(async () => {
  const videoSection = document.getElementById('videoSection');
  const noVideoSection = document.getElementById('noVideoSection');
  const thumbImg = document.getElementById('thumbImg');
  const videoTitle = document.getElementById('videoTitle');
  const videoChannel = document.getElementById('videoChannel');
  const popoutBtn = document.getElementById('popoutBtn');
  const statusText = document.getElementById('statusText');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isSupportedPage = /^https?:\/\//.test(tab?.url || '');

  function showNoVideo(text = 'Open a page with a video, then start Picture-in-Picture.') {
    videoSection.style.display = 'none';
    noVideoSection.style.display = 'block';
    const noVideoText = noVideoSection.querySelector('p');
    if (noVideoText) noVideoText.textContent = text;
  }

  if (!isSupportedPage) {
    showNoVideo('This page cannot be controlled by the extension.');
    return;
  }

  function getYouTubeVideoId(pageUrl) {
    try {
      const url = new URL(pageUrl);
      return /(^|\.)youtube\.com$/.test(url.hostname) ? url.searchParams.get('v') : null;
    } catch {
      return null;
    }
  }

  function getYouTubeThumbnail(pageUrl) {
    const videoId = getYouTubeVideoId(pageUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  }

  async function getPageInfo() {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => {
        const minWidth = 160;
        const minHeight = 90;

        function isVisibleVideo(video) {
          const rect = video.getBoundingClientRect();
          if (rect.width < minWidth || rect.height < minHeight) return false;

          const style = getComputedStyle(video);
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
        }

        function videoScore(video) {
          const rect = video.getBoundingClientRect();
          const area = Math.max(rect.width, 0) * Math.max(rect.height, 0);
          const playbackBonus = video.paused ? 0 : 1000000;
          return area + playbackBonus + video.readyState * 10000;
        }

        const video = Array.from(document.querySelectorAll('video'))
          .filter(isVisibleVideo)
          .sort((a, b) => videoScore(b) - videoScore(a))[0] || null;

        const title =
          document.querySelector('meta[property="og:title"]')?.content?.trim() ||
          document.title?.replace(' - YouTube', '').trim() ||
          location.hostname;
        const site = location.hostname.replace(/^www\./, '');

        if (!video) {
          return { hasVideo: false, title, site, score: 0 };
        }

        let poster = video.poster || '';
        try {
          poster = poster ? new URL(poster, location.href).href : '';
        } catch {
          poster = '';
        }

        return {
          hasVideo: true,
          title,
          site,
          poster,
          time: Math.floor(video.currentTime || 0),
          duration: Number.isFinite(video.duration) ? Math.floor(video.duration) : 0,
          score: videoScore(video)
        };
      }
    });

    return results
      .map((item) => item.result)
      .filter((item) => item?.hasVideo)
      .sort((a, b) => b.score - a.score)[0] || null;
  }

  async function requestPiPFromContentScript() {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'enterPiP' });
      if (response?.success) return;
    } catch {
      // Some sites keep video in a child frame.
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: async () => {
        const minWidth = 160;
        const minHeight = 90;

        function isVisibleVideo(video) {
          const rect = video.getBoundingClientRect();
          if (rect.width < minWidth || rect.height < minHeight) return false;

          const style = getComputedStyle(video);
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
        }

        function videoScore(video) {
          const rect = video.getBoundingClientRect();
          const area = Math.max(rect.width, 0) * Math.max(rect.height, 0);
          const playbackBonus = video.paused ? 0 : 1000000;
          return area + playbackBonus + video.readyState * 10000;
        }

        try {
          if (!document.pictureInPictureEnabled) {
            return { success: false, error: 'Picture-in-Picture is disabled.' };
          }

          const video = Array.from(document.querySelectorAll('video'))
            .filter(isVisibleVideo)
            .sort((a, b) => videoScore(b) - videoScore(a))[0] || null;

          if (!video) {
            return { success: false, error: 'No visible video was found.' };
          }

          if (document.pictureInPictureElement === video) {
            await document.exitPictureInPicture();
            return { success: true };
          }

          if (video.disablePictureInPicture) {
            video.disablePictureInPicture = false;
          }

          await video.requestPictureInPicture();
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
    });

    if (!results.some((item) => item.result?.success)) {
      const error = results.map((item) => item.result?.error).filter(Boolean)[0] || 'Picture-in-Picture was blocked.';
      throw new Error(error);
    }
  }

  let pageInfo = null;

  try {
    pageInfo = await getPageInfo();
  } catch (err) {
    console.warn('[Video Pop-Out Player] Video detection failed:', err);
  }

  if (!pageInfo) {
    showNoVideo('No visible HTML5 video was found on this page.');
    return;
  }

  const thumbnail = getYouTubeThumbnail(tab.url) || pageInfo.poster || '';

  if (thumbnail) {
    thumbImg.src = thumbnail;
    thumbImg.style.display = 'block';
  } else {
    thumbImg.removeAttribute('src');
    thumbImg.style.display = 'none';
  }

  videoTitle.textContent = pageInfo.title || tab.title || 'Video';
  videoChannel.textContent = pageInfo.site || new URL(tab.url).hostname;
  videoSection.style.display = 'block';
  noVideoSection.style.display = 'none';

  popoutBtn.addEventListener('click', async () => {
    popoutBtn.disabled = true;
    popoutBtn.textContent = 'Starting...';
    statusText.textContent = 'Starting Picture-in-Picture...';

    try {
      await requestPiPFromContentScript();
      window.close();
      return;
    } catch (err) {
      statusText.textContent = err.message || 'Picture-in-Picture was blocked.';
      popoutBtn.disabled = false;
      popoutBtn.textContent = 'Start Picture-in-Picture';
    }
  });

  statusText.textContent = 'Works on pages that use a visible HTML5 video element.';
})();
