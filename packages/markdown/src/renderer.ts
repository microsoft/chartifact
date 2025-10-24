/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import MarkdownIt from 'markdown-it';
import { Renderers } from 'vega-typings';
import { create, IInstance, plugins } from './factory.js';
import { SignalBus } from './signalbus.js';
import { defaultCommonOptions, SpecReview } from 'common';
import { PluginNames } from './plugins/interfaces.js';

export interface ErrorHandler {
    (error: Error, pluginName: string, instanceIndex: number, phase: string, container: Element, detail?: string): void;
}

export interface RendererOptions {
    vegaRenderer?: Renderers;
    errorHandler?: ErrorHandler;
    useShadowDom?: boolean;
    openLinksInNewTab?: boolean;
}

const defaultRendererOptions: RendererOptions = {
    vegaRenderer: 'canvas',
    useShadowDom: false,
    openLinksInNewTab: true,
    errorHandler: (error, pluginName, instanceIndex, phase) => {
        console.error(`Error in plugin ${pluginName} instance ${instanceIndex} phase ${phase}`, error);
    },
};

interface Hydration {
    pluginName: PluginNames;
    instances: IInstance[];
}

export class Renderer {

    public md: MarkdownIt;
    public instances: { [key: string]: IInstance[] };
    public signalBus: SignalBus;
    public options: RendererOptions;
    public shadowRoot?: ShadowRoot;
    public element: Element | ShadowRoot;

    constructor(_element: HTMLElement, options?: RendererOptions) {
        this.options = { ...defaultRendererOptions, ...options };
        this.signalBus = new SignalBus(defaultCommonOptions.dataSignalPrefix!);
        this.instances = {};

        // Create shadow DOM or use regular DOM
        if (this.options.useShadowDom) {
            this.shadowRoot = _element.attachShadow({ mode: 'open' });
            this.element = this.shadowRoot;
        } else {
            this.element = _element;
        }
    }

    private ensureMd() {
        if (!this.md) {
            this.md = create();

            if (this.options.openLinksInNewTab) {
                // Override link rendering
                const defaultRender = this.md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
                    return self.renderToken(tokens, idx, options);
                };

                this.md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
                    const token = tokens[idx];

                    // Add target="_blank"
                    const targetIndex = token.attrIndex('target');
                    if (targetIndex < 0) {
                        token.attrPush(['target', '_blank']);
                    } else {
                        token.attrs[targetIndex][1] = '_blank';
                    }

                    // Add rel="noopener noreferrer"
                    const relIndex = token.attrIndex('rel');
                    if (relIndex < 0) {
                        token.attrPush(['rel', 'noopener noreferrer']);
                    } else {
                        token.attrs[relIndex][1] = 'noopener noreferrer';
                    }

                    return defaultRender(tokens, idx, options, env, self);
                };
            }
        }
    }

    async render(markdown: string) {
        //loop through all the destroy handlers and call them. have the key there to help us debug
        this.reset();

        const html = this.renderHtml(markdown);
        this.element.innerHTML = html;
        const specs = this.hydrateSpecs();

        await this.hydrate(specs);
    }

    renderHtml(markdown: string) {
        this.ensureMd();
        const parsedHTML = this.md.render(markdown);

        let content = parsedHTML;

        // Wrap in "body" div for shadow DOM
        if (this.options.useShadowDom) {
            content = `<div class="body">${content}</div>`;
        }

        return content;
    }

    hydrateSpecs() {
        this.ensureMd();

        const specs: SpecReview<{}>[] = [];

        //loop through all the plugins and hydrate their specs and flag them id needed
        this.signalBus.log('Renderer', 'hydrate specs');

        for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i];
            if (plugin.hydrateSpecs) {
                specs.push(...plugin.hydrateSpecs(this, this.options.errorHandler));
            }
        }

        return specs;
    }

    async hydrate(specs: SpecReview<{}>[]) {
        this.ensureMd();

        //loop through all the plugins and render them
        this.signalBus.log('Renderer', 'hydrate components');
        const hydrationPromises: Promise<Hydration>[] = [];

        for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i];
            if (plugin.hydrateComponent) {
                //get only those specs that match the plugin name
                const specsForPlugin = specs.filter(spec => spec.pluginName === plugin.name);
                //make a new promise that returns IInstances but adds the plugin name
                hydrationPromises.push(plugin.hydrateComponent(this, this.options.errorHandler, specsForPlugin).then(instances => {
                    return {
                        pluginName: plugin.name,
                        instances,
                    };
                }));
            }
        }

        try {
            let variableInstances: IInstance[] = []; //VVVVV

            const pluginHydrations = await Promise.all(hydrationPromises);
            for (const hydration of pluginHydrations) {
                if (hydration && hydration.instances) {
                    this.instances[hydration.pluginName] = hydration.instances;
                    //registration phase
                    if (hydration.pluginName === 'variables') {
                        variableInstances = hydration.instances;
                    } else {
                        for (const instance of hydration.instances) {
                            this.signalBus.registerPeer(instance);
                        }
                    }
                }
            }

            /*
                VVVVV
                TODO: Create our "Brain" Vega spec that connects all the signals from variables

                we only need to add variables that:
                - have calculations
                - have a loader

                we also need to add signals (from the signal bus) that:
                - are marked 'isData'
            */
            
            // Create the brain Vega spec if we have variables with loaders or calculations
            if (variableInstances.length > 0) {
                await this.createAndHydrateBrainSpec(variableInstances);
            }

            await this.signalBus.beginListening();

            //trigger a resize event so that the Vega views can adjust
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 0);

        } catch (error) {
            console.error('Error in rendering plugins', error);
        }
    }

    reset() {

        //cancel the old signal bus, which may have active listeners
        this.signalBus.deactivate();

        //create a new signal bus
        this.signalBus = new SignalBus(defaultCommonOptions.dataSignalPrefix!);

        for (const pluginName of Object.keys(this.instances)) {
            const instances = this.instances[pluginName];
            for (const instance of instances) {
                instance.destroy && instance.destroy();
            }
        }
        this.instances = {};

        // Clear container content including styles
        this.element.innerHTML = '';
    }

    private async createAndHydrateBrainSpec(variableInstances: IInstance[]) {
        // Import the VariableInstance type and extract variables
        const variables = variableInstances.map((inst: any) => inst.variable).filter(Boolean);
        
        if (variables.length === 0) {
            return;
        }

        // We need to import createSpecWithVariables from the compiler
        // For now, let's create a minimal implementation here
        // TODO: This should use the same logic as createSpecWithVariables from compiler
        
        // Create a minimal brain spec
        const brainSpec: any = {
            $schema: "https://vega.github.io/schema/vega/v5.json",
            description: "Brain spec for variables with loaders and calculations",
            signals: [],
            data: [],
        };
        
        // Add variables to the brain spec
        // This is a simplified version - the full implementation should use createSpecWithVariables
        for (const variable of variables) {
            if (variable.loader) {
                // Variables with loaders become data sources
                brainSpec.signals.push({
                    name: variable.variableId,
                    update: `data('${variable.variableId}')`
                });
                brainSpec.data.push({
                    name: variable.variableId,
                    values: variable.initialValue || []
                });
            } else if (variable.calculation) {
                // Variables with calculations become signals with update expressions
                const calc = variable.calculation as any;
                if (calc.vegaExpression) {
                    brainSpec.signals.push({
                        name: variable.variableId,
                        value: variable.initialValue,
                        update: calc.vegaExpression
                    });
                } else if (calc.dataFrameTransformations) {
                    brainSpec.signals.push({
                        name: variable.variableId,
                        update: `data('${variable.variableId}')`
                    });
                    brainSpec.data.push({
                        name: variable.variableId,
                        source: calc.dataSourceNames || [],
                        transform: calc.dataFrameTransformations || []
                    });
                }
            }
        }
        
        // Only create a Vega view if we have signals or data
        if (brainSpec.signals.length > 0 || brainSpec.data.length > 0) {
            // TODO: Create a Vega view from the brain spec and register it with the signal bus
            // This requires importing Vega and creating a view similar to the vega plugin
            // For now, we'll leave this as a stub
            this.signalBus.log('Renderer', 'Brain spec created', brainSpec);
        }
    }

}
