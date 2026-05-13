/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { z } from 'zod';
import { Listener } from './listener.js';
import { tools } from './mcp-tools.js';

// Minimal typing of the WebMCP navigator extension. The W3C draft (CG-DRAFT, editors at
// Microsoft and Google) defines navigator.modelContext.registerTool(tool, options?). See
// https://github.com/webmachinelearning/webmcp/blob/main/index.bs.
interface ModelContextTool {
    name: string;
    title?: string;
    description: string;
    inputSchema?: object;
    execute: (input: Record<string, unknown>, client: ModelContextClient) => Promise<unknown>;
    annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
}

interface ModelContextClient {
    requestUserInteraction(callback: () => Promise<unknown>): Promise<unknown>;
}

interface ModelContext {
    registerTool(tool: ModelContextTool, options?: { signal?: AbortSignal }): void;
}

export function setupWebMcp(host: Listener): boolean {
    const mc = (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!mc) {
        return false;
    }

    for (const tool of tools) {
        const inputSchema = z.toJSONSchema(z.object(tool.zodShape)) as object;
        mc.registerTool({
            name: tool.name,
            description: tool.description,
            inputSchema,
            execute: async (input) => {
                return await tool.handler(input, host);
            },
        });
    }
    return true;
}
