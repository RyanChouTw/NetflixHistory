# Netflix history Chrome Extension

This Chrome extension allows users to easily access the watch history on Netflix.

## Features

- Save the watch history to the local storage
- Display the watch history in the popup
- Play the video by clicking the thumbnail

## Installation

1. Clone this repository or download the ZIP file and extract it.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

1. Click the extension icon in the Chrome toolbar to toggle the watch history visibility.
2. When the watch history is visible, you can:
   - Click the close button (×) to hide the watch history
   - Click the thumbnail to play the video

## Files

- `manifest.json`: Extension configuration file
- `background.js`: Background script for handling extension events
- `content.js`: Content script for saving the watch history
- `popup.js`: Script for the extension popup

## Permissions

This extension requires the following permissions:

- `activeTab`: To access the current tab's URL
- `scripting`: To inject and execute scripts
- `tabs`: To interact with browser tabs
- `storage`: For potential future features (currently unused)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).