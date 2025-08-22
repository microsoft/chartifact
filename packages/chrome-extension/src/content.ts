/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

// Content script that runs on pages with .idoc files
(function() {
  'use strict';

  // Check if this is an Interactive Document file
  function isIdocFile(): boolean {
    const url = window.location.href;
    return url.endsWith('.idoc.md') || url.endsWith('.idoc.json');
  }

  // Get file content from the page
  function getFileContent(): string | null {
    // For file:// URLs, the content is usually displayed in a <pre> tag or plain text
    const pre = document.querySelector('pre');
    if (pre) {
      return pre.textContent || '';
    }
    
    // Fallback to body text content
    return document.body.textContent || '';
  }

  // Load external scripts
  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(src);
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Load CSS file
  function loadCSS(href: string): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL(href);
    document.head.appendChild(link);
  }

  // Inject the viewer interface using host/toolbar architecture
  async function injectViewer(): Promise<void> {
    const content = getFileContent();
    if (!content) {
      console.warn('Could not extract file content');
      return;
    }

    try {
      // Load required scripts and CSS
      await Promise.all([
        loadScript('chartifact.sandbox.js'),
        loadScript('chartifact.host.js'),
        loadScript('chartifact.compiler.js')
      ]);
      loadCSS('chartifact-toolbar.css');

      // Create overlay container with proper structure
      const overlay = document.createElement('div');
      overlay.id = 'chartifact-viewer-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 10000;
        display: flex;
        flex-direction: column;
      `;

      // Create toolbar container
      const toolbarContainer = document.createElement('div');
      toolbarContainer.className = 'chartifact-toolbar';
      toolbarContainer.style.cssText = `
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
        padding: 10px 20px;
      `;

      // Create close button in toolbar
      const closeButton = document.createElement('button');
      closeButton.textContent = '✕ Close Viewer';
      closeButton.style.cssText = `
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 16px;
        cursor: pointer;
        border-radius: 4px;
        float: right;
        margin-left: 10px;
      `;
      closeButton.onclick = () => overlay.remove();

      // Create source textarea (hidden by default)
      const textarea = document.createElement('textarea');
      textarea.id = 'source';
      textarea.style.cssText = `
        width: 100%;
        height: 200px;
        font-family: monospace;
        display: none;
        resize: vertical;
        border: 1px solid #ddd;
        padding: 10px;
      `;
      textarea.value = content;

      // Create main content containers
      const mainContainer = document.createElement('div');
      mainContainer.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `;

      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'loading';
      loadingDiv.style.cssText = `
        text-align: center;
        padding: 40px;
        font-size: 18px;
      `;
      loadingDiv.textContent = 'Loading Interactive Document...';

      const helpDiv = document.createElement('div');
      helpDiv.id = 'help';
      helpDiv.style.cssText = `
        text-align: center;
        padding: 40px;
        display: none;
      `;
      helpDiv.textContent = 'Help information would go here';

      const previewDiv = document.createElement('div');
      previewDiv.id = 'preview';
      previewDiv.style.cssText = `
        flex: 1;
        overflow: auto;
        padding: 20px;
      `;

      // Assemble the UI
      toolbarContainer.appendChild(closeButton);
      mainContainer.appendChild(textarea);
      mainContainer.appendChild(loadingDiv);
      mainContainer.appendChild(helpDiv);
      mainContainer.appendChild(previewDiv);
      overlay.appendChild(toolbarContainer);
      overlay.appendChild(mainContainer);
      document.body.appendChild(overlay);

      // Wait a moment for scripts to be available
      await new Promise(resolve => setTimeout(resolve, 100));

      // Access the global objects created by the UMD bundles
      const Chartifact = (window as any).Chartifact;
      if (!Chartifact || !Chartifact.host || !Chartifact.toolbar) {
        throw new Error('Chartifact libraries not loaded properly');
      }

      // Initialize toolbar
      const toolbar = new Chartifact.toolbar.Toolbar(toolbarContainer, {
        textarea: textarea,
        tweakButton: true,
        downloadButton: true,
        restartButton: false,
        mode: window.location.href.endsWith('.idoc.json') ? 'json' : 'markdown',
        filename: extractFilename(window.location.href)
      });

      // Initialize host listener
      const host = new Chartifact.host.Listener({
        preview: previewDiv,
        loading: loadingDiv,
        help: helpDiv,
        toolbar: toolbar,
        options: {
          clipboard: false,
          dragDrop: false,
          fileUpload: false,
          postMessage: false,
          url: false
        },
        onApprove: (message: any) => {
          // Approve all specs for viewing (no editing capabilities)
          const { specs } = message;
          return specs;
        }
      });

      // Render the content
      const url = window.location.href;
      const filename = extractFilename(url);
      
      if (url.endsWith('.idoc.json')) {
        // Parse JSON and render as interactive document
        try {
          const interactiveDocument = JSON.parse(content);
          host.render(filename, null, interactiveDocument, false);
        } catch (error) {
          host.errorHandler(error, 'Failed to parse JSON content');
        }
      } else {
        // Render markdown directly
        host.render(filename, content, null, false);
      }

    } catch (error) {
      console.error('Failed to inject viewer:', error);
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid red;
        padding: 20px;
        border-radius: 8px;
        z-index: 10001;
        max-width: 400px;
      `;
      errorDiv.innerHTML = `
        <h3>Error Loading Viewer</h3>
        <p>${error.message}</p>
        <button onclick="this.parentElement.remove()">Close</button>
      `;
      document.body.appendChild(errorDiv);
    }
  }

  // Extract filename from URL
  function extractFilename(url: string): string {
    const path = url.split('/').pop() || 'document';
    return path.replace(/\?.*$/, ''); // Remove query parameters
  }

  // Add button to view the file
  function addViewButton(): void {
    const button = document.createElement('button');
    button.textContent = '📊 View as Interactive Document';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007acc;
      color: white;
      border: none;
      padding: 12px 20px;
      cursor: pointer;
      border-radius: 6px;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9999;
    `;
    button.onclick = injectViewer;
    document.body.appendChild(button);
  }

  // Initialize the content script
  function init(): void {
    if (!isIdocFile()) {
      return;
    }

    // Notify background script (using common message structure)
    chrome.runtime.sendMessage({
      type: 'IDOC_FILE_DETECTED',
      url: window.location.href
    });

    // Add view button
    addViewButton();

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'OPEN_VIEWER') {
        injectViewer();
        sendResponse({ success: true });
      }
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();