/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import MarkdownIt, { Token } from 'markdown-it/index.js';
import { attrs } from '@mdit/plugin-attrs';
import { container, MarkdownItContainerOptions } from '@mdit/plugin-container';
import { ErrorHandler, Renderer } from './renderer.js';
import { defaultCommonOptions, SpecReview } from 'common';
import * as Csstree from 'css-tree';

let markdownit: typeof MarkdownIt;

//see if markdownit exists in global scope (not just window)
if (typeof globalThis.markdownit === 'function') {
    markdownit = globalThis.markdownit;
}

export function setMarkdownIt(md: typeof MarkdownIt) {
    markdownit = md;
}

// CSS Tree is expected to be available as a global variable
export let csstree: typeof Csstree;

//see if css-tree exists in global scope (not just window)
if (typeof globalThis.csstree === 'object') {
    csstree = globalThis.csstree;
}

export function setCssTree(tree: typeof Csstree) {
    csstree = tree;
}

export interface PrioritizedSignal {
    name: string;
    value: unknown;
    priority: number;
    isData: boolean;
}

export interface BatchItem {
    value: unknown;
    isData: boolean;
}

export interface Batch {
    [name: string]: BatchItem;
}

export interface IInstance {
    id: string;
    initialSignals: PrioritizedSignal[];
    recieveBatch?: (batch: Batch, from: string) => Promise<void>;
    beginListening?: (sharedSignals: { signalName: string, isData: boolean }[]) => void;
    broadcastComplete?: () => Promise<void>;
    destroy?: () => void;
    getCurrentSignalValue?: (signalName: string) => unknown;
}

export interface RawFlaggableSpec<T> {
    spec: T;
    hasFlags?: boolean;
    reasons?: string[];
}

export interface SpecContainer<T> {
    container: HTMLElement;
    flaggableSpec: RawFlaggableSpec<T>;
}

export interface Plugin<T = {}> {
    name: string;
    hydratesBefore?: string;
    initializePlugin: (md: MarkdownIt) => void;
    fence?: (token: Token, idx: number) => string;
    hydrateSpecs?: (renderer: Renderer, errorHandler: ErrorHandler) => SpecReview<T>[];
    hydrateComponent?: (renderer: Renderer, errorHandler: ErrorHandler, flagged: SpecReview<T>[]) => Promise<IInstance[]>;
}

export const plugins: Plugin[] = [];

export function registerMarkdownPlugin(plugin: Plugin) {
    // Find the correct position to insert the plugin based on hydratesBefore
    let insertIndex = plugins.length;
    
    // First, find the latest position where plugins that should run before this one are located
    let minIndex = 0;
    for (let i = 0; i < plugins.length; i++) {
        if (plugins[i].hydratesBefore === plugin.name) {
            minIndex = Math.max(minIndex, i + 1);
        }
    }
    
    // Then, if this plugin should run before another plugin, find that plugin's position
    if (plugin.hydratesBefore) {
        const targetIndex = plugins.findIndex(p => p.name === plugin.hydratesBefore);
        if (targetIndex !== -1) {
            insertIndex = targetIndex;
        }
    }
    
    // Ensure we don't insert before plugins that should run before this one
    insertIndex = Math.max(insertIndex, minIndex);
    
    plugins.splice(insertIndex, 0, plugin);
    return 'register';
}

export function create() {
    const md = new markdownit();
    for (const plugin of plugins) {
        plugin.initializePlugin(md);
    }

    md.use(attrs);

    const containerOptions: MarkdownItContainerOptions = { name: defaultCommonOptions.groupClassName };
    md.use(container, containerOptions);

    // Default handler to preserve existing functionality
    const originalFence = md.renderer.rules.fence;

    // Modified fence renderer to dynamically use handlers
    md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
        const token = tokens[idx];
        const info = token.info.trim();

        // Check if the info starts with "json " and extract the plugin name
        if (info.startsWith('json ')) {
            const pluginName = info.slice(5).trim();

            // Find the plugin by name
            const plugin = plugins.find(p => p.name === pluginName);
            if (plugin && plugin.fence) {
                return plugin.fence(token, idx);
            }
        }

        // Fallback to the original fence renderer if no plugin matches
        if (originalFence) {
            return originalFence(tokens, idx, options, env, slf);
        } else {
            return '';
        }
    };

    return md;
}

export function definePlugin(md: MarkdownIt, pluginName: string) {
    md.block.ruler.before('fence', `${pluginName}_block`, function (state, startLine, endLine) {
        const start = state.bMarks[startLine] + state.tShift[startLine];
        const max = state.eMarks[startLine];

        // Check if the block starts with "```json <plugin_name>"
        const marker = `json ${pluginName}`;
        if (!state.src.slice(start, max).trim().startsWith('```' + marker)) {
            return false;
        }

        let nextLine = startLine;
        while (nextLine < endLine) {
            nextLine++;
            if (state.src.slice(state.bMarks[nextLine] + state.tShift[nextLine], state.eMarks[nextLine]).trim() === '```') {
                break;
            }
        }

        state.line = nextLine + 1;
        const token = state.push('fence', 'code', 0);
        token.info = marker;
        token.content = state.getLines(startLine + 1, nextLine, state.blkIndent, true);
        token.map = [startLine, state.line];

        return true;
    });
}
