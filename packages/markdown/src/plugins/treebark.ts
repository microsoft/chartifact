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
* 3. With Empty State:
* ```treebark
* {
*   "template": {
*     "div": {
*       "class": "card",
*       "$children": ["{{name}}"]
*     }
*   },
*   "emptyTemplate": {
*     "div": {
*       "class": "empty-state",
*       "$children": ["No data available"]
*     }
*   },
*   "variableId": "userData"
* }
* ```
*/

import { Plugin, RawFlaggableSpec, IInstance } from '../factory.js';
import { ErrorHandler } from '../renderer.js';
import { sanitizedHTML } from '../sanitize.js';
import { flaggablePlugin } from './config.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { TreebarkElementProps } from '@microsoft/chartifact-schema';
import { renderToString } from 'treebark/string';

interface TreebarkInstance {
    id: string;
    spec: TreebarkElementProps;
    container: Element;
    lastRenderedData: string;
}

export interface TreebarkSpec extends TreebarkElementProps { }

const pluginName: PluginNames = 'treebark';
const className = pluginClassName(pluginName);

function inspectTreebarkSpec(spec: TreebarkSpec): RawFlaggableSpec<TreebarkSpec> {
    const reasons: string[] = [];
    let hasFlags = false;

    // Validate template
    if (!spec.template || typeof spec.template !== 'object') {
        hasFlags = true;
        reasons.push('template must be an object');
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
        const { signalBus } = renderer;
        const treebarkInstances: TreebarkInstance[] = [];

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

            // Create container for the rendered content
            container.innerHTML = `<div class="treebark-loading">Loading...</div>`;

            const treebarkInstance: TreebarkInstance = {
                id: `${pluginName}-${index}`,
                spec,
                container,
                lastRenderedData: null,
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

                        if (value) {
                            await renderTreebark(treebarkInstance, value, errorHandler, index);
                        } else {
                            // Use emptyTemplate if provided, otherwise show default message
                            await renderEmptyOrError(treebarkInstance, errorHandler, index);
                        }
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
    const { spec, container } = instance;

    try {
        // Create a stable key for caching based on data content
        const dataKey = JSON.stringify(data);
        
        // Only re-render if data has changed
        if (instance.lastRenderedData === dataKey) {
            return;
        }

        // Render using treebark
        const html = renderToString({
            template: spec.template as any,
            data: data as any,
        });

        container.innerHTML = html;
        instance.lastRenderedData = dataKey;
    } catch (error) {
        // Use emptyTemplate if provided, otherwise show default error message
        await renderEmptyOrError(instance, errorHandler, index, error as Error);
    }
}

async function renderEmptyOrError(
    instance: TreebarkInstance,
    errorHandler: ErrorHandler,
    index: number,
    error?: Error
) {
    const { spec, container } = instance;

    if (spec.emptyTemplate) {
        try {
            // Render the emptyTemplate
            const html = renderToString({
                template: spec.emptyTemplate as any,
                data: {},
            });
            container.innerHTML = html;
        } catch (emptyError) {
            // If emptyTemplate fails, show default error
            container.innerHTML = '<div class="error">Failed to render empty template</div>';
            if (error) {
                errorHandler(error, pluginName, index, 'render', container);
            }
        }
    } else {
        // No emptyTemplate provided, show default message
        if (error) {
            container.innerHTML = '<div class="error">Failed to render treebark template</div>';
            errorHandler(error, pluginName, index, 'render', container);
        } else {
            container.innerHTML = '<div class="error">No data to display</div>';
        }
    }
}
