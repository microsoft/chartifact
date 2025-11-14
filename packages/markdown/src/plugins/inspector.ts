/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { IInstance, Plugin } from '../factory.js';
import { pluginClassName } from './util.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';
import { InspectorElementProps } from '@microsoft/chartifact-schema';

interface InspectorInstance {
    id: string;
    spec: InspectorSpec;
    element: HTMLElement;
}

export interface InspectorSpec extends InspectorElementProps {
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
                    <div class="inspector-value" id="${spec.variableId || 'all'}-value"></div>
                </div>`;
            container.innerHTML = html;
            const element = container.querySelector('.inspector-value') as HTMLElement;

            const inspectorInstance: InspectorInstance = { id: `${pluginName}-${index}`, spec, element };
            inspectorInstances.push(inspectorInstance);
        }

        const instances = inspectorInstances.map((inspectorInstance): IInstance => {
            const { element, spec } = inspectorInstance;
            
            // Special case: if variableId is undefined/omitted, inspect all variables from signalDeps
            const isInspectAll = !spec.variableId;
            
            const initialSignals = [{
                name: isInspectAll ? '*' : spec.variableId,
                value: null,
                priority: -1,
                isData: false,
            }];

            const renderValue = (container: HTMLElement, value: unknown, depth: number = 0) => {
                // Clear previous content when rendering at root level
                if (depth === 0) {
                    container.innerHTML = '';
                }
                
                // If raw mode is enabled, always use JSON.stringify without interactivity
                if (spec.raw) {
                    container.textContent = JSON.stringify(value, null, 2);
                    return;
                }
                
                // Interactive mode (default)
                if (Array.isArray(value)) {
                    renderArray(container, value, depth);
                } else if (typeof value === 'object') {
                    container.textContent = JSON.stringify(value, null, 2);
                    container.style.whiteSpace = 'pre';
                } else {
                    container.textContent = JSON.stringify(value);
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
                    renderValue(valueSpan, item, depth + 1);
                    
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

            const getAllVariables = () => {
                const allVars: { [key: string]: unknown } = {};
                for (const signalName in signalBus.signalDeps) {
                    allVars[signalName] = signalBus.signalDeps[signalName].value;
                }
                return allVars;
            };

            return {
                ...inspectorInstance,
                initialSignals,
                receiveBatch: async (batch) => {
                    if (isInspectAll) {
                        renderValue(element, getAllVariables());
                    } else if (batch[spec.variableId]) {
                        renderValue(element, batch[spec.variableId].value);
                    }
                },
                beginListening() {
                    // Inspector is read-only, no event listeners needed
                    // For inspect-all mode, do initial display
                    if (isInspectAll) {
                        renderValue(element, getAllVariables());
                    }
                },
            };
        });
        return instances;
    },
};
