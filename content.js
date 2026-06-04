/* Author: DiskoZawr - https://github.com/Diskoza */

const YOUTUBE_BUTTON_ID = 'yt-popout-player-btn';
const GENERIC_BUTTON_ID = 'video-popout-floating-btn';
const MIN_VIDEO_WIDTH = 160;
const MIN_VIDEO_HEIGHT = 90;

const ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19 11h-8v6h8v-6zm4 8V5c0-1.1-.9-2-2-2H3C1.9 3 1 3.9 1 5v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zM3 19V5h18v14H3z"/>
  </svg>
`;

function isHttpPage() {
  return location.protocol === 'http:' || location.protocol === 'https:';
}

function isYouTubeWatchPage() {
  return /(^|\.)youtube\.com$/.test(location.hostname) && !!getYouTubeVideoId();
}

function getYouTubeVideoId() {
  try {
    return new URL(location.href).searchParams.get('v') || null;
  } catch {
    return null;
  }
}

function getVideoScore(video) {
  const rect = video.getBoundingClientRect();
  const area = Math.max(rect.width, 0) * Math.max(rect.height, 0);
  const readyBonus = video.readyState * 10000;
  const playbackBonus = video.paused ? 0 : 1000000;
  const youtubeBonus = video.classList.contains('html5-main-video') ? 2000000 : 0;

  return area + readyBonus + playbackBonus + youtubeBonus;
}

function isVisibleVideo(video) {
  const rect = video.getBoundingClientRect();
  if (rect.width < MIN_VIDEO_WIDTH || rect.height < MIN_VIDEO_HEIGHT) return false;

  const style = getComputedStyle(video);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return false;
  }

  return true;
}

function getBestVideo() {
  return Array.from(document.querySelectorAll('video'))
    .filter(isVisibleVideo)
    .sort((a, b) => getVideoScore(b) - getVideoScore(a))[0] || null;
}

function getCurrentTime() {
  const video = getBestVideo();
  return video ? Math.floor(video.currentTime || 0) : 0;
}

async function enterPictureInPicture() {
  if (!document.pictureInPictureEnabled) {
    throw new Error('Picture-in-Picture is disabled in this browser.');
  }

  const video = getBestVideo();
  if (!video) {
    throw new Error('No visible video was found on this page.');
  }

  if (document.pictureInPictureElement === video) {
    await document.exitPictureInPicture();
    return { active: false };
  }

  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  }

  if (video.disablePictureInPicture) {
    video.disablePictureInPicture = false;
  }

  await video.requestPictureInPicture();
  return { active: true };
}

function openFallbackWindow() {
  chrome.runtime.sendMessage({
    action: 'openPopout',
    url: location.href,
    videoId: getYouTubeVideoId(),
    startTime: getCurrentTime()
  });
}

function pulseButton(btn, ok) {
  btn.style.color = ok ? '#3ea6ff' : '#ff7777';
  window.setTimeout(() => {
    btn.style.color = '#fff';
  }, 700);
}

async function handleButtonClick(btn) {
  btn.disabled = true;

  try {
    await enterPictureInPicture();
    pulseButton(btn, true);
  } catch (err) {
    console.warn('[Video Pop-Out Player] PiP failed, opening fallback window:', err);
    pulseButton(btn, false);
    openFallbackWindow();
  } finally {
    btn.disabled = false;
  }
}

function makeButtonBase(btn) {
  btn.type = 'button';
  btn.title = 'Start Picture-in-Picture';
  btn.setAttribute('aria-label', 'Start Picture-in-Picture');
  btn.innerHTML = ICON_SVG;

  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void handleButtonClick(btn);
  });
}

function injectYouTubeButton() {
  const old = document.getElementById(YOUTUBE_BUTTON_ID);
  if (old) old.remove();

  if (!isYouTubeWatchPage()) return;

  const controls = document.querySelector('.ytp-right-controls');
  if (!controls) return;

  const btn = document.createElement('button');
  btn.id = YOUTUBE_BUTTON_ID;
  btn.className = 'ytp-button';
  btn.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'width:36px',
    'height:100%',
    'cursor:pointer',
    'background:none',
    'border:none',
    'padding:0',
    'color:#fff',
    'opacity:0.88',
    'transition:opacity 0.15s,color 0.15s',
    'vertical-align:top'
  ].join(';');

  makeButtonBase(btn);

  btn.addEventListener('mouseenter', () => {
    btn.style.opacity = '1';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.opacity = '0.88';
  });

  controls.insertBefore(btn, controls.firstChild);
}

function getGenericButtonParent() {
  return document.fullscreenElement || document.documentElement;
}

function positionGenericButton(btn) {
  const parent = getGenericButtonParent();
  if (btn.parentElement !== parent) {
    parent.append(btn);
  }

  const video = getBestVideo();
  btn.style.display = video && !isYouTubeWatchPage() ? 'inline-flex' : 'none';
}

function injectGenericButton() {
  if (!isHttpPage() || isYouTubeWatchPage()) {
    document.getElementById(GENERIC_BUTTON_ID)?.remove();
    return;
  }

  let btn = document.getElementById(GENERIC_BUTTON_ID);
  if (!btn) {
    btn = document.createElement('button');
    btn.id = GENERIC_BUTTON_ID;
    btn.style.cssText = [
      'position:fixed',
      'right:18px',
      'bottom:18px',
      'z-index:2147483647',
      'width:44px',
      'height:44px',
      'align-items:center',
      'justify-content:center',
      'cursor:pointer',
      'background:rgba(15,15,15,0.86)',
      'border:1px solid rgba(255,255,255,0.35)',
      'border-radius:8px',
      'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
      'color:#fff',
      'opacity:0.72',
      'padding:0',
      'transition:opacity 0.15s,transform 0.15s,background 0.15s',
      'font:inherit'
    ].join(';');

    makeButtonBase(btn);

    btn.addEventListener('mouseenter', () => {
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1.04)';
      btn.style.background = 'rgba(15,15,15,0.95)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.opacity = '0.72';
      btn.style.transform = 'scale(1)';
      btn.style.background = 'rgba(15,15,15,0.86)';
    });
  }

  positionGenericButton(btn);
}

function injectControls() {
  injectYouTubeButton();
  injectGenericButton();
}

let injectTimer = 0;
function scheduleInject(delay = 500) {
  window.clearTimeout(injectTimer);
  injectTimer = window.setTimeout(injectControls, delay);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action !== 'enterPiP') return false;

  enterPictureInPicture()
    .then((result) => sendResponse({ success: true, result }))
    .catch((err) => sendResponse({ success: false, error: err.message }));

  return true;
});

window.addEventListener('yt-navigate-finish', () => scheduleInject(600));
window.addEventListener('load', () => scheduleInject(300));
window.addEventListener('resize', () => scheduleInject(100));
document.addEventListener('fullscreenchange', () => scheduleInject(100));

const observer = new MutationObserver(() => {
  scheduleInject(800);
});

observer.observe(document.documentElement, { childList: true, subtree: true });

scheduleInject(1000);
