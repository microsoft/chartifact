/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

/**
 * Initialize a markdown viewer with toolbar
 * @param textareaSelector - CSS selector for the textarea element
 * @param previewSelector - CSS selector for the preview container
 * @param toolbarSelector - CSS selector for the toolbar container
 */
export function initMarkdownViewer(
    textareaSelector: string = '#source',
    previewSelector: string = '#preview',
    toolbarSelector: string = '.chartifact-toolbar'
) {
    const textarea = document.querySelector(textareaSelector) as HTMLTextAreaElement;
    if (!textarea) {
        throw new Error(`Textarea not found: ${textareaSelector}`);
    }

    const sandbox = new (window as any).Chartifact.sandbox.Sandbox(previewSelector, textarea.value, {
        onApprove: (message: any) => {
            //Here you can approve unapproved specs per your own policy
            const { specs } = message;
            return specs;
        },
        onError: (error: any) => {
            console.error('Sandbox error:', error);
        },
    });

    textarea.addEventListener('input', () => {
        sandbox.send(textarea.value);
    });

    const toolbar = (window as any).Chartifact.toolbar.create(toolbarSelector, { tweakButton: true, textarea });
    toolbar.manageTextareaVisibilityForAgents();

    return { sandbox, toolbar };
}

/**
 * Initialize a JSON viewer with toolbar
 * @param textareaSelector - CSS selector for the textarea element
 * @param previewSelector - CSS selector for the preview container
 * @param toolbarSelector - CSS selector for the toolbar container
 */
export function initJsonViewer(
    textareaSelector: string = '#source',
    previewSelector: string = '#preview',
    toolbarSelector: string = '.chartifact-toolbar'
) {
    const textarea = document.querySelector(textareaSelector) as HTMLTextAreaElement;
    if (!textarea) {
        throw new Error(`Textarea not found: ${textareaSelector}`);
    }

    let sandbox: any;
    const render = () => {
        const json = textarea.value;
        let markdown: string;
        try {
            const interactiveDocument = JSON.parse(json);
            if (typeof interactiveDocument !== 'object') {
                markdown = 'Invalid Interactive Document JSON';
            } else {
                markdown = (window as any).Chartifact.compiler.targetMarkdown(interactiveDocument);
            }
        } catch (error) {
            markdown = 'Failed to parse Interactive Document JSON';
        }
        if (!sandbox) {
            sandbox = new (window as any).Chartifact.sandbox.Sandbox(previewSelector, markdown, {
                onApprove: (message: any) => {
                    //Here you can approve unapproved specs per your own policy
                    const { specs } = message;
                    return specs;
                },
                onError: (error: any) => {
                    console.error('Sandbox error:', error);
                },
            });
        } else {
            sandbox.send(markdown);
        }
    };
    textarea.addEventListener('input', render);
    render();

    const toolbar = (window as any).Chartifact.toolbar.create(toolbarSelector, { tweakButton: true, textarea, mode: 'json' });
    toolbar.manageTextareaVisibilityForAgents();

    return { sandbox, toolbar, render };
}

/**
 * Auto-initialize viewers on DOMContentLoaded based on data attributes
 */
export function autoInit() {
    window.addEventListener('DOMContentLoaded', () => {
        // Auto-init markdown viewers
        document.querySelectorAll('[data-chartifact-markdown-viewer]').forEach((element) => {
            const textareaSelector = element.getAttribute('data-textarea') || '#source';
            const previewSelector = element.getAttribute('data-preview') || '#preview';
            const toolbarSelector = element.getAttribute('data-toolbar') || '.chartifact-toolbar';
            initMarkdownViewer(textareaSelector, previewSelector, toolbarSelector);
        });

        // Auto-init JSON viewers
        document.querySelectorAll('[data-chartifact-json-viewer]').forEach((element) => {
            const textareaSelector = element.getAttribute('data-textarea') || '#source';
            const previewSelector = element.getAttribute('data-preview') || '#preview';
            const toolbarSelector = element.getAttribute('data-toolbar') || '.chartifact-toolbar';
            initJsonViewer(textareaSelector, previewSelector, toolbarSelector);
        });
    });
}
