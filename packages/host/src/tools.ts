/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { z } from 'zod';
import { Listener } from './listener.js';

export interface ToolDef {
    name: string;
    description: string;
    zodShape: Record<string, z.ZodTypeAny>;
    handler: (args: Record<string, unknown>, host: Listener) => Promise<string>;
}

export const tools: ToolDef[] = [
    {
        name: 'render',
        description: 'Render an interactive Chartifact document from markdown',
        zodShape: {
            title: z.string().describe('Document title shown in the toolbar'),
            markdown: z.string().describe('Chartifact-flavored markdown to render'),
        },
        handler: async (args, host) => {
            const { title, markdown } = args as { title: string; markdown: string };
            await host.render(title, markdown, undefined, false);
            return `Rendered "${title}"`;
        },
    },
];
