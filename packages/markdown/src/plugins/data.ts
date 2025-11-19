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
import * as yaml from 'js-yaml';

interface JsonDataInstance {
    id: string;
    spec: JsonDataSpec;
    data: object[];
}

export interface JsonDataSpec {
    variableId: string;
    wasDefaultId?: boolean;
}

function inspectJsonDataSpec(spec: JsonDataSpec): RawFlaggableSpec<JsonDataSpec> {
    const result: RawFlaggableSpec<JsonDataSpec> = {
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

const pluginName: PluginNames = 'data';
const className = pluginClassName(pluginName);

export const dataPlugin: Plugin<JsonDataSpec> = {
    name: pluginName,
    fence: (token, index) => {
        const content = token.content.trim();
        const info = token.info.trim();
        
        // Parse the fence info - expect "json data variableId" or "yaml data variableId" format
        // The factory.ts will route "json data ..." or "yaml data ..." to this plugin
        const parts = info.split(/\s+/);
        
        // Check for variable ID (should be after "json data" or "yaml data")
        let variableId: string;
        let wasDefaultId = false;
        let isYaml = false;
        
        if (parts.length >= 3 && (parts[0] === 'json' || parts[0] === 'yaml') && parts[1] === 'data') {
            // Format: json data variableId or yaml data variableId
            variableId = parts[2];
            isYaml = parts[0] === 'yaml';
        } else if (parts.length >= 2 && (parts[0] === 'json' || parts[0] === 'yaml') && parts[1] === 'data') {
            // Format: json data or yaml data (no variable ID provided)
            variableId = `${parts[0]}Data${index}`;
            wasDefaultId = true;
            isYaml = parts[0] === 'yaml';
        } else {
            // Not the expected format
            return '';
        }
        
        // Use script tag with application/json type for storage
        // Note: We store both JSON and YAML data as JSON in the script tag
        const scriptElement = sanitizedScriptTag(content, {
            id: `${pluginName}-${index}`,
            class: className,
            'data-variable-id': variableId,
            'data-was-default-id': wasDefaultId.toString(),
            'data-format': isYaml ? 'yaml' : 'json'
        });
        
        return scriptElement.outerHTML;
    },
    hydrateSpecs: (renderer, errorHandler) => {
        const flagged: SpecReview<JsonDataSpec>[] = [];
        const containers = renderer.element.querySelectorAll(`.${className}`);
        
        for (const [index, container] of Array.from(containers).entries()) {
            try {
                const variableId = container.getAttribute('data-variable-id');
                const wasDefaultId = container.getAttribute('data-was-default-id') === 'true';
                
                if (!variableId) {
                    errorHandler(new Error('No variable ID found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: JsonDataSpec = { variableId, wasDefaultId };
                const flaggableSpec = inspectJsonDataSpec(spec);
                
                const f: SpecReview<JsonDataSpec> = { 
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
        const jsonInstances: JsonDataInstance[] = [];

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
                    errorHandler(new Error('No data content found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: JsonDataSpec = specReview.approvedSpec;
                const format = container.getAttribute('data-format') || 'json';
                
                // Parse JSON or YAML content
                let data: object[];
                try {
                    let parsed: any;
                    
                    if (format === 'yaml') {
                        // Parse YAML
                        parsed = yaml.load(content);
                    } else {
                        // Parse JSON
                        parsed = JSON.parse(content);
                    }
                    
                    // Ensure data is an array
                    if (Array.isArray(parsed)) {
                        data = parsed;
                    } else {
                        // If it's a single object, wrap it in an array
                        data = [parsed];
                    }
                } catch (parseError) {
                    errorHandler(
                        new Error(`Invalid ${format.toUpperCase()}: ${parseError instanceof Error ? parseError.message : String(parseError)}`), 
                        pluginName, 
                        index, 
                        'parse', 
                        container
                    );
                    continue;
                }
                
                const jsonInstance: JsonDataInstance = { 
                    id: `${pluginName}-${index}`, 
                    spec, 
                    data 
                };
                jsonInstances.push(jsonInstance);
                
                // Add a safe comment before the container to show that data was loaded
                const comment = sanitizeHtmlComment(`${format.toUpperCase()} data loaded: ${data.length} rows for variable '${spec.variableId}'`);
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
