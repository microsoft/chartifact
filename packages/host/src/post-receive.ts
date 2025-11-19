/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Listener } from './listener.js';
import type { HostRenderRequestMessage, HostToolbarControlMessage } from 'common';

export function setupPostMessageHandling(host: Listener) {
    window.addEventListener('message', async (event) => {
        try {
            // Validate the message structure
            if (!event.data || typeof event.data !== 'object') {
                console.log('Received invalid message format: expected object, got', event.data);
                return;
            }

            const message = event.data;
            
            if (message.type === 'hostRenderRequest') {
                const renderMessage = message as HostRenderRequestMessage;
                if (renderMessage.markdown) {
                    await host.render(renderMessage.title, renderMessage.markdown, undefined, false);
                } else if (renderMessage.interactiveDocument) {
                    await host.render(renderMessage.title, undefined, renderMessage.interactiveDocument, false);
                } else {
                    //do nothing, as messages may be directed to the page for other purposes
                }
            } else if (message.type === 'hostToolbarControl') {
                const toolbarMessage = message as HostToolbarControlMessage;
                if (!host.toolbar) {
                    console.warn('Toolbar control message received but no toolbar is available');
                    return;
                }
                
                // Apply toolbar controls
                if (toolbarMessage.showSource !== undefined) {
                    host.toolbar.setSourceVisibility(toolbarMessage.showSource);
                }
                if (toolbarMessage.showOrHideButtons !== undefined) {
                    host.toolbar.showOrHideButtons(toolbarMessage.showOrHideButtons);
                }
                if (toolbarMessage.setFilename !== undefined) {
                    host.toolbar.setFilename(toolbarMessage.setFilename);
                }
                if (toolbarMessage.showDownloadDialog !== undefined && toolbarMessage.showDownloadDialog) {
                    host.toolbar.showDownloadDialog();
                }
            }
        } catch (error) {
            host.errorHandler(
                error,
                'Error processing postMessage event'
            );
        }
    });
}
