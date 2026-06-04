/* Author: DiskoZawr - https://github.com/Diskoza */

// Legacy embedded popout.

const params    = new URLSearchParams(location.search);
const videoId   = params.get('v');
const startTime = parseInt(params.get('t') || '0', 10);

const frame   = document.getElementById('player-frame');
const loading = document.getElementById('loading');
const pipBtn  = document.getElementById('pipBtn');
const openBtn = document.getElementById('openBtn');

if (videoId) {
  // Build the YouTube embed URL.
  const embedUrl = new URL('https://www.youtube.com/embed/' + videoId);
  embedUrl.searchParams.set('autoplay', '1');
  embedUrl.searchParams.set('rel', '0');
  embedUrl.searchParams.set('modestbranding', '1');
  if (startTime > 0) {
    embedUrl.searchParams.set('start', String(startTime));
  }

  frame.src = embedUrl.toString();

  // Hide loading after the iframe loads.
  frame.addEventListener('load', function () {
    loading.style.display = 'none';
  });

  document.title = 'Video Pop-Out Player';

  // Open on YouTube.
  openBtn.addEventListener('click', function () {
    window.open('https://www.youtube.com/watch?v=' + videoId + '&t=' + startTime, '_blank');
  });

  // PiP hint.
  pipBtn.addEventListener('click', function () {
    alert('Right-click the video twice, then choose Picture in Picture.');
  });

} else {
  loading.innerHTML = '<p style="color:#f44">Video not found</p>';
}
