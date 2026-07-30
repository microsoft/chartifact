/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */
import { Listener } from './listener.js';
import type { HostRenderRequestMessage, HostToolbarControlMessage } from 'common';
import type { JsonRpcRequest, JsonRpcResponse, JsonRpcNotification } from './mcp-protocol.js';
import { JsonRpcErrorCode } from './mcp-protocol.js';

/**
 * Check if a message is a JSON-RPC 2.0 message (MCP Apps protocol)
 */
function isJsonRpcMessage(message: any): message is JsonRpcRequest | JsonRpcResponse | JsonRpcNotification {
    return message && typeof message === 'object' && message.jsonrpc === '2.0';
}

/**
 * Handle MCP Apps JSON-RPC protocol messages
 */
async function handleMcpMessage(host: Listener, event: MessageEvent) {
    const message = event.data;
    
    // Handle requests (have an id property)
    if ('id' in message && 'method' in message) {
        const request = message as JsonRpcRequest;
        await handleMcpRequest(host, request, event.source as Window);
        return;
    }
    
    // Handle notifications (no id property)
    if ('method' in message && !('id' in message)) {
        const notification = message as JsonRpcNotification;
        handleMcpNotification(host, notification);
        return;
    }
}

/**
 * Send a JSON-RPC response
 */
function sendJsonRpcResponse(target: Window, id: string | number, result?: any, error?: { code: number; message: string; data?: any }) {
    const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id,
    };
    
    if (error) {
        response.error = error;
    } else {
        response.result = result;
    }
    
    target.postMessage(response, '*');
}

/**
 * Send a JSON-RPC notification
 */
function sendJsonRpcNotification(target: Window, method: string, params?: any) {
    const notification: JsonRpcNotification = {
        jsonrpc: '2.0',
        method,
        params,
    };
    
    target.postMessage(notification, '*');
}

/**
 * Handle MCP request messages
 */
async function handleMcpRequest(host: Listener, request: JsonRpcRequest, source: Window) {
    try {
        switch (request.method) {
            case 'initialize':
                sendJsonRpcResponse(source, request.id, {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: false,
                        resources: true,
                    },
                    serverInfo: {
                        name: 'chartifact-viewer',
                        version: '1.0.0',
                    },
                });
                break;
                
            case 'ui/render':
                const { title, markdown, interactiveDocument } = request.params || {};
                
                if (!markdown && !interactiveDocument) {
                    sendJsonRpcResponse(source, request.id, undefined, {
                        code: JsonRpcErrorCode.InvalidParams,
                        message: 'Either markdown or interactiveDocument must be provided',
                    });
                    return;
                }
                
                await host.render(
                    title || 'Untitled Document',
                    markdown || null,
                    interactiveDocument || null,
                    false
                );
                
                sendJsonRpcResponse(source, request.id, { success: true });
                break;
                
            case 'ui/get-content':
                sendJsonRpcResponse(source, request.id, {
                    hasContent: host.sandboxReady && !!host.sandbox,
                    mode: host.toolbar?.mode || 'unknown',
                });
                break;
                
            case 'ui/clear':
                host.createSandbox('');
                sendJsonRpcResponse(source, request.id, { success: true });
                break;
                
            default:
                sendJsonRpcResponse(source, request.id, undefined, {
                    code: JsonRpcErrorCode.MethodNotFound,
                    message: `Method not found: ${request.method}`,
                });
        }
    } catch (error) {
        sendJsonRpcResponse(source, request.id, undefined, {
            code: JsonRpcErrorCode.InternalError,
            message: error instanceof Error ? error.message : String(error),
            data: error,
        });
    }
}

/**
 * Handle MCP notification messages
 */
function handleMcpNotification(host: Listener, notification: JsonRpcNotification) {
    switch (notification.method) {
        case 'ui/update':
            const { title, markdown, interactiveDocument } = notification.params || {};
            host.render(
                title || 'Untitled Document',
                markdown || null,
                interactiveDocument || null,
                false
            );
            break;
    }
}

export function setupPostMessageHandling(host: Listener) {
    window.addEventListener('message', async (event) => {
        try {
            // Validate the message structure
            if (!event.data || typeof event.data !== 'object') {
                console.log('Received invalid message format: expected object, got', event.data);
                return;
            }

            const message = event.data;
            
            // Check if this is an MCP Apps JSON-RPC message
            if (isJsonRpcMessage(message)) {
                await handleMcpMessage(host, event);
                return;
            }
            
            // Handle existing Chartifact message types
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
    
    // Send MCP ready notification if this is an MCP context
    // Check if we're embedded in an iframe and the parent is waiting for MCP messages
    if (window.parent !== window) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('mcp') || urlParams.has('jsonrpc')) {
            // Send ready notification to parent
            const notification: JsonRpcNotification = {
                jsonrpc: '2.0',
                method: 'ui/ready',
                params: {
                    capabilities: {
                        formats: ['markdown', 'json'],
                        interactive: true,
                    },
                },
            };
            window.parent.postMessage(notification, '*');
        }
    }
}
