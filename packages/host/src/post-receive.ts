/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Listener } from './listener.js';
import type { HostRenderRequestMessage } from 'common';

export function setupPostMessageHandling(host: Listener) {
    window.addEventListener('message', async (event) => {
        try {
            // Validate the message structure
            if (!event.data || typeof event.data !== 'object') {
                console.log('Received invalid message format: expected object, got', event.data);
                return;
            }

            const message = event.data as HostRenderRequestMessage;
            if (message.type == 'hostRenderRequest') {
                if (message.markdown) {
                    await host.render( message.title, message.markdown, undefined, false);
                } else if (message.interactiveDocument) {
                    await host.render( message.title, undefined, message.interactiveDocument, false);
                } else {
                    //do nothing, as messages may be directed to the page for other purposes
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
