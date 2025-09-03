/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

/*
* Mermaid Plugin - Renders Mermaid diagrams with flexible input modes
*
* USAGE EXAMPLES:
*
* 1. Raw Mermaid Text (simplest):
* ```mermaid
* flowchart TD
*     A[Start] --> B[Process]
*     B --> C[End]
* ```
*
* 2. String Input via Signal (textbox → diagram):
* ```mermaid
* {
*   "variableId": "userInput"
* }
* ```
* When userInput signal contains complete Mermaid text, renders directly.
*
* 3. Template-Driven with Data (structured data → diagram):
* ```mermaid
* {
*   "template": {
*     "dataSourceName": "diagramData",
*     "diagramType": "flowchart TD",
*     "lineTemplates": {
*       "node": "    {{id}}[{{label}}]",
*       "link": "    {{from}} --> {{to}}"
*     }
*   },
*   "variableId": "outputDiagram"
* }
* ```
* With data like:
* [
*   {"template": "node", "id": "A", "label": "Start"},
*   {"template": "node", "id": "B", "label": "Process"},
*   {"template": "link", "from": "A", "to": "B"}
* ]
*/

import { Plugin, RawFlaggableSpec, IInstance } from '../factory.js';
import { ErrorHandler } from '../renderer.js';
import { sanitizedHTML } from '../sanitize.js';
import { flaggablePlugin } from './config.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { TemplateToken, tokenizeTemplate } from 'common';
import { MermaidConfig } from 'mermaid';
import type Mermaid from 'mermaid';
import { MermaidElementProps, MermaidTemplate } from '@microsoft/chartifact-schema';
import * as yaml from 'js-yaml';

interface MermaidInstance {
    id: string;
    spec: MermaidElementProps;
    container: Element;
    lastRenderedDiagram: string;
    signals: Record<string, any>;
    tokens: TemplateToken[];
}

export interface MermaidSpec extends MermaidElementProps { }

const pluginName: PluginNames = 'mermaid';
const className = pluginClassName(pluginName);

function inspectMermaidSpec(spec: MermaidSpec): RawFlaggableSpec<MermaidSpec> {
    const reasons: string[] = [];
    let hasFlags = false;

    if (spec.diagramText) {
        // For raw text mode, check for potentially dangerous content
        const dangerousPatterns = [
            /javascript:/i,
            /<script/i,
            /onclick=/i,
            /onerror=/i,
            /onload=/i,
            /href\s*=\s*["']javascript:/i
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(spec.diagramText)) {
                hasFlags = true;
                reasons.push('Potentially unsafe content detected in diagram');
                break;
            }
        }
    } else {
        // For JSON template mode, validate structure
        // template is optional - only needed if using template mode
        if (spec.template && typeof spec.template !== 'object') {
            hasFlags = true;
            reasons.push('template must be an object if provided');
        } else if (spec.template) {
            // Validate diagram
            if (!spec.template.header || typeof spec.template.header !== 'string') {
                hasFlags = true;
                reasons.push('template.header must be a non-empty string');
            }

            // Validate lineTemplates
            if (!spec.template.lineTemplates || typeof spec.template.lineTemplates !== 'object') {
                hasFlags = true;
                reasons.push('template.lineTemplates must be an object');
            } else {
                // Check templates for dangerous content
                for (const [lineTemplateName, lineTemplate] of Object.entries(spec.template.lineTemplates)) {
                    if (typeof lineTemplate !== 'string') {
                        hasFlags = true;
                        reasons.push(`Template '${lineTemplateName}' must be a string`);
                    }
                }
            }
            // Must have dataSourceName for dynamic content
            if (!spec.template.dataSourceName) {
                hasFlags = true;
                reasons.push('Must specify dataSourceName for dynamic content');
            }
        }
    }

    return {
        spec,
        hasFlags,
        reasons,
    };
}

declare const mermaid: typeof Mermaid;

async function initializeMermaid() {
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
    } as MermaidConfig);
}

//initialize it now if it was loaded via script tag
if (typeof mermaid !== 'undefined') {
    initializeMermaid();
}

// Helper to lazy load Mermaid from CDN and initialize it
let mermaidLoadPromise: Promise<void> | null = null;
function loadMermaidFromCDN(): Promise<void> {
    if (mermaidLoadPromise) return mermaidLoadPromise;
    mermaidLoadPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.10.0/dist/mermaid.min.js';
        script.async = true;
        script.onload = () => {
            initializeMermaid();
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Mermaid from CDN'));
        document.head.appendChild(script);
    });
    return mermaidLoadPromise;
}

export const mermaidPlugin: Plugin<MermaidSpec> = {
    ...flaggablePlugin<MermaidSpec>(pluginName, className),
    fence: (token, index) => {
        const content = token.content.trim();
        let spec: MermaidSpec;
        let flaggableSpec: RawFlaggableSpec<MermaidSpec>;

        // Determine format from token info (like flaggablePlugin does)
        const info = token.info.trim();
        const isYaml = info.startsWith('yaml ');
        const formatName = isYaml ? 'YAML' : 'JSON';

        // Try to parse as YAML or JSON based on format
        try {
            let parsed: any;
            if (isYaml) {
                parsed = yaml.load(content);
            } else {
                parsed = JSON.parse(content);
            }
            
            if (parsed && typeof parsed === 'object') {
                spec = parsed as MermaidSpec;
            } else {
                // If it's valid YAML/JSON but not a proper MermaidSpec object, treat as raw text
                spec = { diagramText: content };
            }
        } catch (e) {
            // If YAML/JSON parsing fails, treat as raw text
            spec = { diagramText: content };
        }

        flaggableSpec = inspectMermaidSpec(spec);
        const json = JSON.stringify(flaggableSpec);

        return sanitizedHTML('div', { class: className, id: `${pluginName}-${index}` }, json, true);
    },
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const mermaidInstances: MermaidInstance[] = [];

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
            const { template } = spec;

            // Create container for the diagram
            container.innerHTML = `<div class="mermaid-loading">Loading diagram...</div>`;

            const tokens = tokenizeTemplate(template?.header || '') || [];

            const mermaidInstance: MermaidInstance = {
                id: `${pluginName}-${index}`,
                spec,
                container,
                signals: {},
                tokens,
                lastRenderedDiagram: null,
            };
            mermaidInstances.push(mermaidInstance);

            // For raw text mode, render immediately
            if (spec.diagramText && typeof spec.diagramText === 'string') {
                await renderRawDiagram(mermaidInstance.id, mermaidInstance.container, spec.diagramText, errorHandler, pluginName, index);
            }
        }

        const instances = mermaidInstances.map((mermaidInstance, index): IInstance => {
            const { spec, signals, tokens } = mermaidInstance;
            const { template, variableId } = spec;

            const initialSignals = tokens.filter(token => token.type === 'variable').map(token => ({
                name: token.name,
                value: null,
                priority: -1,
                isData: false,
            }));

            if (template?.dataSourceName) {
                initialSignals.push({
                    name: template.dataSourceName,
                    value: null,
                    priority: -1,
                    isData: true,
                });
            }

            // Add input/output signal for generated Mermaid text (data-driven mode only)
            if (variableId) {
                initialSignals.push({
                    name: variableId,
                    value: '',
                    priority: 1,
                    isData: false,
                });
            }

            return {
                ...mermaidInstance,
                initialSignals,
                receiveBatch: async (batch) => {

                    if (template) {

                        //merge incoming signals with cached signals
                        for (const [signalName, batchItem] of Object.entries(batch)) {
                            signals[signalName] = batchItem.value;
                        }

                        if (Array.isArray(signals[template.dataSourceName])) {

                            // Generate diagram text from template and data
                            const diagramText = dataToDiagram(template, signals[template.dataSourceName] as object[], tokens, signals);

                            if (diagramText && mermaidInstance.lastRenderedDiagram !== diagramText) {
                                // Broadcast the generated Mermaid text if variableId is specified
                                if (spec.variableId) {
                                    signalBus.broadcast(mermaidInstance.id, {
                                        [spec.variableId]: {
                                            value: diagramText,
                                            isData: false,
                                        }
                                    });
                                }
                            }

                            if (diagramText && mermaidInstance.lastRenderedDiagram !== diagramText) {
                                await renderRawDiagram(mermaidInstance.id, mermaidInstance.container, diagramText, errorHandler, pluginName, index);
                                mermaidInstance.lastRenderedDiagram = diagramText;
                            }
                        } else {
                            mermaidInstance.container.innerHTML = '<div class="error">No data available to render diagram</div>';
                        }

                    } else if (variableId && batch[variableId]) {
                        const value = batch[variableId].value;

                        if (typeof value === 'string' && value.trim().length > 0) {
                            // Render raw Mermaid text from variable
                            await renderRawDiagram(mermaidInstance.id, mermaidInstance.container, value, errorHandler, pluginName, index);
                            mermaidInstance.lastRenderedDiagram = value;
                        } else {
                            // Clear container if variable is empty
                            mermaidInstance.container.innerHTML = '<div class="error">No diagram to display</div>';
                        }

                    }
                }

            };
        });

        return instances;
    },
};

function isValidMermaid(diagramText: string) {
    // string must contain at least one carriage return and text after the first carriage return
    const lines = diagramText.split('\n');
    return lines.length > 1 && lines[1].trim().length > 0;
}

async function renderRawDiagram(id: string, container: Element, diagramText: string, errorHandler: ErrorHandler, pluginName: string, index: number) {
    if (typeof mermaid === 'undefined') {
        await loadMermaidFromCDN();
    }

    if (typeof mermaid === 'undefined') {
        container.innerHTML = '<div class="error">Mermaid library not loaded dynamically</div>';
        return;
    }

    if (!isValidMermaid(diagramText)) {
        container.innerHTML = '<div class="error">Invalid Mermaid diagram format</div>';
        return;
    }

    try {
        const { svg } = await mermaid.render(id, diagramText);
        container.innerHTML = svg;
    } catch (error) {
        container.innerHTML = `<div class="error">Failed to render diagram ${id} <pre>${diagramText}</pre></div>`;
        errorHandler(error instanceof Error ? error : new Error(String(error)), pluginName, index, 'render', container);
        // Clean up temporary dmermaid-* divs by id
        document.querySelectorAll('div[id^="dmermaid-"]').forEach(el => el.remove());
    }
}

function dataToDiagram(template: MermaidTemplate, data: object[], tokens: TemplateToken[], signals: Record<string, string>) {
    const lines: string[] = [];

    const parts: string[] = [];
    tokens.forEach(token => {
        if (token.type === 'literal') {
            parts.push(token.value);
        } else if (token.type === 'variable') {
            const signalValue = signals[token.name];
            if (signalValue !== undefined) {
                parts.push(encodeURIComponent(signalValue));
            } else {
                //leave variable slot empty
            }
        }
    });
    const header = parts.join('');

    // Add diagram header from template
    lines.push(header);

    for (const item of data) {
        const lineTemplateName = item['lineTemplate'];
        const lineTemplate = template?.lineTemplates?.[lineTemplateName];

        if (!lineTemplate) {
            console.warn(`Template '${lineTemplateName}' not found in lineTemplates`);
            continue;
        }

        // Use tokenizeTemplate to parse placeholders
        const tokens = tokenizeTemplate(lineTemplate);

        // Replace variables with actual values
        let line = '';
        for (const token of tokens) {
            if (token.type === 'literal') {
                line += token.value;
            } else if (token.type === 'variable') {
                const value = item[token.name];

                //TODO: get signal values outside of the row from signal bus

                if (value !== undefined) {
                    line += String(value);
                }
                // If value is undefined, we leave the placeholder empty (could also leave the original {{var}} if preferred)
            }
        }

        lines.push(line);
    }

    const diagramText = lines.join('\n');
    return diagramText;
}
