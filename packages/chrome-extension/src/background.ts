/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

// Background service worker for the Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Chartifact Interactive Document Viewer installed');
});

// Handle content script messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'IDOC_FILE_DETECTED') {
    // Could show notification or update badge
    console.log('Interactive Document file detected:', request.url);
    sendResponse({ success: true });
  }
});

// Handle action button clicks
chrome.action.onClicked.addListener((tab) => {
  // Open the viewer for the current tab if it's an idoc file
  if (tab.url && (tab.url.includes('.idoc.md') || tab.url.includes('.idoc.json'))) {
    chrome.tabs.sendMessage(tab.id!, { type: 'OPEN_VIEWER' });
  }
});