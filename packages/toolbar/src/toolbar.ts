/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import * as hw from 'html-wrapper';

export interface ToolbarOptions {
    tweakButton?: boolean;
    downloadButton?: boolean;
    restartButton?: boolean;
    textarea?: HTMLTextAreaElement;
    /**
     * Mode to display content, allowed values: 'markdown' | 'json'.
     * Only trusted values should be supplied.
     * If an untrusted value is provided, it will be ignored and replaced with 'markdown'.
     */
    mode?: 'markdown' | 'json';
    filename?: string;
}

export class Toolbar {
    public toolbarElement: HTMLElement;
    public folderSpan: HTMLElement;
    public tweakButton: HTMLButtonElement;
    public restartButton: HTMLButtonElement;
    public downloadButton: HTMLButtonElement;
    public mode: 'markdown' | 'json';
    public filename: string;
    private downloadPopup: HTMLDivElement;

    constructor(toolbarElementOrSelector: HTMLElement | string, public options: ToolbarOptions = {}) {
        this.filename = options.filename || 'sample';
        // Runtime check to restrict mode to allowed values only
        const allowedModes = ['markdown', 'json'];
        this.mode = allowedModes.includes(options.mode as string) ? options.mode as 'markdown' | 'json' : 'markdown';
        
        // Create a safe displayMode variable to avoid CodeQL alerts
        const displayMode = this.mode === 'json' ? 'json' : 'markdown';
        
        this.toolbarElement = typeof toolbarElementOrSelector === 'string' ? document.querySelector(toolbarElementOrSelector) : toolbarElementOrSelector;

        if (!this.toolbarElement) {
            throw new Error('Toolbar element not found');
        }

        const { home, target } = (window.location.hostname === 'localhost')
            ? { home: '/', target: '_self' }
            : { home: 'https://microsoft.github.io/', target: '_blank' };

        const html = `
<div>
    <a href="${home}chartifact/" target="${target}">Chartifact</a> viewer
</div>
<div id="folderSpan" style="display: none;"></div>
<div>
    <button type="button" id="restart" style="display: none;">start over</button>
    <button type="button" id="tweak" style="display: none;">view source</button>
    <button type="button" id="download" style="display: none;">download</button>
</div>
<div id="downloadPopup" style="position: absolute; display: none; padding: 12px 16px; z-index: 1; background-color: inherit;">
    <div style="margin-bottom: 8px;">Download as:</div>
    <ul>
        <li>
            Source (just the ${displayMode} content)<br/>
            <button type="button" id="download-md" style="margin-right: 8px;">Source</button>
        </li>
        <li>
            HTML wrapper (content plus a shareable viewer)<br/>
            <button type="button" id="download-html">HTML wrapper</button>
        </li>
    </ul>
</div>
        `;

        this.toolbarElement.innerHTML = html;

        this.folderSpan = this.toolbarElement.querySelector('#folderSpan') as HTMLElement;
        this.tweakButton = this.toolbarElement.querySelector('#tweak') as HTMLButtonElement;
        this.restartButton = this.toolbarElement.querySelector('#restart') as HTMLButtonElement;
        this.downloadButton = this.toolbarElement.querySelector('#download') as HTMLButtonElement;
        this.downloadPopup = this.toolbarElement.querySelector('#downloadPopup') as HTMLDivElement;

        if (this.options.tweakButton) {
            this.showTweakButton();
        }

        if (this.options.restartButton) {
            this.showRestartButton();
        }

        if (this.options.downloadButton) {
            this.showDownloadButton();
        }

        this.tweakButton?.addEventListener('click', () => {
            this.options.textarea.style.display = this.options.textarea.style.display === 'none' ? '' : 'none';
        });

        this.restartButton?.addEventListener('click', () => {
            window.location.reload();
        });

        this.downloadButton?.addEventListener('click', (e) => {
            // Position popup near the button
            const rect = this.downloadButton.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const buttonCenter = rect.left + rect.width / 2;
            const isLeftOfCenter = buttonCenter < viewportWidth / 2;

            if (isLeftOfCenter) {
                // Align popup to the left of the button
                this.downloadPopup.style.left = `${rect.left + window.scrollX}px`;
                this.downloadPopup.style.right = ''; // Clear right alignment
            } else {
                // Align popup to the right of the button
                const popupWidth = this.downloadPopup.offsetWidth;
                this.downloadPopup.style.right = `${viewportWidth - rect.right - window.scrollX}px`;
                this.downloadPopup.style.left = ''; // Clear left alignment
            }

            this.downloadPopup.style.top = `${rect.bottom + window.scrollY + 4}px`;
            this.downloadPopup.style.display = 'block';

            // Hide popup on outside click
            const hidePopup = (evt: MouseEvent) => {
                if (!this.downloadPopup.contains(evt.target as Node) && evt.target !== this.downloadButton) {
                    this.downloadPopup.style.display = 'none';
                    document.removeEventListener('mousedown', hidePopup);
                }
            };
            setTimeout(() => document.addEventListener('mousedown', hidePopup), 0);
        });

        // Download as markdown
        this.downloadPopup.querySelector('#download-md')?.addEventListener('click', () => {
            this.downloadPopup.style.display = 'none';
            const textarea = this.options.textarea;
            if (!textarea) return;
            const content = textarea.value;
            const extension = this.mode === 'json' ? '.idoc.json' : '.idoc.md';
            const mimeType = this.mode === 'json' ? 'application/json' : 'text/markdown';
            const filename = `${filenameWithoutPathOrExtension(this.filename)}${extension}`;
            this.triggerDownload(content, filename, mimeType);
        });

        // Download as HTML wrapper
        this.downloadPopup.querySelector('#download-html')?.addEventListener('click', () => {
            this.downloadPopup.style.display = 'none';
            const textarea = this.options.textarea;
            if (!textarea) return;
            const filename = `${filenameWithoutPathOrExtension(this.filename)}.idoc.html`;
            const html = this.htmlWrapper();
            this.triggerDownload(html, filename, 'text/html');
        });
    }

    public htmlWrapper() {
        if (this.mode === 'markdown') {
            return hw.default.htmlMarkdownWrapper(this.filename, this.options.textarea.value);
        } else if (this.mode === 'json') {
            return hw.default.htmlJsonWrapper(this.filename, this.options.textarea.value);
        }
    }

    // Helper method to trigger a download
    private triggerDownload(content: string, filename: string, mimeType: string) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }

    showTweakButton() {
        this.tweakButton.style.display = '';
    }

    showRestartButton() {
        this.restartButton.style.display = '';
    }

    showDownloadButton() {
        this.downloadButton.style.display = '';
    }

    manageTextareaVisibilityForAgents() {
        const { textarea } = this.options;

        if (!textarea) {
            throw new Error('Textarea element not found');
        }

        // Bot-friendly content hiding strategy:
        // 1. Bots that don't execute JS will see the textarea content in full
        // 2. Bots that execute JS but have short timeouts will see content for 300ms
        // 3. Human users see no visual flash due to flex:0 + removed padding/border
        textarea.style.flex = '0';        // Collapse to zero width, no visual space
        textarea.style.padding = '0';     // Remove default padding that creates pixel shift
        textarea.style.border = '0';      // Remove default border that creates pixel shift
        setTimeout(() => {
            // After 300ms (longer than most bot JS timeouts), restore defaults and hide
            textarea.style.flex = '';     // Restore original flex value from CSS
            textarea.style.padding = '';  // Restore original padding from CSS
            textarea.style.border = '';   // Restore original border from CSS
            textarea.style.display = 'none'; // Fully hide from users (but they can unhide to edit)
        }, 300);

    }
}

function filenameWithoutPathOrExtension(filename: string) {
    // Remove everything before the last slash or backslash
    const base = filename.split(/[\\/]/).pop() || filename;
    // If .idoc appears, remove it and everything after
    const idocIdx = base.indexOf('.idoc');
    if (idocIdx !== -1) {
        return base.substring(0, idocIdx);
    }
    // Otherwise, remove the last extension if present
    const lastDot = base.lastIndexOf('.');
    if (lastDot > 0) {
        return base.substring(0, lastDot);
    }
    return base;
}

// --- TESTS for filenameWithoutPathOrExtension ---

// const filenameTests: [string, string][] = [
//     // [input, expected]
//     ["foo.md", "foo"],
//     ["foo.idoc.md", "foo"],
//     ["foo.idoc.json", "foo"],
//     ["foo", "foo"],
//     ["foo.bar.baz.md", "foo.bar.baz"],
//     ["C:\\folder\\foo.md", "foo"],
//     ["/home/user/foo.md", "foo"],
//     ["folder/foo.idoc.md", "foo"],
//     ["folder\\foo.idoc.json", "foo"],
//     ["folder.with.dots/foo.bar.baz.md", "foo.bar.baz"],
//     ["folder.with.dots\\foo.bar.baz.md", "foo.bar.baz"],
//     ["", ""],
// ];

// filenameTests.forEach(([input, expected], i) => {
//     const result = filenameWithoutPathOrExtension(input);
//     const pass = result === expected;
//     // eslint-disable-next-line no-console
//     console.log(
//         `${pass ? '✅' : '❌'} Test ${i + 1}: ${pass ? 'PASS' : `FAIL\n  Input: ${input}\n  Got: ${result}\n  Expected: ${expected}`}`
//     );
// });

