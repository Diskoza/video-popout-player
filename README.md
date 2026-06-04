# Video Pop-Out Player

Chrome extension for starting stable Picture-in-Picture on YouTube, Twitch, and other sites that use visible HTML5 video.

## Features

- Adds a PiP button inside the YouTube player controls.
- Adds a small floating PiP button on other video sites.
- Works from the extension popup when a visible video is detected.
- Supports videos inside child frames when Chrome allows access.
- Keeps the stable native Chrome PiP path instead of moving the full page player.

## Install

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this project folder.
5. Open a page with a video and click the PiP button.

## Notes

- Chrome may ask for access to all websites. This is required to detect videos outside YouTube.
- Native PiP only shows the video surface and browser controls.
- HTML overlays from other extensions, such as skip notices, do not appear in stable PiP.
- Some sites may block PiP or hide video inside protected players.

## Author

Created by DiskoZawr: https://github.com/Diskoza

