/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import { read } from 'vega';
import { Batch, IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { sanitizeHtmlComment } from '../sanitize.js';
import { pluginClassName } from './util.js';
import { PluginNames } from './interfaces.js';
import { DynamicUrl } from './url.js';
import { flaggablePlugin } from './config.js';

interface FetchInstance {
    id: string;
    spec: FetchSpec;
    data: object[] | null;
    dynamicUrl: DynamicUrl | null;
    container: Element;
    errorHandler: (error: Error) => void;
}

export interface FetchSpec {
    variableId: string;
    url: string;
    format?: 'json' | 'csv' | 'tsv' | 'dsv';
    delimiter?: string;
}

function inspectFetchSpec(spec: FetchSpec): RawFlaggableSpec<FetchSpec> {
    const result: RawFlaggableSpec<FetchSpec> = {
        spec,
        hasFlags: false,
        reasons: []
    };

    // Check for http:// (should use https://)
    if (spec.url && spec.url.includes('http://') && !spec.url.includes('{{')) {
        result.hasFlags = true;
        result.reasons.push('URL uses http:// instead of https://');
    }

    // Check for required fields
    if (!spec.url) {
        result.hasFlags = true;
        result.reasons.push('URL is required');
    }

    if (!spec.variableId) {
        result.hasFlags = true;
        result.reasons.push('variableId is required');
    }

    return result;
}

const pluginName: PluginNames = 'fetch';
const className = pluginClassName(pluginName);

export const fetchPlugin: Plugin<FetchSpec> = {
    ...flaggablePlugin<FetchSpec>(pluginName, className, inspectFetchSpec),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const fetchInstances: FetchInstance[] = [];

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

            const spec: FetchSpec = specReview.approvedSpec;
            
            const fetchInstance: FetchInstance = {
                id: `${pluginName}-${index}`,
                spec,
                data: null,
                dynamicUrl: null,
                container,
                errorHandler: (error) => {
                    errorHandler(error, pluginName, index, 'fetch', container, spec.url);
                }
            };
            
            fetchInstances.push(fetchInstance);
        }

        const instances = fetchInstances.map((fetchInstance): IInstance => {
            const { spec, id } = fetchInstance;
            
            // Function to fetch data from URL
            const fetchData = async (url: string) => {
                if (!url || url.includes('{{')) {
                    // URL still has unresolved variables
                    return;
                }
                
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    let data: object[];
                    
                    if (spec.format === 'json') {
                        const jsonData = await response.json();
                        data = Array.isArray(jsonData) ? jsonData : [jsonData];
                    } else {
                        const text = await response.text();
                        // Use vega's read function to parse CSV/TSV/DSV
                        const formatType = spec.format === 'dsv' ? 'dsv' : spec.format;
                        const delimiter = spec.format === 'dsv' ? spec.delimiter : 
                                         spec.format === 'tsv' ? '\t' : ',';
                        data = read(text, { type: formatType, delimiter });
                    }
                    
                    fetchInstance.data = data;
                    
                    // Broadcast the data
                    const batch: Batch = {
                        [spec.variableId]: {
                            value: data,
                            isData: true,
                        },
                    };
                    signalBus.broadcast(id, batch);
                    
                    // Add a comment to show data was loaded
                    const comment = sanitizeHtmlComment(`Fetch data loaded: ${data.length} rows for variable '${spec.variableId}' from ${url}`);
                    fetchInstance.container.insertAdjacentHTML('afterbegin', comment);
                    
                } catch (e) {
                    fetchInstance.errorHandler(e instanceof Error ? e : new Error(String(e)));
                }
            };
            
            // Check if URL has variables
            if (spec.url.includes('{{')) {
                // Dynamic URL - set up DynamicUrl handler
                fetchInstance.dynamicUrl = new DynamicUrl(spec.url, (resolvedUrl) => {
                    fetchData(resolvedUrl);
                });
            } else {
                // Static URL - fetch immediately
                fetchData(spec.url);
            }
            
            const signalNames = Object.keys(fetchInstance.dynamicUrl?.signals || {});
            
            return {
                id,
                initialSignals: signalNames.map(name => ({
                    name,
                    value: null,
                    priority: -1,
                    isData: false,
                })),
                receiveBatch: async (batch, from) => {
                    fetchInstance.dynamicUrl?.receiveBatch(batch);
                },
                beginListening() {
                    // If we have data already, broadcast it
                    if (fetchInstance.data) {
                        const batch: Batch = {
                            [spec.variableId]: {
                                value: fetchInstance.data,
                                isData: true,
                            },
                        };
                        signalBus.broadcast(id, batch);
                    }
                },
                getCurrentSignalValue: () => {
                    return fetchInstance.data;
                },
                destroy: () => {
                    // No cleanup needed
                },
            };
        });
        
        return instances;
    },
};
