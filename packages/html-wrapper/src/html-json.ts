/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
window.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('#source') as HTMLTextAreaElement;
    let sandbox: Chartifact.sandbox.Sandbox;
    const render = () => {
        const json = textarea.value;
        let markdown: string;
        try {
            const interactiveDocument = JSON.parse(json) as Chartifact.schema.InteractiveDocument;
            if (typeof interactiveDocument !== 'object') {
                markdown = 'Invalid Interactive Document JSON';
            } else {
                markdown = Chartifact.compiler.targetMarkdown(interactiveDocument);
            }
        } catch (error) {
            markdown = 'Failed to parse Interactive Document JSON';
        }
        if (!sandbox) {
            sandbox = new Chartifact.sandbox.Sandbox('#preview', markdown, {
                onApprove: (message) => {
                    //Here you can approve unapproved specs per your own policy
                    const { specs } = message;
                    return specs;
                },
                onError: (error) => {
                    console.error('Sandbox error:', error);
                },
            });
        } else {
            sandbox.send(markdown);
        }
    };
    textarea.addEventListener('input', render);
    render();

    const toolbar = Chartifact.toolbar.create('.chartifact-toolbar', { tweakButton: true, textarea });
    toolbar.manageTextareaVisibilityForAgents();
});
