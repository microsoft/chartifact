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

  // Inject the viewer interface
  function injectViewer(): void {
    const content = getFileContent();
    if (!content) {
      console.warn('Could not extract file content');
      return;
    }

    // Create overlay container
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

    // Create header with close button
    const header = document.createElement('div');
    header.style.cssText = `
      background: #f5f5f5;
      padding: 10px 20px;
      border-bottom: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Chartifact Interactive Document Viewer';
    title.style.margin = '0';

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕ Close';
    closeButton.style.cssText = `
      background: #007acc;
      color: white;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
    `;
    closeButton.onclick = () => overlay.remove();

    header.appendChild(title);
    header.appendChild(closeButton);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.id = 'chartifact-viewer-content';
    contentContainer.style.cssText = `
      flex: 1;
      padding: 20px;
      overflow: auto;
    `;

    overlay.appendChild(header);
    overlay.appendChild(contentContainer);
    document.body.appendChild(overlay);

    // Load and render the content
    renderContent(content, contentContainer);
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

  // Render the Interactive Document content using the sandbox
  async function renderContent(content: string, container: HTMLElement): Promise<void> {
    try {
      // Show loading message
      container.innerHTML = '<div style="text-align: center; padding: 40px;">Loading Interactive Document...</div>';

      // Load required scripts
      await loadScript('chartifact.compiler.js');
      await loadScript('chartifact.sandbox.js');

      // Access the global objects created by the UMD bundles
      const { targetMarkdown } = (window as any).Chartifact.compiler;
      const { Sandbox } = (window as any).Chartifact.sandbox;

      let markdown: string;
      const url = window.location.href;

      if (url.endsWith('.idoc.json')) {
        // Parse JSON and convert to markdown
        try {
          const interactiveDocument = JSON.parse(content);
          markdown = targetMarkdown(interactiveDocument);
        } catch (error) {
          throw new Error(`Failed to parse JSON: ${error}`);
        }
      } else {
        // Direct markdown content
        markdown = content;
      }

      // Clear loading message
      container.innerHTML = '';

      // Create sandbox for secure rendering
      const sandbox = new Sandbox(container, markdown, {
        onReady: () => {
          console.log('Chartifact viewer ready');
        },
        onError: (error: Error) => {
          console.error('Chartifact viewer error:', error);
          container.innerHTML = `<div style="color: red; text-align: center; padding: 40px;">Error rendering document: ${error.message}</div>`;
        },
        onApprove: (message: any) => {
          // Approve all specs for viewing (no editing capabilities)
          const { specs } = message;
          return specs;
        },
      });

    } catch (error) {
      console.error('Failed to render Interactive Document:', error);
      container.innerHTML = `<div style="color: red; text-align: center; padding: 40px;">Failed to load viewer: ${error}</div>`;
    }
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

    // Notify background script
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