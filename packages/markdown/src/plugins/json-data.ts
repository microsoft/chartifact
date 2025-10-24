/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Batch, IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { sanitizedScriptTag, sanitizeHtmlComment } from '../sanitize.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { SpecReview } from 'common';
import { parseVariableId } from './dsv.js';

interface JsonInstance {
    id: string;
    spec: JsonSpec;
    data: object[];
}

export interface JsonSpec {
    variableId: string;
    wasDefaultId?: boolean;
}

function inspectJsonSpec(spec: JsonSpec): RawFlaggableSpec<JsonSpec> {
    const result: RawFlaggableSpec<JsonSpec> = {
        spec,
        hasFlags: false,
        reasons: []
    };

    // Flag if we had to use defaults
    if (spec.wasDefaultId) {
        result.hasFlags = true;
        result.reasons.push('No variable ID specified - using default');
    }
    
    return result;
}

const pluginName: PluginNames = 'json-data';
const className = pluginClassName(pluginName);

export const jsonDataPlugin: Plugin<JsonSpec> = {
    name: pluginName,
    fence: (token, index) => {
        const content = token.content.trim();
        const info = token.info.trim();
        
        // Parse the fence info - expect "json data variableId" format
        const parts = info.split(/\s+/);
        
        // Require "json data" prefix
        if (parts.length < 2 || parts[0] !== 'json' || parts[1] !== 'data') {
            // This fence is not for json-data plugin
            return '';
        }
        
        // Check for variable ID
        let variableId: string;
        let wasDefaultId = false;
        
        if (parts.length >= 3) {
            // Format: json data variableId
            variableId = parts[2];
        } else {
            // Default variable ID if not provided
            variableId = `jsonData${index}`;
            wasDefaultId = true;
        }
        
        // Use script tag with application/json type instead of pre tag
        const scriptElement = sanitizedScriptTag(content, {
            id: `${pluginName}-${index}`,
            class: className,
            'data-variable-id': variableId,
            'data-was-default-id': wasDefaultId.toString()
        });
        
        return scriptElement.outerHTML;
    },
    hydrateSpecs: (renderer, errorHandler) => {
        const flagged: SpecReview<JsonSpec>[] = [];
        const containers = renderer.element.querySelectorAll(`.${className}`);
        
        for (const [index, container] of Array.from(containers).entries()) {
            try {
                const variableId = container.getAttribute('data-variable-id');
                const wasDefaultId = container.getAttribute('data-was-default-id') === 'true';
                
                if (!variableId) {
                    errorHandler(new Error('No variable ID found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: JsonSpec = { variableId, wasDefaultId };
                const flaggableSpec = inspectJsonSpec(spec);
                
                const f: SpecReview<JsonSpec> = { 
                    approvedSpec: null, 
                    pluginName, 
                    containerId: container.id 
                };
                
                if (flaggableSpec.hasFlags) {
                    f.blockedSpec = flaggableSpec.spec;
                    f.reason = flaggableSpec.reasons?.join(', ') || 'Unknown reason';
                } else {
                    f.approvedSpec = flaggableSpec.spec;
                }
                
                flagged.push(f);
            } catch (e) {
                errorHandler(e instanceof Error ? e : new Error(String(e)), pluginName, index, 'parse', container);
            }
        }
        
        return flagged;
    },
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const jsonInstances: JsonInstance[] = [];

        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            
            const container = renderer.element.querySelector(`#${specReview.containerId}`);
            if (!container) {
                errorHandler(new Error('Container not found'), pluginName, index, 'init', null);
                continue;
            }

            try {
                const content = container.textContent?.trim();
                if (!content) {
                    errorHandler(new Error('No JSON content found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: JsonSpec = specReview.approvedSpec;
                
                // Parse JSON content
                let data: object[];
                try {
                    const parsed = JSON.parse(content);
                    // Ensure data is an array
                    if (Array.isArray(parsed)) {
                        data = parsed;
                    } else {
                        // If it's a single object, wrap it in an array
                        data = [parsed];
                    }
                } catch (jsonError) {
                    errorHandler(
                        new Error(`Invalid JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`), 
                        pluginName, 
                        index, 
                        'parse', 
                        container
                    );
                    continue;
                }
                
                const jsonInstance: JsonInstance = { 
                    id: `${pluginName}-${index}`, 
                    spec, 
                    data 
                };
                jsonInstances.push(jsonInstance);
                
                // Add a safe comment before the container to show that data was loaded
                const comment = sanitizeHtmlComment(`JSON data loaded: ${data.length} rows for variable '${spec.variableId}'`);
                container.insertAdjacentHTML('beforebegin', comment);
                
            } catch (e) {
                errorHandler(e instanceof Error ? e : new Error(String(e)), pluginName, index, 'parse', container);
            }
        }

        const instances = jsonInstances.map((jsonInstance): IInstance => {
            const { spec, data } = jsonInstance;
            
            const initialSignals = [{
                name: spec.variableId,
                value: data,
                priority: 1,
                isData: true,
            }];

            return {
                ...jsonInstance,
                initialSignals,
                beginListening() {
                    // JSON data is static, but we broadcast it when listening begins
                    const batch: Batch = {
                        [spec.variableId]: {
                            value: data,
                            isData: true,
                        },
                    };
                    signalBus.broadcast(jsonInstance.id, batch);
                },
                getCurrentSignalValue: () => {
                    return data;
                },
                destroy: () => {
                    // No cleanup needed for JSON data
                },
            };
        });
        
        return instances;
    },
};
