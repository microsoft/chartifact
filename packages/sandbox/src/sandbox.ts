/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { rendererHtml } from './resources/rendererHtml.js';
import { sandboxedJs } from './resources/sandboxedJs.js';
import type { SandboxRenderMessage, SandboxedPreHydrateMessage, SandboxApprovalMessage, SpecReview } from 'common';
import type { RendererOptions } from '@microsoft/chartifact-markdown';

export interface SandboxOptions {
    onReady?: () => void;
    onError?: (error: Error) => void;
    onApprove: (message: SandboxedPreHydrateMessage) => SpecReview<{}>[];
}

export class Sandbox {
    public element: HTMLElement;
    public iframe: HTMLIFrameElement;

    constructor(elementOrSelector: string | HTMLElement, markdown: string, public options: SandboxOptions) {
        if (typeof elementOrSelector === 'string') {
            this.element = document.querySelector(elementOrSelector);
            if (!this.element) {
                throw new Error(`Element not found: ${elementOrSelector}`);
            }
        } else if (elementOrSelector instanceof HTMLElement) {
            this.element = elementOrSelector;
        } else {
            throw new Error('Invalid element type, must be a string selector or HTMLElement');
        }

        const renderRequest: SandboxRenderMessage = {
            type: 'sandboxRender',
            markdown,
        };

        const { iframe } = this.createIframe(renderRequest);
        this.iframe = iframe;
        this.element.appendChild(this.iframe);

        this.iframe.addEventListener('load', () => {
            options?.onReady?.();
        });

        this.iframe.addEventListener('error', (error) => {
            console.error('Error loading iframe:', error);
            options?.onError?.(new Error('Failed to load iframe'));
        });

        window.addEventListener('message', (event) => {
            //make sure its from the sandbox iframe          
            if (event.source === this.iframe.contentWindow) {
                const message = event.data as SandboxedPreHydrateMessage;
                if (message.type == 'sandboxedPreHydrate') {
                    const specs = this.options.onApprove(message);
                    const sandboxedApprovalMessage: SandboxApprovalMessage = {
                        type: 'sandboxApproval',
                        transactionId: message.transactionId,
                        specs,
                    };
                    this.iframe.contentWindow?.postMessage(sandboxedApprovalMessage, '*');
                }
            }
        });
    }

    createIframe(renderRequest: SandboxRenderMessage, rendererOptions: RendererOptions = {}) {
        const title = 'Chartifact Interactive Document Sandbox';
        const html = rendererHtml
            .replace('{{TITLE}}', () => title)
            .replace('{{DEPENDENCIES}}', () => this.getDependencies())
            .replace('{{RENDER_REQUEST}}', () => `<script>const renderRequest = ${JSON.stringify(renderRequest)};</script>`)
            .replace('{{RENDER_OPTIONS}}', () => `<script>const rendererOptions = ${JSON.stringify(rendererOptions)};</script>`)
            .replace('{{SANDBOX_JS}}', () => `<script>${sandboxedJs}</script>`)
            ;

        const htmlBlob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(htmlBlob);

        const iframe = document.createElement('iframe');
        iframe.sandbox = 'allow-scripts allow-popups';
        iframe.src = blobUrl;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.title = title;

        return { iframe, blobUrl };
    }

    destroy() {
        //remove all iframe listeners
        this.iframe.removeEventListener('load', () => { });
        this.iframe.removeEventListener('error', () => { });
        this.iframe?.remove();
    }

    send(markdown: string): void {
        const message: SandboxRenderMessage = {
            type: 'sandboxRender',
            markdown,
        };
        this.iframe.contentWindow?.postMessage(message, '*');
    }

    getDependencies() {
        const { hostname, origin } = window.location;
        const url = (hostname === 'localhost')
            ? origin
            : 'https://microsoft.github.io';
        return `
<link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />
<link href="${url}/chartifact/dist/v1/chartifact-reset.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
<script src="https://unpkg.com/css-tree/dist/csstree.js"></script>
<script src="https://unpkg.com/js-yaml/dist/js-yaml.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vega@5.29.0"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"></script>
<script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"></script>
<script src="${url}/chartifact/dist/v1/chartifact.markdown.umd.js"></script>
`;
    }
}
