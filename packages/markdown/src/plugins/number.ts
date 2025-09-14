/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { NumberElementProps } from '@microsoft/chartifact-schema';
import { Batch, IInstance, Plugin } from '../factory.js';
import { pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface NumberInstance {
    id: string;
    spec: NumberSpec;
    element: HTMLInputElement;
}

export interface NumberSpec extends NumberElementProps {
    value?: number;
}

const pluginName: PluginNames = 'number';
const className = pluginClassName(pluginName);

export const numberPlugin: Plugin<NumberSpec> = {
    ...flaggablePlugin<NumberSpec>(pluginName, className),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const numberInstances: NumberInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const spec: NumberSpec = specReview.approvedSpec;

            const placeholderAttr = spec.placeholder ? ` placeholder="${spec.placeholder}"` : '';
            const minAttr = spec.min !== undefined ? ` min="${spec.min}"` : '';
            const maxAttr = spec.max !== undefined ? ` max="${spec.max}"` : '';
            const stepAttr = spec.step !== undefined ? ` step="${spec.step}"` : '';
            const value = spec.value !== undefined ? spec.value : '';

            const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            <input type="number" class="vega-bind-number" id="${spec.variableId}" name="${spec.variableId}" value="${value}"${placeholderAttr}${minAttr}${maxAttr}${stepAttr} />
                        </label>
                    </div>
                </form>`;
            container.innerHTML = html;
            const element = container.querySelector('input[type="number"]') as HTMLInputElement;

            const numberInstance: NumberInstance = { id: `${pluginName}-${index}`, spec, element };
            numberInstances.push(numberInstance);
        }

        const instances = numberInstances.map((numberInstance): IInstance => {
            const { element, spec } = numberInstance;
            const initialSignals = [{
                name: spec.variableId,
                value: spec.value !== undefined ? spec.value : 0,
                priority: 1,
                isData: false,
            }];

            return {
                ...numberInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (batch[spec.variableId]) {
                        const value = batch[spec.variableId].value as number;
                        element.value = value.toString();
                    }
                },
                beginListening() {
                    // Wire up handler to send the number value to the signal bus
                    const updateValue = (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        const value = target.value === '' ? 0 : parseFloat(target.value);
                        const batch: Batch = {
                            [spec.variableId]: {
                                value: isNaN(value) ? 0 : value,
                                isData: false,
                            },
                        };
                        signalBus.broadcast(numberInstance.id, batch);
                    };

                    element.addEventListener('input', updateValue);
                    element.addEventListener('change', updateValue);
                },
                getCurrentSignalValue: () => {
                    const value = parseFloat(element.value);
                    return isNaN(value) ? 0 : value;
                },
                destroy: () => {
                    element.removeEventListener('input', numberInstance.element.oninput as EventListener);
                    element.removeEventListener('change', numberInstance.element.onchange as EventListener);
                },
            };
        });
        return instances;
    },
};