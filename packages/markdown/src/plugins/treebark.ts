/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/*
 * Treebark Plugin - Renders cards and structured HTML using Treebark templates
 *
 * USAGE EXAMPLES:
 *
 * 1. Static Data:
 * ```treebark
 * {
 *   "template": {
 *     "div": {
 *       "class": "card",
 *       "$children": ["Hello {{name}}!"]
 *     }
 *   },
 *   "data": { "name": "World" }
 * }
 * ```
 *
 * 2. Dynamic Data via Signal (data source → cards):
 * ```treebark
 * {
 *   "template": {
 *     "div": {
 *       "class": "card",
 *       "$bind": ".",
 *       "$children": [
 *         { "h3": "{{Title}}" },
 *         { "p": "{{Director}}" }
 *       ]
 *     }
 *   },
 *   "variableId": "movieData"
 * }
 * ```
 *
 * 3. Define and reuse templates:
 * ```treebark
 * {
 *   "templateId": "myCard",
 *   "template": {
 *     "div": {
 *       "class": "card",
 *       "$children": ["{{name}}"]
 *     }
 *   },
 *   "variableId": "users"
 * }
 * ```
 *
 * 4. Reference a template:
 * ```treebark
 * {
 *   "templateId": "myCard",
 *   "variableId": "products"
 * }
 * ```
 */

import { Plugin, RawFlaggableSpec, IInstance } from '../factory.js';
import { ErrorHandler } from '../renderer.js';
import { flaggablePlugin } from './config.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { TreebarkElementProps } from '@microsoft/chartifact-schema';
import { renderToDOM } from 'treebark';

interface TreebarkInstance {
    id: string;
    spec: TreebarkElementProps;
    container: Element;
    lastRenderedData: string;
    resolvedTemplate: object;
}

export interface TreebarkSpec extends TreebarkElementProps { }

const pluginName: PluginNames = 'treebark';
const className = pluginClassName(pluginName);

function inspectTreebarkSpec(spec: TreebarkSpec): RawFlaggableSpec<TreebarkSpec> {
    const reasons: string[] = [];
    let hasFlags = false;

    // Validate: either template or templateId must be present
    if (!spec.template && !spec.templateId) {
        hasFlags = true;
        reasons.push('Either template or templateId is required');
    }
    
    // If template is provided, it must be object or string
    if (spec.template && typeof spec.template !== 'object' && typeof spec.template !== 'string') {
        hasFlags = true;
        reasons.push('template must be an object or a string');
    }

    // If both data and variableId are provided, warn but allow it
    if (spec.data && spec.variableId) {
        // This is OK - data will be used as fallback and variableId will override
    }

    return {
        spec,
        hasFlags,
        reasons,
    };
}

export const treebarkPlugin: Plugin<TreebarkSpec> = {
    ...flaggablePlugin<TreebarkSpec>(pluginName, className, inspectTreebarkSpec),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus, document } = renderer;
        const treebarkInstances: TreebarkInstance[] = [];
        
        // Template registry: starts with templates from resources, then adds inline-defined ones
        const templateRegistry: Record<string, object> = {
            ...(document as any)?.resources?.treebarkTemplates || {}
        };

        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);
            if (!container) {
                continue;
            }

            const spec = specReview.approvedSpec;
            
            let resolvedTemplate: object;
            
            // Use templateId to determine SET vs GET
            if (spec.templateId) {
                if (spec.template) {
                    // SET: templateId + template = register the template
                    templateRegistry[spec.templateId] = spec.template as object;
                    resolvedTemplate = spec.template as object;
                } else {
                    // GET: templateId without template = lookup the template
                    resolvedTemplate = templateRegistry[spec.templateId];
                    if (!resolvedTemplate) {
                        container.innerHTML = `<div class="error">Template '${spec.templateId}' not found</div>`;
                        errorHandler(
                            new Error(`Template '${spec.templateId}' not found`),
                            pluginName,
                            index,
                            'resolve',
                            container
                        );
                        continue;
                    }
                }
            } else {
                // No templateId: template is used inline (can be object or string)
                resolvedTemplate = spec.template as object;
            }

            // Create container for the rendered content
            container.innerHTML = `<div class="treebark-loading">Loading...</div>`;

            const treebarkInstance: TreebarkInstance = {
                id: `${pluginName}-${index}`,
                spec,
                container,
                lastRenderedData: null,
                resolvedTemplate,
            };
            treebarkInstances.push(treebarkInstance);

            // For static data mode, render immediately
            if (spec.data && !spec.variableId) {
                await renderTreebark(treebarkInstance, spec.data, errorHandler, index);
            }
        }

        const instances = treebarkInstances.map((treebarkInstance, index): IInstance => {
            const { spec } = treebarkInstance;
            const { variableId } = spec;

            const initialSignals = [];

            // Add signal for dynamic data input
            if (variableId) {
                initialSignals.push({
                    name: variableId,
                    value: spec.data || null,
                    priority: -1,
                    isData: true,
                });
            }

            return {
                ...treebarkInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (variableId && batch[variableId]) {
                        const value = batch[variableId].value;
                        // Always render, even with falsy values, to support $if conditional tags
                        await renderTreebark(treebarkInstance, value, errorHandler, index);
                    }
                }
            };
        });

        return instances;
    },
};

async function renderTreebark(
    instance: TreebarkInstance,
    data: unknown,
    errorHandler: ErrorHandler,
    index: number
) {
    const { container, resolvedTemplate } = instance;

    try {
        // Create a stable key for caching based on data content
        const dataKey = JSON.stringify(data);

        // Only re-render if data has changed
        if (instance.lastRenderedData === dataKey) {
            return;
        }

        // Render using treebark with resolved template
        const html = renderToDOM({
            template: resolvedTemplate,
            data: data as any,
        });

        container.innerHTML = '';
        container.appendChild(html);
        instance.lastRenderedData = dataKey;
    } catch (error) {
        container.innerHTML = `<div class="error">Failed to render treebark template</div>`;
        errorHandler(
            error instanceof Error ? error : new Error(String(error)),
            pluginName,
            index,
            'render',
            container
        );
    }
}
