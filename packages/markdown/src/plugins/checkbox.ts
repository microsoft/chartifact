/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { VariableControl } from '@microsoft/chartifact-schema';
import { Batch, IInstance, Plugin } from '../factory.js';
import { pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface CheckboxInstance {
    id: string;
    spec: CheckboxSpec;
    element: HTMLInputElement;
}

export interface CheckboxSpec extends VariableControl {
    value?: boolean;
}

const pluginName: PluginNames = 'checkbox';
const className = pluginClassName(pluginName);

export const checkboxPlugin: Plugin<CheckboxSpec> = {
    ...flaggablePlugin<CheckboxSpec>(pluginName, className),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const checkboxInstances: CheckboxInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const spec: CheckboxSpec = specReview.approvedSpec;

            const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            <input type="checkbox" class="vega-bind-checkbox" id="${spec.variableId}" name="${spec.variableId}" ${spec.value ? 'checked' : ''}/>
                        </label>
                    </div>
                </form>`;
            container.innerHTML = html;
            const element = container.querySelector('input[type="checkbox"]') as HTMLInputElement;

            const checkboxInstance: CheckboxInstance = { id: `${pluginName}-${index}`, spec, element };
            checkboxInstances.push(checkboxInstance);
        }

        const instances = checkboxInstances.map((checkboxInstance): IInstance => {
            const { element, spec } = checkboxInstance;
            const initialSignals = [{
                name: spec.variableId,
                value: spec.value || false,
                priority: 1,
                isData: false,
            }];

            return {
                ...checkboxInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (batch[spec.variableId]) {
                        const value = batch[spec.variableId].value as boolean;
                        element.checked = value;
                    }
                },
                beginListening() {
                    // Wire up handler to send the checked value to the signal bus
                    element.addEventListener('change', (e) => {
                        const value = (e.target as HTMLInputElement).checked;
                        const batch: Batch = {
                            [spec.variableId]: {
                                value,
                                isData: false,
                            },
                        };
                        signalBus.broadcast(checkboxInstance.id, batch);
                    });
                },
                getCurrentSignalValue: () => {
                    return element.checked;
                },
                destroy: () => {
                    element.removeEventListener('change', checkboxInstance.element.onchange as EventListener);
                },
            };
        });
        return instances;
    },
};
