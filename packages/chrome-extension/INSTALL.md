# Installing the Chartifact Chrome Extension

This guide helps you install and test the Chartifact Chrome extension for viewing Interactive Document files.

## Quick Start

### 1. Build the Extension

From the repository root:

```bash
# Install dependencies (if not already done)
npm install

# Build the extension
npm run build --workspace=@microsoft/chartifact-chrome-extension
```

### 2. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the folder: `packages/chrome-extension/dist`
5. The extension should now appear in your extensions list

### 3. Test the Extension

**Option A: Use the test page**
1. Open `packages/chrome-extension/test.html` in Chrome
2. Click on one of the test file links
3. Look for the "📊 View as Interactive Document" button

**Option B: Test with local files**
1. Download any `.idoc.json` or `.idoc.md` file
2. Open it in Chrome (drag and drop into browser)
3. The extension should detect it and show the view button

### 4. Using the Extension

- **Automatic Detection**: The extension automatically detects `.idoc.md` and `.idoc.json` files
- **View Button**: Look for the floating "📊 View as Interactive Document" button in the top-right
- **Extension Popup**: Click the extension icon to see status and controls
- **Secure Rendering**: All content is rendered in a sandboxed iframe for security

## Example Files to Test

You can test with these example files in the repository:
- `packages/examples/json/seattle-weather/6.idoc.json`
- `packages/chrome-extension/test.idoc.json` (simple test file)

## Troubleshooting

### Extension not detecting files
- Ensure the file has `.idoc.md` or `.idoc.json` extension
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the page

### View button not appearing
- Make sure you're viewing an actual idoc file (not just a page that links to one)
- Check browser console for any JavaScript errors
- Verify the extension has proper permissions

### Viewer not loading
- Check browser console for errors
- Ensure the chartifact libraries are properly loaded
- Verify the file content is valid Interactive Document format

### Permission issues
- The extension needs `activeTab` permission to function
- For local files, you may need to enable "Allow access to file URLs" in the extension details

## For Developers

### Building from Source
```bash
cd packages/chrome-extension
npm run build        # Build the extension
npm run package      # Create distributable ZIP
npm run dev          # Watch mode for development
```

### Extension Structure
- `src/manifest.json` - Extension manifest
- `src/background.ts` - Service worker
- `src/content.ts` - Content script for detection and injection
- `src/popup.ts/html` - Extension popup interface
- `dist/` - Built extension (load this folder in Chrome)

### Distribution
- Run `npm run package` to create `chartifact-chrome-extension.zip`
- This ZIP can be uploaded to Chrome Web Store or distributed manually

## Security

The extension follows security best practices:
- Minimal permissions (only `activeTab` and `storage`)
- Sandboxed iframe rendering
- No remote code execution
- Content Security Policy compliant

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify file format with the Interactive Document schema
3. Test with the provided example files first
4. Create an issue in the Chartifact repository