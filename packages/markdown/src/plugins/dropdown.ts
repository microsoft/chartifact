/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { DropdownElementProps } from '@microsoft/chartifact-schema';
import { Batch, IInstance, Plugin } from '../factory.js';
import { pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface DropdownInstance {
    id: string;
    spec: DropdownSpec;
    element: HTMLSelectElement;
}

export interface DropdownSpec extends DropdownElementProps {
    value?: string | string[];
}

const pluginName: PluginNames = 'dropdown';
const className = pluginClassName(pluginName);

export const dropdownPlugin: Plugin<DropdownSpec> = {
    ...flaggablePlugin<DropdownSpec>(pluginName, className),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const dropdownInstances: DropdownInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const spec: DropdownSpec = specReview.approvedSpec;

            const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            <select class="vega-bind-select" id="${spec.variableId}" name="${spec.variableId}" ${spec.multiple ? 'multiple' : ''} size="${spec.size || 1}">
                            </select>
                        </label>
                    </div>
                </form>`;
            container.innerHTML = html;
            const element = container.querySelector('select') as HTMLSelectElement;

            // Safely set the initial options
            setSelectOptions(element, spec.multiple ?? false, spec.options ?? [], spec.value ?? (spec.multiple ? [] : ""));

            const dropdownInstance: DropdownInstance = { id: `${pluginName}-${index}`, spec, element };
            dropdownInstances.push(dropdownInstance);
        }
        const instances = dropdownInstances.map((dropdownInstance, index): IInstance => {
            const { element, spec } = dropdownInstance;
            const initialSignals = [{
                name: spec.variableId,
                value: spec.value || null,
                priority: 1,
                isData: false,
            }];
            if (spec.dynamicOptions) {
                initialSignals.push({
                    name: spec.dynamicOptions.dataSourceName,
                    value: null,
                    priority: -1,
                    isData: true,
                });
            }
            return {
                ...dropdownInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    const { dynamicOptions } = spec;
                    if (dynamicOptions?.dataSourceName) {
                        const newData = batch[dynamicOptions.dataSourceName]?.value as object[];
                        if (newData) {
                            //pluck the field from the data and add options to the select
                            let hasFieldName = false;
                            //remove duplicates from the options array
                            const uniqueOptions = new Set<string>();
                            newData.forEach((d) => {
                                //check if the field exists in the data
                                if (d.hasOwnProperty(dynamicOptions.fieldName)) {
                                    hasFieldName = true;
                                    uniqueOptions.add(d[dynamicOptions.fieldName]);
                                }
                            });
                            if (hasFieldName) {
                                const options = Array.from(uniqueOptions);
                                const existingSelection = spec.multiple ? Array.from(element.selectedOptions).map(option => option.value) : element.value;
                                setSelectOptions(element, spec.multiple ?? false, options, existingSelection);
                                if (!spec.multiple) {
                                    element.value = (batch[spec.variableId]?.value as string) || options[0];
                                }
                            } else {
                                //if the field doesn't exist, set the select to the first option
                                element.innerHTML = '';
                                const errorOption = document.createElement('option');
                                errorOption.value = '';
                                errorOption.textContent = `Field "${dynamicOptions.fieldName}" not found`;
                                element.appendChild(errorOption);
                                element.value = '';
                            }
                        }
                    }
                    if (batch[spec.variableId]) {
                        const value = batch[spec.variableId].value as string | string[];
                        if (spec.multiple) {
                            Array.from(element.options).forEach((option) => {
                                option.selected = !!(value && Array.isArray(value) && value.includes(option.value));
                            });
                        } else {
                            element.value = value as string;
                        }
                    }
                },
                beginListening() {
                    //wire up handler to send the selected value to the signal bus
                    element.addEventListener('change', (e) => {
                        const value = spec.multiple
                            ? Array.from((e.target as HTMLSelectElement).selectedOptions).map(option => option.value)
                            : (e.target as HTMLSelectElement).value;
                        const batch: Batch = {
                            [spec.variableId]: {
                                value,
                                isData: false,
                            },
                        };
                        signalBus.broadcast(dropdownInstance.id, batch);
                    });
                },
                getCurrentSignalValue: () => {
                    if (spec.multiple) {
                        return Array.from(element.selectedOptions).map(option => option.value);
                    }
                    return element.value;
                },
                destroy: () => {
                    element.removeEventListener('change', dropdownInstance.element.onchange as EventListener);
                },
            };
        });
        return instances;
    },
};

function setSelectOptions(selectElement: HTMLSelectElement, multiple: boolean, options: string[], selected: string | string[]) {
    // Clear existing options
    selectElement.innerHTML = '';

    if (!options || options.length === 0) {
        if (multiple) {
            if (Array.isArray(selected)) {
                options = selected as string[];
            } else {
                if (selected) {
                    options = [selected as string];
                }
            }
        } else {
            if (selected) {
                options = [selected as string];
            }
        }
    }

    if (!options || options.length === 0) {
        return;
    }

    options.forEach((optionValue) => {
        const optionElement = document.createElement('option');
        optionElement.value = optionValue;
        optionElement.textContent = optionValue; // This safely escapes HTML

        let isSelected = false;
        if (multiple) {
            isSelected = (selected as string[] || []).includes(optionValue);
        } else {
            isSelected = selected === optionValue;
        }
        optionElement.selected = isSelected;

        selectElement.appendChild(optionElement);
    });
}
