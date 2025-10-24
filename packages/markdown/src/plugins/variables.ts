/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Variable } from '@microsoft/chartifact-schema';
import { IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { PluginNames } from './interfaces.js';
import { pluginClassName } from './util.js';
import { SpecReview } from 'common';

export interface VariableInstance extends IInstance {
    variable: Variable;
}

export interface VariablesSpec {
    variables: Variable[];
}

const pluginName: PluginNames = 'variables';
const className = pluginClassName(pluginName);

function inspectVariablesSpec(spec: VariablesSpec): RawFlaggableSpec<VariablesSpec> {
    return {
        spec,
        hasFlags: false,
        reasons: []
    };
}

/**
 * Variables plugin - handles variables with loaders and calculations
 * This plugin does NOT render anything visible to the DOM
 * The Renderer will use these variables to build the "brain" Vega spec
 */
export const variablesPlugin: Plugin<VariablesSpec> = {
    name: pluginName,
    fence: (token, index) => {
        const content = token.content.trim();
        // Store the variables JSON in a hidden div
        return `<div id="${pluginName}-${index}" class="${className}" style="display:none">${content}</div>`;
    },
    hydrateSpecs: (renderer, errorHandler) => {
        const flagged: SpecReview<VariablesSpec>[] = [];
        const containers = renderer.element.querySelectorAll(`.${className}`);
        
        for (const [index, container] of Array.from(containers).entries()) {
            try {
                const content = container.textContent?.trim();
                if (!content) {
                    errorHandler(new Error('No variables content found'), pluginName, index, 'parse', container);
                    continue;
                }
                
                const variables: Variable[] = JSON.parse(content);
                const spec: VariablesSpec = { variables };
                const flaggableSpec = inspectVariablesSpec(spec);
                
                const f: SpecReview<VariablesSpec> = { 
                    approvedSpec: null, 
                    pluginName, 
                    containerId: container.id 
                };
                
                if (flaggableSpec.hasFlags) {
                    f.blockedSpec = flaggableSpec.spec;
                    f.reason = flaggableSpec.reasons?.join(', ') || 'Unknown reason';
                } else {
                    f.approvedSpec = flaggableSpec.spec;
                }
                
                flagged.push(f);
            } catch (e) {
                errorHandler(e instanceof Error ? e : new Error(String(e)), pluginName, index, 'parse', container);
            }
        }
        
        return flagged;
    },
    hydrateComponent: async (renderer, errorHandler, specs) => {
        // Variables plugin returns instances but they are handled specially by the Renderer
        // The Renderer will NOT register these with the signal bus immediately
        // Instead, it will use them to build the brain Vega spec after hydration completes
        const instances: VariableInstance[] = [];
        
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            
            const spec: VariablesSpec = specReview.approvedSpec;
            
            // Each variable with a loader or calculation becomes an instance
            // The instance doesn't do anything on its own - it's just metadata for the Renderer
            for (const variable of spec.variables) {
                instances.push({
                    id: `${pluginName}-${variable.variableId}`,
                    initialSignals: [],
                    variable, // Store the variable metadata
                });
            }
        }
        
        return instances;
    },
};