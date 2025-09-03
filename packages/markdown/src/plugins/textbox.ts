/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { TextboxElementProps } from '@microsoft/chartifact-schema';
import { Batch, IInstance, Plugin } from '../factory.js';
import { pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

interface TextboxInstance {
    id: string;
    spec: TextboxSpec;
    element: HTMLInputElement | HTMLTextAreaElement;
}

export interface TextboxSpec extends TextboxElementProps {
    value?: string;
}

const pluginName: PluginNames = 'textbox';
const className = pluginClassName(pluginName);

export const textboxPlugin: Plugin<TextboxSpec> = {
    ...flaggablePlugin<TextboxSpec>(pluginName, className),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const textboxInstances: TextboxInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const spec: TextboxSpec = specReview.approvedSpec;

            const placeholderAttr = spec.placeholder ? ` placeholder="${spec.placeholder}"` : '';
            const inputElement = spec.multiline
                ? `<textarea class="vega-bind-text" id="${spec.variableId}" name="${spec.variableId}"${placeholderAttr}>${spec.value || ''}</textarea>`
                : `<input type="text" class="vega-bind-text" id="${spec.variableId}" name="${spec.variableId}" value="${spec.value || ''}"${placeholderAttr} />`;

            const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            ${inputElement}
                        </label>
                    </div>
                </form>`;
            container.innerHTML = html;
            const element = container.querySelector(spec.multiline ? 'textarea' : 'input[type="text"]') as HTMLInputElement | HTMLTextAreaElement;

            const textboxInstance: TextboxInstance = { id: `${pluginName}-${index}`, spec, element };
            textboxInstances.push(textboxInstance);
        }

        const instances = textboxInstances.map((textboxInstance): IInstance => {
            const { element, spec } = textboxInstance;
            const initialSignals = [{
                name: spec.variableId,
                value: spec.value || '',
                priority: 1,
                isData: false,
            }];

            return {
                ...textboxInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (batch[spec.variableId]) {
                        const value = batch[spec.variableId].value as string;
                        element.value = value;
                    }
                },
                beginListening() {
                    // Wire up handler to send the text value to the signal bus
                    const updateValue = (e: Event) => {
                        const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
                        const batch: Batch = {
                            [spec.variableId]: {
                                value,
                                isData: false,
                            },
                        };
                        signalBus.broadcast(textboxInstance.id, batch);
                    };

                    element.addEventListener('input', updateValue);
                    element.addEventListener('change', updateValue);
                },
                getCurrentSignalValue: () => {
                    return element.value;
                },
                destroy: () => {
                    element.removeEventListener('input', textboxInstance.element.oninput as EventListener);
                    element.removeEventListener('change', textboxInstance.element.onchange as EventListener);
                },
            };
        });
        return instances;
    },
};
