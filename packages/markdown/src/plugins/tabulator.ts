/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Batch, IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { Tabulator as TabulatorType, Options as TabulatorOptions } from 'tabulator-tables';
import { newId, pluginClassName } from './util.js';
import { TabulatorElementProps } from '@microsoft/chartifact-schema';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface TabulatorInstance {
    id: string;
    spec: TabulatorSpec;
    container: Element;
    table: TabulatorType;
    built: boolean;
    selectableRows: boolean;
    listening: boolean;
}

export interface TabulatorSpec extends TabulatorElementProps {
    tabulatorOptions?: TabulatorOptions;    //recast the default with strong typing
}

declare const Tabulator: typeof TabulatorType;

export function inspectTabulatorSpec(spec: TabulatorSpec) {
    //TODO inspect spec for flags, such as http:// instead of https://, or other security issues
    const flaggableSpec: RawFlaggableSpec<TabulatorSpec> = {
        spec,
    };
    return flaggableSpec;
}

const pluginName: PluginNames = 'tabulator';
const className = pluginClassName(pluginName);

export const tabulatorPlugin: Plugin<TabulatorSpec> = {
    ...flaggablePlugin<TabulatorSpec>(pluginName, className, inspectTabulatorSpec, { style: 'box-sizing: border-box;' }),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const tabulatorInstances: TabulatorInstance[] = [];

        // Generate a unique field name for the delete column, used for all tables in this hydration
        const deleteFieldname = newId();

        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);
            if (!container) {
                continue;
            }

            const spec: TabulatorSpec = specReview.approvedSpec;
            const buttons = spec.editable
                ? `<div class="tabulator-buttons">
                        <button type="button" class="tabulator-add-row">Add Row</button>
                        <button type="button" class="tabulator-reset">Reset</button>
                   </div>`
                : '';

            container.innerHTML = `<div class="tabulator-parent">
                <div class="tabulator-nested"></div>
                ${buttons}
            </div>`;
            const nestedDiv = container.querySelector('.tabulator-nested');

            if (!Tabulator && index === 0) {
                errorHandler(new Error('Tabulator not found'), pluginName, index, 'init', container);
                continue;
            }

            if (!spec.dataSourceName) {
                errorHandler(new Error('Tabulator requires dataSourceName'), pluginName, index, 'init', container);
                continue;
            } else if (spec.dataSourceName === spec.variableId) {
                errorHandler(new Error('Tabulator dataSourceName and variableId cannot be the same'), pluginName, index, 'init', container);
                continue;
            }

            let options: TabulatorOptions = {
                autoColumns: true,
                layout: 'fitColumns',
                maxHeight: '200px',
            };

            //see if default options is an object with no properties
            if (spec.tabulatorOptions && Object.keys(spec.tabulatorOptions).length > 0) {
                options = spec.tabulatorOptions;
            }

            const selectableRows = !!options?.selectableRows || false;
            if (spec.editable && selectableRows) {
                delete options.selectableRows; //remove selectableRows from options if editable
            }

            const table = new Tabulator(nestedDiv as HTMLElement, options);

            const tabulatorInstance: TabulatorInstance = {
                id: `${pluginName}-${index}`,
                spec,
                container,
                table,
                built: false,
                selectableRows,
                listening: false,
            };
            table.on('tableBuilt', () => {
                table.off('tableBuilt');
                tabulatorInstance.built = true;
            });
            tabulatorInstances.push(tabulatorInstance);
        }
        const instances = tabulatorInstances.map((tabulatorInstance, index): IInstance => {
            const { container, spec, table, selectableRows } = tabulatorInstance;
            const initialSignals = [{
                name: spec.dataSourceName,
                value: null,
                priority: -1,
                isData: true,
            }];
            if (selectableRows || spec.editable) {
                initialSignals.push({
                    name: spec.variableId,
                    value: [],
                    priority: -1,
                    isData: true,
                });
            }

            const outputData = () => {
                if (!spec.variableId) {
                    return;
                }
                let data: object[];
                if (selectableRows) {
                    data = table.getSelectedData();
                } else {
                    data = table.getData();
                }

                //remove the delete column if it exists
                data.forEach(row => {
                    delete row[deleteFieldname];
                });

                const batch: Batch = {
                    [spec.variableId]: {
                        value: data,
                        isData: true,
                    },
                };
                signalBus.log(tabulatorInstance.id, 'sending batch', batch);
                signalBus.broadcast(tabulatorInstance.id, batch);
            }

            const setData = (_data: object[]) => {

                // Use structuredClone to ensure deep copy
                // vega may efficiently have symbols on data to cache a datum's values
                // so this needs to appear to be new data
                const data = structuredClone(_data);

                table.setData(data).then(() => {

                    // Get current column definitions
                    let columns = table.getColumnDefinitions()
                        .filter(cd => cd.field !== deleteFieldname)
                        .filter(cd => cd.formatter !== 'rowSelection');

                    if (spec.editable) {

                        //inject a column at the beginning for delete
                        columns.unshift({
                            headerSort: false,
                            title: "Delete",
                            field: deleteFieldname,
                            titleFormatter: 'tickCross',
                            width: 40,
                            formatter: "tickCross",
                            cellClick: (e, cell) => {
                                cell.getRow().delete();
                                outputData();
                            }
                        });

                        columns = columns.map(col => {
                            // Only set editor if not already defined
                            if (col.editor === undefined) {
                                // Prefer explicit type, fallback to sorter
                                const type = (col as any).type || col.sorter;
                                if (type === "number") {
                                    return { ...col, editor: "number" };
                                }
                                if (type === "date" || type === "datetime") {
                                    return { ...col, editor: "date" };
                                }
                                if (type === "boolean") {
                                    return { ...col, editor: "tickCross" };
                                }
                                // Add more types as needed
                                return { ...col, editor: "input" };
                            }
                            return col;
                        });
                    }
                    table.setColumns(columns);

                    if (tabulatorInstance.listening) {
                        outputData();
                    }

                }).catch((error) => {
                    console.error(`Error setting data for Tabulator ${spec.variableId}:`, error);
                    // errorHandler(error, pluginName, index, 'setData', container);
                });
            };

            if (spec.editable) {
                const addRowBtn = container.querySelector('.tabulator-add-row') as HTMLButtonElement;
                const resetBtn = container.querySelector('.tabulator-reset') as HTMLButtonElement;

                if (addRowBtn) {
                    addRowBtn.onclick = () => {
                        table.addRow({}).then((row) => {
                            row.scrollTo();
                        });
                    };
                }
                if (resetBtn) {
                    resetBtn.onclick = () => {
                        const value = signalBus.signalDeps[spec.dataSourceName].value;
                        if (Array.isArray(value)) {
                            setData(value);
                        }
                    };
                }
            }

            return {
                ...tabulatorInstance,
                initialSignals,
                receiveBatch: async (batch, from) => {
                    const newData = batch[spec.dataSourceName]?.value as object[];
                    if (newData) {
                        //make sure tabulator is ready before setting data
                        if (!tabulatorInstance.built) {
                            table.off('tableBuilt');
                            table.on('tableBuilt', () => {
                                tabulatorInstance.built = true;
                                table.off('tableBuilt');
                                setData(newData);
                            });
                        } else {
                            setData(newData);
                        }
                    }
                },
                beginListening(sharedSignals) {
                    tabulatorInstance.listening = true;
                    if (tabulatorInstance.built) {
                        outputData();
                    }
                    if (selectableRows) {
                        const hasMatchingSignal = sharedSignals.some(({ isData, signalName }) =>
                            isData && signalName === spec.variableId
                        );

                        if (hasMatchingSignal) {
                            table.on('rowSelectionChanged', (e, rows) => {
                                outputData();
                            });
                        }
                    }
                    if (spec.editable) {
                        table.on('cellEdited', (cell) => {
                            outputData();
                        });
                        table.on('rowMoved', (row) => {
                            outputData();
                        });
                    }
                },
                getCurrentSignalValue() {
                    if (selectableRows) {
                        return tabulatorInstance.table.getSelectedData();
                    } else {
                        // When editable, return all data since that's what gets broadcast
                        return tabulatorInstance.table.getData();
                    }
                },
                destroy: () => {
                    tabulatorInstance.table.destroy();
                },
            };
        });
        return instances;
    },
};
