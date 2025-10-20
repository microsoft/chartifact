/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { VariableControl } from '@microsoft/chartifact-schema';
import { Batch, IInstance, Plugin } from '../factory.js';
import { pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface InspectorInstance {
    id: string;
    spec: InspectorSpec;
    element: HTMLElement;
}

export interface InspectorSpec extends VariableControl {
}

const pluginName: PluginNames = 'inspector';
const className = pluginClassName(pluginName);

export const inspectorPlugin: Plugin<InspectorSpec> = {
    ...flaggablePlugin<InspectorSpec>(pluginName, className),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const inspectorInstances: InspectorInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const spec: InspectorSpec = specReview.approvedSpec;

            const html = `<div class="inspector">
                    <div class="inspector-label">${spec.label || spec.variableId}</div>
                    <pre class="inspector-value" id="${spec.variableId}-value"></pre>
                </div>`;
            container.innerHTML = html;
            const element = container.querySelector('.inspector-value') as HTMLElement;

            const inspectorInstance: InspectorInstance = { id: `${pluginName}-${index}`, spec, element };
            inspectorInstances.push(inspectorInstance);
        }

        const instances = inspectorInstances.map((inspectorInstance): IInstance => {
            const { element, spec } = inspectorInstance;
            const initialSignals = [{
                name: spec.variableId,
                value: null,
                priority: -1,
                isData: false,
            }];

            const updateDisplay = (value: unknown) => {
                if (value === null || value === undefined) {
                    element.textContent = String(value);
                } else if (typeof value === 'string') {
                    element.textContent = `"${value}"`;
                } else if (typeof value === 'object') {
                    element.textContent = JSON.stringify(value, null, 2);
                } else {
                    element.textContent = String(value);
                }
            };

            return {
                ...inspectorInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (batch[spec.variableId]) {
                        const value = batch[spec.variableId].value;
                        updateDisplay(value);
                    }
                },
                beginListening() {
                    // Inspector is read-only, no event listeners needed
                },
                getCurrentSignalValue: () => {
                    // Inspector doesn't modify the signal, return undefined
                    return undefined;
                },
                destroy: () => {
                    // No cleanup needed
                },
            };
        });
        return instances;
    },
};
