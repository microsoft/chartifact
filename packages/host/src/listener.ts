/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Sandbox } from '@microsoft/chartifact-sandbox';
import { targetMarkdown } from '@microsoft/chartifact-compiler';
import { setupClipboardHandling } from './clipboard.js';
import { setupDragDropHandling } from './dragdrop.js';
import { setupFileUpload } from './upload.js';
import { checkUrlForFile } from './url.js';
import { setupPostMessageHandling } from './post-receive.js';
import { InteractiveDocument } from '@microsoft/chartifact-schema';
import { postStatus } from './post-send.js';
import { ListenOptions } from './types.js';
import { SpecReview, SandboxedPreHydrateMessage } from 'common';
import { Toolbar } from 'toolbar';

function getElement<T extends HTMLElement = HTMLElement>(elementOrSelector: string | T): T | null {
  if (typeof elementOrSelector === 'string') {
    return document.querySelector(elementOrSelector) as T;
  }
  return elementOrSelector;
}

function show(element: HTMLElement, shown: boolean) {
  if (!element) {
    return;
  }
  element.style.display = shown ? '' : 'none';
}

export interface InitializeOptions {
  preview: string | HTMLElement;
  loading?: string | HTMLElement;
  help?: string | HTMLElement;
  uploadButton?: string | HTMLElement;
  fileInput?: string | HTMLElement;
  toolbar?: Toolbar;
  options?: ListenOptions;
  onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];
  onSetMode?: (mode: 'markdown' | 'json', markdown: string, interactiveDocument: InteractiveDocument) => void;
  sandboxConstructor?: typeof Sandbox;
}

const defaultOptions: ListenOptions = {
  clipboard: true,
  dragDrop: true,
  fileUpload: true,
  postMessage: true,
  postMessageTarget: window.opener || window.parent || window,
  url: true,
  urlParamName: 'load',
};

export class Listener {
  public options: ListenOptions;
  public previewDiv: HTMLElement;
  public loadingDiv: HTMLElement;
  public helpDiv: HTMLElement;
  public uploadButton: HTMLElement;
  public fileInput: HTMLElement;
  public toolbar: Toolbar;
  public sandbox: Sandbox;
  public sandboxReady: boolean = false;
  public onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];
  public onSetMode: (mode: 'markdown' | 'json', markdown: string, interactiveDocument: InteractiveDocument) => void;

  private removeInteractionHandlers: (() => void)[];
  private sandboxConstructor?: typeof Sandbox;
  private currentMarkdown: string = '';
  private visibilityChangeHandler: () => void;

  constructor(options: InitializeOptions) {
    this.sandboxConstructor = options.sandboxConstructor || Sandbox;
    this.options = { ...defaultOptions, ...options?.options };
    this.onApprove = options.onApprove;
    this.onSetMode = options.onSetMode || (() => { });
    this.removeInteractionHandlers = [];

    this.previewDiv = getElement(options.preview);
    this.loadingDiv = getElement(options.loading);
    this.helpDiv = getElement(options.help);
    this.uploadButton = getElement(options.uploadButton);
    this.fileInput = getElement(options.fileInput);

    if (options.toolbar) {
      this.toolbar = options.toolbar;
    }

    if (!this.previewDiv) {
      throw new Error('App container not found');
    }

    show(this.loadingDiv, true);
    show(this.helpDiv, false);

    // Initialize sandbox
    this.createSandbox('');

    // Setup clipboard, drag-drop, upload, and postMessage handling based on options
    if (this.options.clipboard) {
      this.removeInteractionHandlers.push(setupClipboardHandling(this));
    }
    if (this.options.dragDrop) {
      this.removeInteractionHandlers.push(setupDragDropHandling(this));
    }
    if (this.options.fileUpload) {
      setupFileUpload(this);
    }
    if (this.options.postMessage) {
      setupPostMessageHandling(this);
    }

    // Check URL parameters for file to load
    if (!this.options.url || (this.options.url && !checkUrlForFile(this))) {
      show(this.loadingDiv, false);
      show(this.helpDiv, true);
    }

    // Setup page visibility handling for mobile tombstoning
    this.setupPageVisibilityHandling();
  }

  public createSandbox(markdown: string) {
    if (this.sandbox) {
      this.sandbox.destroy();
    }

    this.sandboxReady = false;

    this.sandbox = new (this.sandboxConstructor)(this.previewDiv, markdown, {
      onReady: () => {
        this.sandboxReady = true;

        // Send ready message to parent window (if embedded)
        postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'ready' });
      },
      onError: () => {
        this.errorHandler(
          'Sandbox initialization failed',
          'Sandbox could not be initialized'
        );
      },
      onApprove: this.onApprove,
    });

    if (!markdown) {
      show(this.sandbox.element, false);
    }
  }

  public errorHandler(error: Error | string, details: string) {
    show(this.loadingDiv, false);
    show(this.helpDiv, false);
    show(this.previewDiv, true);

    let message: string;
    if (typeof error === 'string') {
      message = error;
    } else if (typeof error.message === 'string') {
      message = error.message;
    } else {
      try {
        message = error.toString();
      } catch {
        message = 'Unknown error';
      }
    }

    //try to show the message in the sandbox, since it works well with paging folder content
    if (this.sandboxReady) {
      const markdown = `# Error:\n${message}\n\n${details}`;
      this.renderMarkdown(markdown);
    } else {
      // Clear previous content
      this.previewDiv.innerHTML = '';
      const h1 = document.createElement('h1');
      h1.textContent = 'Error';
      const pMessage = document.createElement('p');
      pMessage.textContent = message;
      const pDetails = document.createElement('p');
      pDetails.textContent = details;
      this.previewDiv.appendChild(h1);
      this.previewDiv.appendChild(pMessage);
      this.previewDiv.appendChild(pDetails);
    }
  }

  public render(title: string, markdown: string | null, interactiveDocument: InteractiveDocument | null, showRestart: boolean) {
    if (this.toolbar) {
      this.toolbar.filename = title;
    }
    let didError = false;
    if (interactiveDocument) {
      this.onSetMode('json', null, interactiveDocument);
      if (this.toolbar) {
        this.toolbar.mode = 'json';
      }
      this.renderInteractiveDocument(interactiveDocument);
    } else if (markdown) {
      this.onSetMode('markdown', markdown, null);
      if (this.toolbar) {
        this.toolbar.mode = 'markdown';
      }
      this.renderMarkdown(markdown);
    } else {
      this.errorHandler(
        'No content provided',
        'Please provide either markdown or an interactive document to render.'
      );
      didError = true;
    }
    if (this.toolbar && showRestart) {
      this.toolbar.showRestartButton();
    }
    if (!didError) {
      if (this.toolbar) {
        this.toolbar.showTweakButton();
        this.toolbar.showDownloadButton();
      }
    }
    //remove interactions that are disruptive (after a document is rendered)
    this.removeInteractionHandlers.forEach(removeHandler => removeHandler());
    this.removeInteractionHandlers = []; // Clear handlers after rendering
  }

  public renderInteractiveDocument(content: InteractiveDocument) {
    postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'compiling', details: 'Starting interactive document compilation' });
    const markdown = targetMarkdown(content);
    this.renderMarkdown(markdown);
  }

  private hideLoadingAndHelp() {
    show(this.loadingDiv, false);
    show(this.helpDiv, false);
  }

  public renderMarkdown(markdown: string) {
    this.hideLoadingAndHelp();
    
    // Store current markdown for potential restoration
    this.currentMarkdown = markdown;

    try {
      postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'rendering', details: 'Starting markdown rendering' });
      if (!this.sandbox || !this.sandboxReady) {
        this.createSandbox(markdown);
      } else {
        this.sandbox.send(markdown);
      }
      show(this.sandbox.element, true);
      postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'rendered', details: 'Markdown rendering completed successfully' });
    } catch (error) {
      this.errorHandler(
        error,
        'Error rendering markdown content'
      );
      postStatus(this.options.postMessageTarget, { type: 'hostStatus', hostStatus: 'error', details: `Rendering failed: ${error.message}` });
    }
  }

  /**
   * Setup page visibility event handling to detect when tab is restored from tombstoning
   */
  private setupPageVisibilityHandling() {
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        this.handlePageBecameVisible();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  /**
   * Handle when page becomes visible - check if sandbox needs to be restored
   */
  private handlePageBecameVisible() {
    // Only restore if we have content to restore and sandbox exists
    if (this.currentMarkdown && this.sandbox) {
      // Check if the sandbox iframe is still accessible
      if (!this.isSandboxFunctional()) {
        // Recreate the sandbox with the current content
        this.createSandbox(this.currentMarkdown);
        show(this.sandbox.element, true);
      }
    }
  }

  /**
   * Check if the sandbox iframe is still functional
   * Conservative approach that only detects clear evidence of tombstoning
   */
  private isSandboxFunctional(): boolean {
    if (!this.sandbox || !this.sandbox.iframe) {
      return false;
    }
    
    const iframe = this.sandbox.iframe;
    const contentWindow = iframe.contentWindow;
    
    // Only recreate if we have clear evidence of a broken iframe
    // Missing contentWindow is a clear sign of tombstoning
    if (!contentWindow) {
      return false;
    }
    
    // Missing or invalid src indicates a problem
    if (!iframe.src || iframe.src === 'about:blank') {
      return false;
    }
    
    // For normal cases (including blob URLs), assume functional to preserve user state
    // Only the clear failures above will trigger recreation
    return true;
  }

  /**
   * Cleanup method to remove event listeners
   */
  public destroy() {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    if (this.sandbox) {
      this.sandbox.destroy();
    }
  }

}
