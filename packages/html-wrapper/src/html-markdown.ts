/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
window.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('#source') as HTMLTextAreaElement;
    const sandbox = new Chartifact.sandbox.Sandbox('#preview', textarea.value, {
        onApprove: (message) => {
            //Here you can approve unapproved specs per your own policy
            const { specs } = message;
            return specs;
        },
        onError: (error) => {
            console.error('Sandbox error:', error);
        },
    });

    textarea.addEventListener('input', () => {
        sandbox.send(textarea.value);
    });

    const toolbar = Chartifact.toolbar.create('.chartifact-toolbar', { tweakButton: true, textarea });
    toolbar.manageTextareaVisibilityForAgents();
});
