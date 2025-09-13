/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { VariableControl, SliderElementProps } from '@microsoft/chartifact-schema';
import { Batch, IInstance, Plugin } from '../factory.js';
import { debounce, pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface SliderInstance {
    id: string;
    spec: SliderSpec;
    element: HTMLInputElement;
}

export interface SliderSpec extends VariableControl, SliderElementProps {
    value?: number;
}

const pluginName: PluginNames = 'slider';
const className = pluginClassName(pluginName);

export const sliderPlugin: Plugin<SliderSpec> = {
    ...flaggablePlugin<SliderSpec>(pluginName, className),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const sliderInstances: SliderInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const spec: SliderSpec = specReview.approvedSpec;

            const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            <input type="range" class="vega-bind-range" id="${spec.variableId}" name="${spec.variableId}" 
                                   min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${spec.value || spec.min}"/>
                            <span class="vega-bind-value">${spec.value || spec.min}</span>
                        </label>
                    </div>
                </form>`;
            container.innerHTML = html;
            const element = container.querySelector('input[type="range"]') as HTMLInputElement;

            const sliderInstance: SliderInstance = { id: `${pluginName}-${index}`, spec, element };
            sliderInstances.push(sliderInstance);
        }

        const instances = sliderInstances.map((sliderInstance): IInstance => {
            const { element, spec } = sliderInstance;
            const valueSpan = element.parentElement?.querySelector('.vega-bind-value') as HTMLSpanElement;

            const initialSignals = [{
                name: spec.variableId,
                value: spec.value || spec.min,
                priority: 1,
                isData: false,
            }];

            return {
                ...sliderInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (batch[spec.variableId]) {
                        const value = batch[spec.variableId].value as number;
                        element.value = value.toString();
                        if (valueSpan) {
                            valueSpan.textContent = value.toString();
                        }
                    }
                },
                beginListening() {
                    // Wire up handler to send the slider value to the signal bus
                    const updateValue = debounce((e: Event) => {
                        const value = parseFloat((e.target as HTMLInputElement).value);
                        if (valueSpan) {
                            valueSpan.textContent = value.toString();
                        }
                        const batch: Batch = {
                            [spec.variableId]: {
                                value,
                                isData: false,
                            },
                        };
                        signalBus.broadcast(sliderInstance.id, batch);
                    }, 0);

                    element.addEventListener('input', updateValue);
                    element.addEventListener('change', updateValue);
                },
                getCurrentSignalValue: () => {
                    return parseFloat(element.value);
                },
                destroy: () => {
                    element.removeEventListener('input', sliderInstance.element.oninput as EventListener);
                    element.removeEventListener('change', sliderInstance.element.onchange as EventListener);
                },
            };
        });
        return instances;
    },
};
