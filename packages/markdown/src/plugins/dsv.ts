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
import { parseFenceInfo } from './config.js';

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
 * Utility function to parse DSV fence info.
 * Supports formats like:
 * - "dsv products delimiter:|"
 * - "dsv delimiter:| variableId:products"
 * - "dsv delimiter: | variableId: products"
 * @param info The fence info string
 * @param pluginName The plugin name (csv, tsv, dsv)
 * @param index The fence index for default naming
 * @returns Object with variableId, delimiter, and flags
 */
export function parseDsvInfo(info: string, pluginName: string, index: number): {
    variableId: string;
    delimiter: string;
    wasDefaultId: boolean;
    wasDefaultDelimiter: boolean;
} {
    const { params, wasDefaultId } = parseFenceInfo(info);
    
    // Get variableId (already handled by parseFenceInfo)
    const variableId = params.get('variableId') || `${pluginName}Data${index}`;
    
    // Get delimiter from parameter or use default
    let delimiter = params.get('delimiter') || ',';
    const wasDefaultDelimiter = !params.has('delimiter');
    
    // Handle special delimiter characters
    if (delimiter === '\\t') delimiter = '\t';
    if (delimiter === '\\n') delimiter = '\n';
    if (delimiter === '\\r') delimiter = '\r';
    
    return {
        variableId,
        delimiter,
        wasDefaultId,
        wasDefaultDelimiter
    };
}

/**
 * Utility function to parse variable ID from fence info.
 * Used by CSV and TSV plugins.
 * @param info The fence info string (e.g., "csv myData" or "csv variableId:myData")
 * @param pluginName The plugin name (csv, tsv, dsv)
 * @param index The fence index for default naming
 * @returns Object with variableId and wasDefaultId flag
 */
export function parseVariableId(info: string, pluginName: string, index: number): { variableId: string; wasDefaultId: boolean } {
    const result = parseDsvInfo(info, pluginName, index);
    return {
        variableId: result.variableId,
        wasDefaultId: result.wasDefaultId
    };
}

function inspectDsvSpec(spec: DsvSpec): RawFlaggableSpec<DsvSpec> {
    const result: RawFlaggableSpec<DsvSpec> = {
        spec,
        hasFlags: false,
        reasons: []
    };

    // Only flag if we had to use default variable ID
    // Using default delimiter (comma) is fine and shouldn't be flagged
    if (spec.wasDefaultId) {
        result.hasFlags = true;
        result.reasons.push('No variable ID specified - using default');
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
        
        // Parse both delimiter and variable ID in one pass
        const { variableId, delimiter, wasDefaultId, wasDefaultDelimiter } = parseDsvInfo(info, 'dsv', index);
        
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
