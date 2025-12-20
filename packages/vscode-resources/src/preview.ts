/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
declare const hostOptions: Chartifact.host.ListenOptions;

window.addEventListener('DOMContentLoaded', () => {

    const vscode = acquireVsCodeApi();

    const messageListener = (event: MessageEvent<Chartifact.common.EditorSetOfflineDependenciesMessage>) => {

        const options: Chartifact.host.ListenOptions = { ...hostOptions, ...{ postMessageTarget: vscode } };

        const message = event.data as Chartifact.common.EditorSetOfflineDependenciesMessage;

        if (message.type === 'editorSetOfflineDependencies') {

            class OfflineSandbox extends Chartifact.sandbox.Sandbox {
                constructor(element: string | HTMLElement, markdown: string, options: Chartifact.sandbox.SandboxOptions) {
                    super(element, markdown, options);
                }
                getDependencies() {
                    return message.offlineDeps;
                }
            }

            // Initialize toolbar for the VSCode webview (read-only mode)
            const toolbar = new Chartifact.toolbar.Toolbar('.chartifact-toolbar', {
                tweakButton: false,  // Disable tweak button since no textarea editing
                downloadButton: true,
                restartButton: false,  // Disable restart button in VSCode
                filename: 'document'
            });

            const host = new Chartifact.host.Listener({
                preview: '#preview',
                loading: '#loading',
                toolbar: toolbar,
                options,
                onApprove: (message: Chartifact.common.SandboxedPreHydrateMessage) => {
                    // TODO look through each and override policy to approve unapproved
                    // policy from vscode settings
                    const { specs } = message;
                    return specs;
                },
                sandboxConstructor: OfflineSandbox,
            });

            window.removeEventListener('message', messageListener);
        }
    };

    window.addEventListener('message', messageListener);

    const editorGetOfflineDependenciesMessage: Chartifact.common.EditorGetOfflineDependenciesMessage = {
        type: 'editorGetOfflineDependencies',
        sender: 'webview',
    };

    vscode.postMessage(editorGetOfflineDependenciesMessage, '*');
});
