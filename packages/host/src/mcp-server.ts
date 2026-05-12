/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TabServerTransport } from '@mcp-b/transports';
import { z } from 'zod';
import { Listener } from './listener.js';

export async function setupMcpServer(host: Listener): Promise<McpServer> {
    const server = new McpServer({
        name: 'chartifact',
        version: '1.0.0',
    });

    server.tool(
        'render',
        'Render an interactive Chartifact document from markdown',
        {
            title: z.string().describe('Document title shown in the toolbar'),
            markdown: z.string().describe('Chartifact-flavored markdown to render'),
        },
        async ({ title, markdown }) => {
            await host.render(title, markdown, undefined, false);
            return {
                content: [{ type: 'text', text: `Rendered "${title}"` }],
            };
        }
    );

    const transport = new TabServerTransport({ allowedOrigins: ['*'] });
    await server.connect(transport);
    return server;
}
