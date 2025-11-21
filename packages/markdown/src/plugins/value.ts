/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Batch, IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { sanitizedScriptTag, sanitizeHtmlComment } from '../sanitize.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { SpecReview } from 'common';
import { parseFenceInfo } from './config.js';
import * as yaml from 'js-yaml';

interface ValueInstance {
    id: string;
    spec: ValueSpec;
    data: object[];
}

export interface ValueSpec {
    variableId: string;
    wasDefaultId?: boolean;
}

function inspectValueSpec(spec: ValueSpec): RawFlaggableSpec<ValueSpec> {
    const result: RawFlaggableSpec<ValueSpec> = {
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

const pluginName: PluginNames = 'value';
const className = pluginClassName(pluginName);

export const valuePlugin: Plugin<ValueSpec> = {
    name: pluginName,
    fence: (token, index) => {
        const content = token.content.trim();
        const info = token.info.trim();
        
        // Parse fence info
        const { format, pluginName: parsedPluginName, params, wasDefaultId } = parseFenceInfo(info);
        
        // If pluginName isn't "value" AND isn't empty AND no explicit variableId, 
        // it's actually the variableId (e.g., "json inventory")
        let variableId: string;
        let actualWasDefaultId: boolean;
        
        if (parsedPluginName && parsedPluginName !== pluginName && !params.has('variableId')) {
            // The parsed plugin name is actually the variableId
            variableId = parsedPluginName;
            actualWasDefaultId = false;
        } else {
            // Normal case: get variableId from params or use default
            variableId = params.get('variableId') || `${format}Value${index}`;
            actualWasDefaultId = wasDefaultId;
        }
        
        // Use script tag with application/json type for storage
        const scriptElement = sanitizedScriptTag(content, {
            id: `${pluginName}-${index}`,
            class: className,
            'data-variable-id': variableId,
            'data-was-default-id': actualWasDefaultId.toString(),
            'data-format': format
        });
        
        return scriptElement.outerHTML;
    },
    hydrateSpecs: (renderer, errorHandler) => {
        const flagged: SpecReview<ValueSpec>[] = [];
        const containers = renderer.element.querySelectorAll(`.${className}`);
        
        for (const [index, container] of Array.from(containers).entries()) {
            try {
                const variableId = container.getAttribute('data-variable-id');
                const wasDefaultId = container.getAttribute('data-was-default-id') === 'true';
                
                if (!variableId) {
                    errorHandler(new Error('No variable ID found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: ValueSpec = { variableId, wasDefaultId };
                const flaggableSpec = inspectValueSpec(spec);
                
                const f: SpecReview<ValueSpec> = { 
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
        const valueInstances: ValueInstance[] = [];

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
                    errorHandler(new Error('No value content found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: ValueSpec = specReview.approvedSpec;
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
                
                const valueInstance: ValueInstance = { 
                    id: `${pluginName}-${index}`, 
                    spec, 
                    data 
                };
                valueInstances.push(valueInstance);
                
                // Add a safe comment before the container to show that value was loaded
                const comment = sanitizeHtmlComment(`${format.toUpperCase()} value loaded: ${data.length} rows for variable '${spec.variableId}'`);
                container.insertAdjacentHTML('beforebegin', comment);
                
            } catch (e) {
                errorHandler(e instanceof Error ? e : new Error(String(e)), pluginName, index, 'parse', container);
            }
        }

        const instances = valueInstances.map((valueInstance): IInstance => {
            const { spec, data } = valueInstance;
            
            const initialSignals = [{
                name: spec.variableId,
                value: data,
                priority: 1,
                isData: true,
            }];

            return {
                ...valueInstance,
                initialSignals,
                beginListening() {
                    // Value data is static, but we broadcast it when listening begins
                    const batch: Batch = {
                        [spec.variableId]: {
                            value: data,
                            isData: true,
                        },
                    };
                    signalBus.broadcast(valueInstance.id, batch);
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
