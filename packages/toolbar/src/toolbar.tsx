/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import * as hw from 'html-wrapper';
import { createElement, mount } from 'tsx-create-element';

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

interface ToolbarProps {
    mode: 'markdown' | 'json';
    restartClick: () => void;
    tweakClick: () => void;
    downloadClick: () => void;
    restartDisplay: 'none' | '';
    tweakDisplay: 'none' | '';
    downloadDisplay: 'none' | '';
    downloadSource: () => void;
    downloadHtml: () => void;
    children?: JSX.Element;
}

const ToolbarElement = (props: ToolbarProps) => {

    const { mode, restartClick, tweakClick, downloadClick, restartDisplay, tweakDisplay, downloadDisplay, downloadSource, downloadHtml, children } = props;

    const { home, target } = (window.location.hostname === 'localhost')
        ? { home: '/', target: '_self' }
        : { home: 'https://microsoft.github.io/', target: '_blank' };

    const displayMode = mode === 'json' ? 'json' : 'markdown';

    return (
        <div className='toolbar-group' style={{ backgroundColor: 'inherit' }}>
            <div className='toolbar-item'>
                <a href={`${home}chartifact/`} target={target}>Chartifact</a> viewer
            </div>
            <div className='toolbar-item' style={{ display: children ? '' : 'none' }}>
                {children}
            </div>
            <div className='toolbar-item'>
                <span className='toolbar-mode'>{displayMode} mode </span>
                <button type="button" style={{ display: restartDisplay }} onClick={restartClick}>start over</button>
                <button type="button" style={{ display: tweakDisplay }} onClick={tweakClick}>view source</button>
                <button type="button" style={{ display: downloadDisplay }} onClick={downloadClick} id="download">download</button>
            </div>
            <div id="downloadPopup" style={{
                position: 'absolute',
                display: 'none',
                padding: '12px 16px',
                zIndex: 1,
                backgroundColor: 'inherit',
            }}>
                <div style={{ marginBottom: '8px' }}>Download as:</div>
                <ul>
                    <li>
                        Source (just the {displayMode} content)<br />
                        <button type="button" id="download-md" style={{ marginRight: '8px' }} onClick={downloadSource}>Source</button>
                    </li>
                    <li>
                        HTML wrapper (content plus a shareable viewer)<br />
                        <button type="button" id="download-html" onClick={downloadHtml}>HTML wrapper</button>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export class Toolbar {
    public toolbarElement: HTMLElement;
    public downloadButton: HTMLButtonElement;
    public downloadPopup: HTMLDivElement;
    public mode: 'markdown' | 'json';
    public filename: string;
    public props: ToolbarProps;

    constructor(toolbarElementOrSelector: HTMLElement | string, public options: ToolbarOptions = {}) {
        this.filename = options.filename || 'sample';
        // Runtime check to restrict mode to allowed values only
        const allowedModes = ['markdown', 'json'];
        this.mode = allowedModes.includes(options.mode as string) ? options.mode as 'markdown' | 'json' : 'markdown';

        this.toolbarElement = typeof toolbarElementOrSelector === 'string' ? document.querySelector(toolbarElementOrSelector) : toolbarElementOrSelector;

        if (!this.toolbarElement) {
            throw new Error('Toolbar element not found');
        }

        this.props = {
            mode: null,
            restartClick: () => window.location.reload(),
            tweakClick: () => {
                this.options.textarea.style.display = this.options.textarea.style.display === 'none' ? '' : 'none';
            },
            downloadClick: () => {
                const { downloadPopup, downloadButton } = this;

                // Position popup near the button
                const rect = downloadButton.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const buttonCenter = rect.left + rect.width / 2;
                const isLeftOfCenter = buttonCenter < viewportWidth / 2;

                if (isLeftOfCenter) {
                    // Align popup to the left of the button
                    downloadPopup.style.left = `${rect.left + window.scrollX}px`;
                    downloadPopup.style.right = ''; // Clear right alignment
                } else {
                    // Align popup to the right of the button
                    const popupWidth = downloadPopup.offsetWidth;
                    downloadPopup.style.right = `${viewportWidth - rect.right - window.scrollX}px`;
                    downloadPopup.style.left = ''; // Clear left alignment
                }

                downloadPopup.style.top = `${rect.bottom + window.scrollY + 4}px`;
                downloadPopup.style.display = 'block';

                // Hide popup on outside click
                const hidePopup = (evt: MouseEvent) => {
                    if (!downloadPopup.contains(evt.target as Node) && evt.target !== downloadButton) {
                        downloadPopup.style.display = 'none';
                        document.removeEventListener('mousedown', hidePopup);
                    }
                };
                setTimeout(() => document.addEventListener('mousedown', hidePopup), 0);
            },
            restartDisplay: this.options.restartButton ? '' : 'none',
            tweakDisplay: this.options.tweakButton ? '' : 'none',
            downloadDisplay: this.options.downloadButton ? '' : 'none',
            downloadSource: () => {
                this.downloadPopup.style.display = 'none';
                const textarea = this.options.textarea;
                if (!textarea) return;
                const content = textarea.value;
                const extension = this.mode === 'json' ? '.idoc.json' : '.idoc.md';
                const mimeType = this.mode === 'json' ? 'application/json' : 'text/markdown';
                const filename = `${filenameWithoutPathOrExtension(this.filename)}${extension}`;
                this.triggerDownload(content, filename, mimeType);

            },
            downloadHtml: () => {
                this.downloadPopup.style.display = 'none';
                const textarea = this.options.textarea;
                if (!textarea) return;
                const html = this.htmlWrapper();
                const filename = `${filenameWithoutPathOrExtension(this.filename)}.idoc.html`;
                this.triggerDownload(html, filename, 'text/html');
            },
        };

        this.render();
    }

    public htmlWrapper() {
        if (this.mode === 'markdown') {
            return hw.default.htmlMarkdownWrapper(this.filename, this.options.textarea.value);
        } else if (this.mode === 'json') {
            return hw.default.htmlJsonWrapper(this.filename, this.options.textarea.value);
        }
    }

    addChildren(children: JSX.Element) {
        this.props.children = children;
        this.render();
    }

    render() {
        mount(ToolbarElement({ ...this.props, mode: this.mode }), this.toolbarElement);
        this.downloadButton = this.toolbarElement.querySelector('#download') as HTMLButtonElement;
        this.downloadPopup = this.toolbarElement.querySelector('#downloadPopup') as HTMLDivElement;
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
        this.props.tweakDisplay = '';
        this.render();
    }

    showRestartButton() {
        this.props.restartDisplay = '';
        this.render();
    }

    showDownloadButton() {
        this.props.downloadDisplay = '';
        this.render();
    }

    hideTweakButton() {
        this.props.tweakDisplay = 'none';
        this.render();
    }

    hideRestartButton() {
        this.props.restartDisplay = 'none';
        this.render();
    }

    hideDownloadButton() {
        this.props.downloadDisplay = 'none';
        this.render();
    }

    setSourceVisibility(visible: boolean) {
        const { textarea } = this.options;
        if (!textarea) {
            return;
        }
        textarea.style.display = visible ? '' : 'none';
    }

    setFilename(filename: string) {
        this.filename = filename;
        this.render();
    }

    setMode(mode: 'markdown' | 'json') {
        // Runtime check to restrict mode to allowed values only
        const allowedModes = ['markdown', 'json'];
        if (allowedModes.includes(mode)) {
            this.mode = mode;
            this.render();
        }
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

