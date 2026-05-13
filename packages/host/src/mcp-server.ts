/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TabServerTransport } from '@mcp-b/transports';
import { Listener } from './listener.js';
import { tools } from './mcp-tools.js';

export async function setupMcpServer(host: Listener): Promise<McpServer> {
    const server = new McpServer({
        name: 'chartifact',
        version: '1.0.0',
    });

    for (const tool of tools) {
        server.tool(
            tool.name,
            tool.description,
            tool.zodShape,
            async (args) => {
                const text = await tool.handler(args as Record<string, unknown>, host);
                return { content: [{ type: 'text', text }] };
            }
        );
    }

    const transport = new TabServerTransport({ allowedOrigins: ['*'] });
    await server.connect(transport);
    return server;
}
