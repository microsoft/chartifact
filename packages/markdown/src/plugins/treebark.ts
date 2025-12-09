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
 * 3. Using Template Reference (head syntax):
 * ```treebark{templateId=chatBubble variableId=chatMessages}
 * ```
 *
 * 4. Using Template Reference (JSON with string template):
 * ```treebark
 * {
 *   "template": "chatBubble",
 *   "variableId": "chatMessages"
 * }
 * ```
 */

import { Plugin, RawFlaggableSpec, IInstance } from '../factory.js';
import { ErrorHandler } from '../renderer.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { TreebarkElementProps } from '@microsoft/chartifact-schema';
import { renderToDOM } from 'treebark';
import { sanitizedHTML } from '../sanitize.js';
import * as yaml from 'js-yaml';
import { SpecReview } from 'common';

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

/**
 * Parse templateId from fence info head syntax
 * Supports: ```treebark{templateId=foo variableId=bar}
 */
function parseTemplateId(info: string): { templateId: string | null } {
    const match = info.match(/templateId[=:](\S+)/);
    return { templateId: match ? match[1] : null };
}

function inspectTreebarkSpec(spec: TreebarkSpec): RawFlaggableSpec<TreebarkSpec> {
    const reasons: string[] = [];
    let hasFlags = false;

    // Validate template - can be object or string (templateId reference)
    if (!spec.template) {
        hasFlags = true;
        reasons.push('template is required');
    } else if (typeof spec.template !== 'object' && typeof spec.template !== 'string') {
        hasFlags = true;
        reasons.push('template must be an object or a string (templateId reference)');
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
    name: pluginName,
    fence: (token, index) => {
        const info = token.info.trim();
        let content = token.content.trim();
        let spec: TreebarkSpec;
        let flaggableSpec: RawFlaggableSpec<TreebarkSpec>;
        
        // Check for head syntax (templateId parameter)
        const { templateId } = parseTemplateId(info);
        
        // Determine format from token info
        const isYaml = info.startsWith('yaml ');
        const formatName = isYaml ? 'YAML' : 'JSON';
        
        try {
            if (isYaml) {
                spec = yaml.load(content) as TreebarkSpec;
            } else {
                spec = JSON.parse(content);
            }
        } catch (e) {
            flaggableSpec = {
                spec: null,
                hasFlags: true,
                reasons: [`malformed ${formatName}`],
            };
        }
        
        // If templateId specified in head, set template to the string reference
        if (templateId && spec) {
            spec.template = templateId;
        }
        
        if (spec) {
            flaggableSpec = inspectTreebarkSpec(spec);
        }
        
        if (flaggableSpec) {
            content = JSON.stringify(flaggableSpec);
        }
        
        return sanitizedHTML('div', { class: className, id: `${pluginName}-${index}` }, content, true);
    },
    hydrateSpecs: (renderer, errorHandler) => {
        const flagged: SpecReview<TreebarkSpec>[] = [];
        const containers = renderer.element.querySelectorAll(`.${className}`);
        for (const [index, container] of Array.from(containers).entries()) {
            const scriptTag = container.querySelector('script[type="application/json"]') as HTMLScriptElement;
            if (!scriptTag) continue;
            
            let flaggableSpec: RawFlaggableSpec<TreebarkSpec>;
            try {
                flaggableSpec = JSON.parse(scriptTag.textContent || '{}');
            } catch (e) {
                errorHandler(e instanceof Error ? e : new Error(String(e)), pluginName, index, 'parse', container);
                continue;
            }
            
            const f: SpecReview<TreebarkSpec> = { approvedSpec: null, pluginName, containerId: container.id };
            if (flaggableSpec.hasFlags) {
                f.blockedSpec = flaggableSpec.spec;
                f.reason = flaggableSpec.reasons?.join(', ') || 'Unknown reason';
            } else {
                f.approvedSpec = flaggableSpec.spec;
            }
            flagged.push(f);
        }
        return flagged;
    },
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus, document } = renderer;
        const treebarkInstances: TreebarkInstance[] = [];
        
        // Get treebarkTemplates from document resources
        const treebarkTemplates = (document as any)?.resources?.treebarkTemplates || {};

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
            
            // Resolve template if it's a string reference
            let resolvedTemplate: object;
            if (typeof spec.template === 'string') {
                resolvedTemplate = treebarkTemplates[spec.template];
                if (!resolvedTemplate) {
                    container.innerHTML = `<div class="error">Template '${spec.template}' not found in resources.treebarkTemplates</div>`;
                    errorHandler(
                        new Error(`Template '${spec.template}' not found`),
                        pluginName,
                        index,
                        'resolve',
                        container
                    );
                    continue;
                }
            } else {
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
