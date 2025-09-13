/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { DateInputElementProps } from '@microsoft/chartifact-schema';
import { Batch, IInstance, Plugin } from '../factory.js';
import { pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface DateInstance {
    id: string;
    spec: DateSpec;
    element: HTMLInputElement;
}

export interface DateSpec extends DateInputElementProps {
    value?: string;
}

const pluginName: PluginNames = 'date';
const className = pluginClassName(pluginName);

export const datePlugin: Plugin<DateSpec> = {
    ...flaggablePlugin<DateSpec>(pluginName, className),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const dateInstances: DateInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const spec: DateSpec = specReview.approvedSpec;

            const placeholderAttr = spec.placeholder ? ` placeholder="${spec.placeholder}"` : '';
            const minAttr = spec.min ? ` min="${spec.min}"` : '';
            const maxAttr = spec.max ? ` max="${spec.max}"` : '';
            const value = spec.value || '';

            const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            <input type="date" class="vega-bind-date" id="${spec.variableId}" name="${spec.variableId}" value="${value}"${placeholderAttr}${minAttr}${maxAttr} />
                        </label>
                    </div>
                </form>`;
            container.innerHTML = html;
            const element = container.querySelector('input[type="date"]') as HTMLInputElement;

            const dateInstance: DateInstance = { id: `${pluginName}-${index}`, spec, element };
            dateInstances.push(dateInstance);
        }

        const instances = dateInstances.map((dateInstance): IInstance => {
            const { element, spec } = dateInstance;
            const initialSignals = [{
                name: spec.variableId,
                value: spec.value || '',
                priority: 1,
                isData: false,
            }];

            return {
                ...dateInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (batch[spec.variableId]) {
                        const value = batch[spec.variableId].value as string;
                        element.value = value;
                    }
                },
                beginListening() {
                    // Wire up handler to send the date value to the signal bus
                    const updateValue = (e: Event) => {
                        const value = (e.target as HTMLInputElement).value;
                        const batch: Batch = {
                            [spec.variableId]: {
                                value,
                                isData: false,
                            },
                        };
                        signalBus.broadcast(dateInstance.id, batch);
                    };

                    element.addEventListener('input', updateValue);
                    element.addEventListener('change', updateValue);
                },
                getCurrentSignalValue: () => {
                    return element.value;
                },
                destroy: () => {
                    element.removeEventListener('input', dateInstance.element.oninput as EventListener);
                    element.removeEventListener('change', dateInstance.element.onchange as EventListener);
                },
            };
        });
        return instances;
    },
};