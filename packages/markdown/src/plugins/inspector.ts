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
    raw?: boolean;
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
                    <div class="inspector-value" id="${spec.variableId}-value"></div>
                </div>`;
            container.innerHTML = html;
            const element = container.querySelector('.inspector-value') as HTMLElement;

            const inspectorInstance: InspectorInstance = { id: `${pluginName}-${index}`, spec, element };
            inspectorInstances.push(inspectorInstance);
        }

        const instances = inspectorInstances.map((inspectorInstance): IInstance => {
            const { element, spec } = inspectorInstance;
            
            // Special case: if variableId is "*", inspect all variables from signalDeps
            const isInspectAll = spec.variableId === '*';
            
            const initialSignals = isInspectAll ? [] : [{
                name: spec.variableId,
                value: null,
                priority: -1,
                isData: false,
            }];

            const updateDisplay = (value: unknown) => {
                element.innerHTML = ''; // Clear previous content
                
                // If raw mode is enabled, always use JSON.stringify without interactivity
                if (spec.raw) {
                    element.textContent = JSON.stringify(value, null, 2);
                    return;
                }
                
                // Interactive mode (default)
                if (Array.isArray(value)) {
                    // Create interactive collapsible array display
                    renderArray(element, value);
                } else if (typeof value === 'object') {
                    // For objects, use JSON.stringify with indentation
                    element.textContent = JSON.stringify(value, null, 2);
                } else {
                    element.textContent = JSON.stringify(value);
                }
            };

            const renderArray = (container: HTMLElement, arr: unknown[], depth: number = 0) => {
                const indent = '  '.repeat(depth);
                
                // Create collapsible array structure
                const arrayWrapper = document.createElement('div');
                arrayWrapper.className = 'inspector-array';
                
                // Array header with toggle
                const header = document.createElement('div');
                header.className = 'inspector-array-header';
                header.style.cursor = 'pointer';
                header.style.userSelect = 'none';
                
                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'inspector-toggle';
                toggleIcon.textContent = '▶ ';
                toggleIcon.style.display = 'inline-block';
                toggleIcon.style.width = '1em';
                
                const arrayLabel = document.createElement('span');
                arrayLabel.textContent = `Array(${arr.length})`;
                
                header.appendChild(toggleIcon);
                header.appendChild(arrayLabel);
                
                // Array content
                const content = document.createElement('div');
                content.className = 'inspector-array-content';
                content.style.paddingLeft = '1.5em';
                
                arr.forEach((item, index) => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'inspector-array-item';
                    
                    const indexLabel = document.createElement('span');
                    indexLabel.textContent = `[${index}]: `;
                    itemDiv.appendChild(indexLabel);
                    
                    const valueSpan = document.createElement('span');
                    
                    if (Array.isArray(item)) {
                        // Nested array
                        renderArray(valueSpan, item, depth + 1);
                    } else if (typeof item === 'object') {
                        valueSpan.textContent = JSON.stringify(item, null, 2);
                        valueSpan.style.whiteSpace = 'pre';
                    } else {
                        valueSpan.textContent = JSON.stringify(item);
                    }
                    
                    itemDiv.appendChild(valueSpan);
                    content.appendChild(itemDiv);
                });
                
                // Toggle functionality - start collapsed
                let isExpanded = false;
                content.style.display = 'none';
                const toggle = () => {
                    isExpanded = !isExpanded;
                    content.style.display = isExpanded ? 'block' : 'none';
                    toggleIcon.textContent = isExpanded ? '▼ ' : '▶ ';
                };
                
                header.addEventListener('click', toggle);
                
                arrayWrapper.appendChild(header);
                arrayWrapper.appendChild(content);
                container.appendChild(arrayWrapper);
            };

            return {
                ...inspectorInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (isInspectAll) {
                        // Extract all variable values from signalDeps
                        const allVars: { [key: string]: unknown } = {};
                        for (const signalName in signalBus.signalDeps) {
                            allVars[signalName] = signalBus.signalDeps[signalName].value;
                        }
                        updateDisplay(allVars);
                    } else if (batch[spec.variableId]) {
                        const value = batch[spec.variableId].value;
                        updateDisplay(value);
                    }
                },
                beginListening() {
                    // Inspector is read-only, no event listeners needed
                    // For inspect-all mode, do initial display
                    if (isInspectAll) {
                        const allVars: { [key: string]: unknown } = {};
                        for (const signalName in signalBus.signalDeps) {
                            allVars[signalName] = signalBus.signalDeps[signalName].value;
                        }
                        updateDisplay(allVars);
                    }
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
