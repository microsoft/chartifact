/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import MarkdownIt from 'markdown-it';
import { Renderers } from 'vega-typings';
import { create, IInstance, plugins, Plugin } from './factory.js';
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

        // Separate vega plugin from other plugins
        const vegaPlugin = plugins.find(p => p.name === 'vega');
        const otherPlugins = plugins.filter(p => p.name !== 'vega');

        // First hydrate all plugins except vega
        for (let i = 0; i < otherPlugins.length; i++) {
            const plugin = otherPlugins[i];
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
            let variableInstances: IInstance[] = [];

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

            // After all other plugins are hydrated, create and hydrate the brain spec if needed
            if (variableInstances.length > 0) {
                await this.createAndHydrateBrainSpec(variableInstances, specs, vegaPlugin);
            } else if (vegaPlugin) {
                // No brain spec needed, but still hydrate existing vega specs
                const vegaSpecs = specs.filter(spec => spec.pluginName === 'vega');
                if (vegaSpecs.length > 0 && vegaPlugin.hydrateComponent) {
                    const vegaInstances = await vegaPlugin.hydrateComponent(this, this.options.errorHandler, vegaSpecs);
                    if (vegaInstances) {
                        this.instances['vega'] = vegaInstances;
                        for (const instance of vegaInstances) {
                            this.signalBus.registerPeer(instance);
                        }
                    }
                }
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

    private async createAndHydrateBrainSpec(variableInstances: IInstance[], specs: SpecReview<{}>[], vegaPlugin: Plugin<any>) {
        // Extract variables from instances
        const variables = variableInstances.map((inst: any) => inst.variable).filter(Boolean);
        
        if (variables.length === 0) {
            return;
        }

        // Create the brain spec following the same logic as createSpecWithVariables
        const brainSpec: any = {
            $schema: "https://vega.github.io/schema/vega/v5.json",
            description: "Brain spec for variables with loaders and calculations",
            signals: [],
            data: [],
        };
        
        // Add variables to the brain spec
        for (const variable of variables) {
            const { variableId, type, isArray, initialValue, calculation, loader } = variable;
            
            if (loader) {
                // Variables with loaders become data sources
                brainSpec.signals.push({
                    name: variableId,
                    update: `data('${variableId}')`
                });
                
                // Handle different loader types
                const dataEntry: any = {
                    name: variableId,
                };
                
                if (loader.type === 'inline') {
                    // For inline loaders, the data will be provided by CSV/TSV/DSV plugins
                    // So we just create a placeholder
                    dataEntry.values = initialValue || [];
                } else if (loader.type === 'url') {
                    // For URL loaders, Vega can handle the loading
                    dataEntry.url = loader.url;
                    if (loader.format) {
                        if (loader.format === 'dsv' && loader.delimiter) {
                            dataEntry.format = { type: 'dsv', delimiter: loader.delimiter };
                        } else {
                            dataEntry.format = { type: loader.format };
                        }
                    }
                } else if (loader.type === 'file') {
                    // File loaders are treated like inline
                    dataEntry.values = initialValue || [];
                }
                
                // Add transforms if present
                if (loader.dataFrameTransformations && loader.dataFrameTransformations.length > 0) {
                    dataEntry.transform = loader.dataFrameTransformations;
                }
                
                brainSpec.data.push(dataEntry);
                
            } else if (calculation) {
                // Variables with calculations
                const calc = calculation as any;
                
                if (calc.vegaExpression) {
                    // Scalar calculation
                    brainSpec.signals.push({
                        name: variableId,
                        value: initialValue,
                        update: calc.vegaExpression
                    });
                } else if (calc.dataFrameTransformations) {
                    // DataFrame calculation
                    brainSpec.signals.push({
                        name: variableId,
                        update: `data('${variableId}')`
                    });
                    brainSpec.data.push({
                        name: variableId,
                        source: calc.dataSourceNames || [],
                        transform: calc.dataFrameTransformations || []
                    });
                }
            }
        }
        
        // Only create a Vega view if we have signals or data
        if (brainSpec.signals.length > 0 || brainSpec.data.length > 0) {
            this.signalBus.log('Renderer', 'Brain spec created', brainSpec);
            
            // Create a div for the brain vega spec
            const brainContainer = document.createElement('div');
            brainContainer.id = 'vega-brain';
            brainContainer.className = 'plugin-vega';
            brainContainer.style.display = 'none';
            
            // Store the spec as JSON in the div
            const specData = { spec: brainSpec };
            brainContainer.textContent = JSON.stringify(specData);
            
            // Add the div to the DOM
            this.element.appendChild(brainContainer);
            
            // Create a SpecReview for the brain spec
            const brainSpecReview: SpecReview<any> = {
                approvedSpec: brainSpec,
                pluginName: 'vega',
                containerId: 'vega-brain'
            };
            
            // Hydrate the brain spec using the vega plugin
            if (vegaPlugin && vegaPlugin.hydrateComponent) {
                const brainInstances = await vegaPlugin.hydrateComponent(this, this.options.errorHandler, [brainSpecReview]);
                
                if (brainInstances && brainInstances.length > 0) {
                    // Add brain instances to the vega instances
                    if (!this.instances['vega']) {
                        this.instances['vega'] = [];
                    }
                    this.instances['vega'].push(...brainInstances);
                    
                    // Register brain instances with the signal bus
                    for (const instance of brainInstances) {
                        this.signalBus.registerPeer(instance);
                    }
                }
            }
            
            // Also hydrate any existing vega specs
            const existingVegaSpecs = specs.filter(spec => spec.pluginName === 'vega');
            if (existingVegaSpecs.length > 0 && vegaPlugin && vegaPlugin.hydrateComponent) {
                const existingVegaInstances = await vegaPlugin.hydrateComponent(this, this.options.errorHandler, existingVegaSpecs);
                if (existingVegaInstances && existingVegaInstances.length > 0) {
                    if (!this.instances['vega']) {
                        this.instances['vega'] = [];
                    }
                    this.instances['vega'].push(...existingVegaInstances);
                    for (const instance of existingVegaInstances) {
                        this.signalBus.registerPeer(instance);
                    }
                }
            }
        }
    }

}
