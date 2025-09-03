/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Preset } from '@microsoft/chartifact-schema';
import { Batch, IInstance, Plugin, PrioritizedSignal } from '../factory.js';
import { pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';

export type PresetsSpec = Preset[];

interface PresetsInstance {
    id: string;
    presets: Preset[];
    element: HTMLUListElement;
}

const pluginName: PluginNames = 'presets';
const className = pluginClassName(pluginName);

export const presetsPlugin: Plugin<PresetsSpec> = {
    ...flaggablePlugin<PresetsSpec>(pluginName, className),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        const presetsInstances: PresetsInstance[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            const id = `${pluginName}-${index}`;
            const presets = specReview.approvedSpec;
            if (!Array.isArray(presets)) {
                container.innerHTML = '<div class="error">Expected an array of presets</div>';
                continue;
            }
            //clear the container
            container.innerHTML = '';
            const ul = document.createElement('ul');
            const presetsInstance: PresetsInstance = { id, presets, element: ul };
            container.appendChild(ul);
            for (const preset of presets) {
                //make a button for each preset
                const li = document.createElement('li');
                if (!preset.name || !preset.state) {
                    const span = document.createElement('span');
                    span.className = 'error';
                    span.textContent = 'Each preset must have a name and state';
                    li.appendChild(span);
                } else {
                    const button = document.createElement('button');
                    button.textContent = preset.name;
                    button.onclick = () => {
                        const batch: Batch = {};
                        for (const [signalName, value] of Object.entries(preset.state)) {
                            batch[signalName] = { value, isData: false };
                        }
                        signalBus.broadcast(id, batch);
                    };
                    li.appendChild(button);
                    li.appendChild(document.createTextNode('\u00A0'));
                    if (preset.description) {
                        button.title = preset.description;
                    }
                }
                ul.appendChild(li);
            }
            presetsInstances.push(presetsInstance);
        }
        const instances: IInstance[] = presetsInstances.map((presetsInstance, index) => {
            const initialSignals: PrioritizedSignal[] = presetsInstance.presets.flatMap(preset => {
                return Object.keys(preset.state).map(signalName => {
                    return {
                        name: signalName,
                        value: null,
                        priority: -1,
                        isData: undefined,  // we do not know if it is data or not
                    };
                });
            });
            return {
                ...presetsInstance,
                initialSignals,
                broadcastComplete: async () => {
                    //populate state from the signalBus.signalDeps
                    const state: { [signalName: string]: unknown } = {};
                    for (const signalName of Object.keys(signalBus.signalDeps)) {
                        state[signalName] = signalBus.signalDeps[signalName].value;
                    }
                    // highlight any presets that have the same signals and values as the current state
                    setAllPresetsActiveState(presetsInstance, state);
                },
            };
        });
        return instances;
    },
};

function isPresetActive(preset: Preset, state: { [signalName: string]: unknown }) {
    for (const [signalName, value] of Object.entries(preset.state)) {
        if (state[signalName] !== value) {
            return false;
        }
    }
    return true;
}

function setAllPresetsActiveState(presetsInstance: PresetsInstance, state: { [signalName: string]: unknown }) {
    for (const [presetIndex, preset] of presetsInstance.presets.entries()) {
        const { classList } = presetsInstance.element.children[presetIndex];
        if (isPresetActive(preset, state)) {
            classList.add('active');
        } else {
            classList.remove('active');
        }
    }
}
