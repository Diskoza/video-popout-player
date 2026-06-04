# Release Notes

## Video Pop-Out Player v1.6.1

Stable signed build of Video Pop-Out Player, a Chrome extension for starting native Picture-in-Picture on YouTube, Twitch, and other websites with visible HTML5 video.

### What's New

- Renamed the extension to **Video Pop-Out Player**.
- Added a PiP button directly inside the YouTube player controls.
- Added a floating PiP button for non-YouTube video pages.
- Added popup-based video detection for pages with visible HTML5 video.
- Improved support for videos inside child frames when Chrome allows access.
- Switched the normal flow to stable native Chrome Picture-in-Picture.
- Removed Document Picture-in-Picture from the main flow to avoid black-video issues.
- Added author attribution to source files, manifest metadata, and PNG metadata.

### Installation

1. Download `video-popout-player-v1.6.1.zip` from the assets below.
2. Extract the ZIP archive.
3. Open `chrome://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted extension folder.
7. Open a page with a video and press the PiP button.

### Permissions

- `http://*/*` and `https://*/*`: required to detect HTML5 videos outside YouTube.
- `activeTab`: allows the extension popup to work with the current tab.
- `scripting`: used by the popup to detect videos and start PiP on the current page.
- `tabs`: used to read the current tab URL and title.
- `windows`: used only as a fallback to open the current page in a popup window when PiP is blocked.

### Notes

- Chrome may ask for access to all websites. This is required so the extension can detect HTML5 videos outside YouTube.
- Native Picture-in-Picture only shows the video surface and browser controls.
- HTML overlays from websites or other extensions may not appear inside native PiP.
- Some websites may block PiP or hide video inside protected players.

### Known Limitations

- DRM/protected players may not work.
- Some embedded videos may be inaccessible because of browser security restrictions.
- If PiP is blocked, the extension may fall back to opening the current page in a popup window.

## v1.5

Stable YouTube PiP build.

- Restored stable native video Picture-in-Picture.
- Kept the previous working YouTube button behavior.
- Avoided full DOM player movement because it caused black video on some systems.
