# Chartifact Chrome Extension

A Chrome extension for viewing Interactive Document files (*.idoc.md and *.idoc.json) with rich visualizations and charts.

## Features

- **File Detection**: Automatically detects `.idoc.md` and `.idoc.json` files in web pages
- **Secure Rendering**: Uses sandboxed iframe rendering for security
- **Rich Visualizations**: Supports charts, graphs, and interactive elements
- **Easy Access**: Simple button to open the viewer overlay

## Installation

### For Development

1. Build the extension:
   ```bash
   cd packages/chrome-extension
   npm run build
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `packages/chrome-extension/dist` folder

### For Distribution

1. Package the extension:
   ```bash
   cd packages/chrome-extension
   npm run package
   ```

2. This creates `chartifact-chrome-extension.zip` that can be uploaded to the Chrome Web Store.

## Usage

1. Navigate to any `.idoc.md` or `.idoc.json` file in your browser
2. The extension will automatically detect the file and show a "View as Interactive Document" button
3. Click the button to open the Chartifact viewer overlay
4. You can also use the extension popup (click the extension icon) to open the viewer

## Supported File Types

- **`.idoc.md`**: Interactive Document markdown files
- **`.idoc.json`**: Interactive Document JSON files

## Technical Details

The extension uses:
- **Manifest V3** for modern Chrome extension standards
- **Content Scripts** to detect and inject the viewer
- **Sandbox Rendering** for security using iframes
- **UMD Bundles** for the Chartifact compiler and sandbox libraries

## Security

The extension follows security best practices:
- Uses sandboxed iframe rendering to isolate document content
- Minimal permissions (only `activeTab` and `storage`)
- Content Security Policy compliance
- No remote code execution

## Development

### Build Process

1. TypeScript compilation (`npm run tsc`)
2. Vite bundling (`npm run bundle`)
3. Resource copying (`npm run resources`)

### File Structure

```
src/
├── manifest.json       # Extension manifest
├── background.ts       # Service worker
├── content.ts          # Content script
├── popup.ts           # Popup script
└── popup.html         # Popup HTML

dist/                  # Built extension
├── manifest.json
├── background.js
├── content.js
├── popup.js
├── popup.html
├── chartifact.sandbox.js
├── chartifact.compiler.js
└── icons/
```

## License

MIT License - see LICENSE file for details.