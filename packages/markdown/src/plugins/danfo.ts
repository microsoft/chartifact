/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Batch, IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { newId, pluginClassName } from './util.js';
import { DanfoElementProps } from '@microsoft/chartifact-schema';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface DanfoInstance {
    id: string;
    spec: DanfoSpec;
    container: Element;
    listening: boolean;
    currentResult: object[] | null;
}

export interface DanfoSpec extends DanfoElementProps {
}

// Declare the global dfd object from danfojs
declare const dfd: any;

export function inspectDanfoSpec(spec: DanfoSpec) {
    const flaggableSpec: RawFlaggableSpec<DanfoSpec> = {
        spec,
    };
    return flaggableSpec;
}

const pluginName: PluginNames = 'danfo';
const className = pluginClassName(pluginName);

export const danfoPlugin: Plugin<DanfoSpec> = {
    ...flaggablePlugin<DanfoSpec>(pluginName, className, inspectDanfoSpec, { style: 'box-sizing: border-box;' }),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const danfoInstances: DanfoInstance[] = [];

        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);
            if (!container) {
                continue;
            }

            const spec: DanfoSpec = specReview.approvedSpec;
            
            if (typeof dfd === 'undefined' && index === 0) {
                errorHandler(new Error('Danfo.js library not found'), pluginName, index, 'init', container);
                continue;
            }

            if (!spec.dataSourceName) {
                errorHandler(new Error('Danfo requires dataSourceName'), pluginName, index, 'init', container);
                continue;
            } else if (spec.dataSourceName === spec.variableId) {
                errorHandler(new Error('Danfo dataSourceName and variableId cannot be the same'), pluginName, index, 'init', container);
                continue;
            }

            if (!spec.variableId) {
                errorHandler(new Error('Danfo requires variableId for output'), pluginName, index, 'init', container);
                continue;
            }

            // Create a simple status display
            container.innerHTML = `<div class="danfo-status">Danfo transformation ready (${spec.operation})</div>`;

            const danfoInstance: DanfoInstance = {
                id: `${pluginName}-${index}`,
                spec,
                container,
                listening: false,
                currentResult: null,
            };
            danfoInstances.push(danfoInstance);
        }

        const instances = danfoInstances.map((danfoInstance, index): IInstance => {
            const { spec } = danfoInstance;
            const initialSignals = [{
                name: spec.dataSourceName,
                value: null,
                priority: -1,
                isData: true,
            }];
            
            if (spec.variableId) {
                initialSignals.push({
                    name: spec.variableId,
                    value: [],
                    priority: -1,
                    isData: true,
                });
            }

            const performTransformation = (data: object[]) => {
                if (!data || data.length === 0) {
                    return null;
                }

                try {
                    // Create a DataFrame from the input data
                    const df = new dfd.DataFrame(data);
                    let result: any;

                    // Perform the specified operation
                    switch (spec.operation) {
                        case 'corr': {
                            // Correlation matrix
                            const corrDf = df.corr();
                            // Convert to array of objects for output
                            const values = corrDf.values;
                            const columns = corrDf.columns;
                            const index = corrDf.index;
                            
                            result = index.map((rowName: string, i: number) => {
                                const row: any = { index: rowName };
                                columns.forEach((colName: string, j: number) => {
                                    row[colName] = values[i][j];
                                });
                                return row;
                            });
                            break;
                        }
                        
                        case 'describe': {
                            // Descriptive statistics
                            const descDf = df.describe();
                            const values = descDf.values;
                            const columns = descDf.columns;
                            const index = descDf.index;
                            
                            result = index.map((rowName: string, i: number) => {
                                const row: any = { statistic: rowName };
                                columns.forEach((colName: string, j: number) => {
                                    row[colName] = values[i][j];
                                });
                                return row;
                            });
                            break;
                        }
                        
                        case 'groupby': {
                            // Group by operation requires config
                            const config = spec.operationConfig as any;
                            if (!config || !config.by) {
                                throw new Error('groupby requires operationConfig with "by" field');
                            }
                            // For now, just pass through - full groupby would need aggregation config
                            result = data;
                            break;
                        }
                        
                        case 'sortValues': {
                            // Sort values
                            const config = spec.operationConfig as any;
                            if (!config || !config.by) {
                                throw new Error('sortValues requires operationConfig with "by" field');
                            }
                            const ascending = config.ascending !== false; // default to true
                            const sortedDf = df.sortValues(config.by, { ascending });
                            result = dfd.toJSON(sortedDf);
                            break;
                        }
                        
                        default:
                            throw new Error(`Unknown operation: ${spec.operation}`);
                    }

                    return result;
                } catch (error) {
                    errorHandler(error as Error, pluginName, index, 'transform', danfoInstance.container);
                    return null;
                }
            };

            const outputData = () => {
                if (!spec.variableId || !danfoInstance.currentResult) {
                    return;
                }

                const batch: Batch = {
                    [spec.variableId]: {
                        value: danfoInstance.currentResult,
                        isData: true,
                    },
                };
                signalBus.log(danfoInstance.id, 'sending batch', batch);
                signalBus.broadcast(danfoInstance.id, batch);
            };

            return {
                ...danfoInstance,
                initialSignals,
                receiveBatch: async (batch, from) => {
                    const newData = batch[spec.dataSourceName]?.value as object[];
                    if (newData) {
                        const result = performTransformation(newData);
                        if (result) {
                            danfoInstance.currentResult = result;
                            if (danfoInstance.listening) {
                                outputData();
                            }
                        }
                    }
                },
                beginListening(sharedSignals) {
                    danfoInstance.listening = true;
                    if (danfoInstance.currentResult) {
                        outputData();
                    }
                },
                getCurrentSignalValue() {
                    return danfoInstance.currentResult;
                },
                destroy: () => {
                    // Nothing to destroy for Danfo
                },
            };
        });
        return instances;
    },
};
