/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

// Popup script for the Chrome extension
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status')!;
  const openViewerBtn = document.getElementById('openViewer')! as HTMLButtonElement;
  const refreshStatusBtn = document.getElementById('refreshStatus')! as HTMLButtonElement;

  // Check if current tab has an idoc file
  async function checkCurrentTab(): Promise<{ isIdocFile: boolean; url: string }> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab.url || '';
      const isIdocFile = url.endsWith('.idoc.md') || url.endsWith('.idoc.json');
      return { isIdocFile, url };
    } catch (error) {
      console.error('Error checking current tab:', error);
      return { isIdocFile: false, url: '' };
    }
  }

  // Update the status display
  function updateStatus(isIdocFile: boolean, url: string): void {
    if (isIdocFile) {
      statusEl.className = 'status detected';
      statusEl.textContent = '✅ Interactive Document detected!';
      openViewerBtn.disabled = false;
    } else {
      statusEl.className = 'status not-detected';
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
        statusEl.textContent = '📋 Navigate to an .idoc file to use the viewer';
      } else {
        statusEl.textContent = '📄 No Interactive Document on this page';
      }
      openViewerBtn.disabled = true;
    }
  }

  // Open the viewer on the current tab
  async function openViewer(): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_VIEWER' });
        window.close(); // Close the popup
      }
    } catch (error) {
      console.error('Error opening viewer:', error);
      statusEl.className = 'status not-detected';
      statusEl.textContent = '❌ Error opening viewer';
    }
  }

  // Refresh the status
  async function refreshStatus(): Promise<void> {
    statusEl.textContent = 'Checking...';
    const { isIdocFile, url } = await checkCurrentTab();
    updateStatus(isIdocFile, url);
  }

  // Event listeners
  openViewerBtn.addEventListener('click', openViewer);
  refreshStatusBtn.addEventListener('click', refreshStatus);

  // Initial status check
  await refreshStatus();
});