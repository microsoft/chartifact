/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * JSON-RPC 2.0 types for MCP Apps protocol
 */

export interface JsonRpcRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: any;
}

export interface JsonRpcResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: any;
    error?: JsonRpcError;
}

export interface JsonRpcNotification {
    jsonrpc: '2.0';
    method: string;
    params?: any;
}

export interface JsonRpcError {
    code: number;
    message: string;
    data?: any;
}

export const JsonRpcErrorCode = {
    ParseError: -32700,
    InvalidRequest: -32600,
    MethodNotFound: -32601,
    InvalidParams: -32602,
    InternalError: -32603,
} as const;
