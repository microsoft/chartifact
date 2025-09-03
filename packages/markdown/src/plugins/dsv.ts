/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { read } from 'vega';
import { Batch, IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { sanitizedHTML, sanitizeHtmlComment } from '../sanitize.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { SpecReview } from 'common';

interface DsvInstance {
    id: string;
    spec: DsvSpec;
    data: object[];
}

export interface DsvSpec {
    variableId: string;
    delimiter: string;
    wasDefaultId?: boolean;
    wasDefaultDelimiter?: boolean;
}

/**
 * Utility function to parse variable ID from fence info.
 * Supports both "pluginName variableId" and "pluginName variableId:name" formats.
 * @param info The fence info string (e.g., "csv myData" or "csv variableId:myData")
 * @param pluginName The plugin name (csv, tsv, dsv)
 * @param index The fence index for default naming
 * @returns Object with variableId and wasDefaultId flag
 */
export function parseVariableId(info: string, pluginName: string, index: number): { variableId: string; wasDefaultId: boolean } {
    const parts = info.trim().split(/\s+/);
    
    // Check for explicit variableId: parameter
    for (const part of parts) {
        if (part.startsWith('variableId:')) {
            return { 
                variableId: part.slice(11).trim(), // Remove 'variableId:' prefix and trim spaces
                wasDefaultId: false 
            };
        }
    }
    
    // Check for direct format (second parameter that's not a special parameter)
    if (parts.length >= 2) {
        const secondPart = parts[1];
        if (!secondPart.startsWith('delimiter:') && !secondPart.startsWith('variableId:')) {
            return { 
                variableId: secondPart, 
                wasDefaultId: false 
            };
        }
    }
    
    // Default variable ID
    return { 
        variableId: `${pluginName}Data${index}`, 
        wasDefaultId: true 
    };
}

/**
 * Utility function to parse delimiter from fence info.
 * @param info The fence info string (e.g., "dsv delimiter:| variableId:myData")
 * @returns Object with delimiter and wasDefaultDelimiter flag
 */
export function parseDelimiter(info: string): { delimiter: string; wasDefaultDelimiter: boolean } {
    const parts = info.trim().split(/\s+/);
    
    for (const part of parts) {
        if (part.startsWith('delimiter:')) {
            let delimiter = part.slice(10).trim(); // Remove 'delimiter:' prefix and trim spaces
            // Handle special cases
            if (delimiter === '\\t') delimiter = '\t';
            if (delimiter === '\\n') delimiter = '\n';
            if (delimiter === '\\r') delimiter = '\r';
            return { delimiter, wasDefaultDelimiter: false };
        }
    }
    
    // Default to comma
    return { delimiter: ',', wasDefaultDelimiter: true };
}

function inspectDsvSpec(spec: DsvSpec): RawFlaggableSpec<DsvSpec> {
    const result: RawFlaggableSpec<DsvSpec> = {
        spec,
        hasFlags: false,
        reasons: []
    };

    // Flag if we had to use defaults
    if (spec.wasDefaultId) {
        result.hasFlags = true;
        result.reasons.push('No variable ID specified - using default');
    }
    
    if (spec.wasDefaultDelimiter) {
        result.hasFlags = true;
        result.reasons.push('No delimiter specified - using default comma');
    }
    
    return result;
}

const pluginName: PluginNames = 'dsv';
const className = pluginClassName(pluginName);

export const dsvPlugin: Plugin<DsvSpec> = {
    name: pluginName,
    fence: (token, index) => {
        const content = token.content.trim();
        const info = token.info.trim();
        
        // Use utility functions to parse delimiter and variable ID
        const { delimiter, wasDefaultDelimiter } = parseDelimiter(info);
        const { variableId, wasDefaultId } = parseVariableId(info, 'dsv', index);
        
        return sanitizedHTML('pre', { 
            id: `${pluginName}-${index}`, 
            class: className,
            style: 'display:none',
            'data-variable-id': variableId,
            'data-delimiter': delimiter,
            'data-was-default-id': wasDefaultId.toString(),
            'data-was-default-delimiter': wasDefaultDelimiter.toString()
        }, content, false);
    },
    hydrateSpecs: (renderer, errorHandler) => {
        const flagged: SpecReview<DsvSpec>[] = [];
        const containers = renderer.element.querySelectorAll(`.${className}`);
        
        for (const [index, container] of Array.from(containers).entries()) {
            try {
                const variableId = container.getAttribute('data-variable-id');
                const delimiter = container.getAttribute('data-delimiter');
                const wasDefaultId = container.getAttribute('data-was-default-id') === 'true';
                const wasDefaultDelimiter = container.getAttribute('data-was-default-delimiter') === 'true';
                
                if (!variableId) {
                    errorHandler(new Error('No variable ID found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                if (!delimiter) {
                    errorHandler(new Error('No delimiter found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: DsvSpec = { variableId, delimiter, wasDefaultId, wasDefaultDelimiter };
                const flaggableSpec = inspectDsvSpec(spec);
                
                const f: SpecReview<DsvSpec> = { 
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
        const dsvInstances: DsvInstance[] = [];

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
                    errorHandler(new Error('No DSV content found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const spec: DsvSpec = specReview.approvedSpec;
                
                // Parse content using vega.read with the specified delimiter
                const data = read(content, { type: 'dsv', delimiter: spec.delimiter });
                
                const dsvInstance: DsvInstance = { 
                    id: `${pluginName}-${index}`, 
                    spec, 
                    data 
                };
                dsvInstances.push(dsvInstance);
                
                // Add a safe comment before the container to show that data was loaded
                const delimiterName = spec.delimiter === ',' ? 'CSV' : 
                                    spec.delimiter === '\t' ? 'TSV' : 
                                    `DSV (delimiter: '${spec.delimiter}')`;
                const comment = sanitizeHtmlComment(`${delimiterName} data loaded: ${data.length} rows for variable '${spec.variableId}'`);
                container.insertAdjacentHTML('beforebegin', comment);
                
            } catch (e) {
                errorHandler(e instanceof Error ? e : new Error(String(e)), pluginName, index, 'parse', container);
            }
        }

        const instances = dsvInstances.map((dsvInstance): IInstance => {
            const { spec, data } = dsvInstance;
            
            const initialSignals = [{
                name: spec.variableId,
                value: data,
                priority: 1,
                isData: true,
            }];

            return {
                ...dsvInstance,
                initialSignals,
                beginListening() {
                    // DSV data is static, but we broadcast it when listening begins
                    const batch: Batch = {
                        [spec.variableId]: {
                            value: data,
                            isData: true,
                        },
                    };
                    signalBus.broadcast(dsvInstance.id, batch);
                },
                getCurrentSignalValue: () => {
                    return data;
                },
                destroy: () => {
                    // No cleanup needed for DSV data
                },
            };
        });
        
        return instances;
    },
};
