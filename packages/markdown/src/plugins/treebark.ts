/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * Treebark Plugin - Renders cards and structured HTML using Treebark templates
 */

import { Plugin, RawFlaggableSpec, IInstance } from '../factory.js';
import { ErrorHandler } from '../renderer.js';
import { flaggablePlugin } from './config.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { TreebarkElementProps } from '@microsoft/chartifact-schema';
import { renderToDOM, TemplateElement } from 'treebark';

interface TreebarkInstance {
    id: string;
    spec: TreebarkElementProps;
    container: Element;
    lastRenderedData: string;
    resolvedTemplate: TemplateElement;
}

export interface TreebarkSpec extends TreebarkElementProps { }

const pluginName: PluginNames = 'treebark';
const className = pluginClassName(pluginName);

function inspectTreebarkSpec(spec: TreebarkSpec): RawFlaggableSpec<TreebarkSpec> {
    const reasons: string[] = [];
    let hasFlags = false;

    // Validate: either template, setTemplate, or getTemplate must be present
    if (!spec.template && !spec.setTemplate && !spec.getTemplate) {
        hasFlags = true;
        reasons.push('Either template, setTemplate, or getTemplate is required');
    }
    
    // Validate: setTemplate and getTemplate are mutually exclusive
    if (spec.setTemplate && spec.getTemplate) {
        hasFlags = true;
        reasons.push('setTemplate and getTemplate cannot both be specified');
    }
    
    // Validate: setTemplate requires template
    if (spec.setTemplate && !spec.template) {
        hasFlags = true;
        reasons.push('setTemplate requires template to be provided');
    }
    
    // Validate: getTemplate should not have template
    if (spec.getTemplate && spec.template) {
        hasFlags = true;
        reasons.push('getTemplate should not have template (it references an existing template)');
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
        
        // Template registry: starts empty, adds inline-defined templates during hydration
        const templateRegistry: Record<string, TemplateElement> = {};

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
            
            let resolvedTemplate: TemplateElement;
            
            // Explicit SET/GET semantics
            if (spec.setTemplate) {
                // SET: Register and use the template
                templateRegistry[spec.setTemplate] = spec.template;
                resolvedTemplate = spec.template;
            } else if (spec.getTemplate) {
                // GET: Lookup the template
                resolvedTemplate = templateRegistry[spec.getTemplate];
                if (!resolvedTemplate) {
                    container.innerHTML = `<div class="error">Template '${spec.getTemplate}' not found</div>`;
                    errorHandler(
                        new Error(`Template '${spec.getTemplate}' not found`),
                        pluginName,
                        index,
                        'resolve',
                        container
                    );
                    continue;
                }
            } else {
                // INLINE: Use template directly (can be object or string)
                resolvedTemplate = spec.template;
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
