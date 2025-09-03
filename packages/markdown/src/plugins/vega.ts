/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { changeset, parse, View, expressionFunction, LoggerInterface } from 'vega';
import { Batch, IInstance, Plugin, PrioritizedSignal, RawFlaggableSpec } from '../factory.js';
import { BaseSignal, InitSignal, NewSignal, Runtime, Spec, ValuesData } from 'vega-typings';
import { ErrorHandler, Renderer } from '../renderer.js';
import { LogLevel, SignalBus } from '../signalbus.js';
import { pluginClassName } from './util.js';
import { defaultCommonOptions } from 'common';
import { flaggablePlugin, } from './config.js';
import { PluginNames } from './interfaces.js';

const ignoredSignals = ['width', 'height', 'padding', 'autosize', 'background', 'style', 'parent', 'datum', 'item', 'event', 'cursor'];

interface SpecInit {
    spec: Spec;
    initialSignals: PrioritizedSignal[];
    container: Element;
    index: number;
}

interface VegaInstance extends SpecInit {
    view: View;
    id: string;
    batch?: Batch;
    dataSignals: string[];
    needToRun?: boolean;
}

const pluginName: PluginNames = 'vega';
const className = pluginClassName(pluginName);

export function inspectVegaSpec(spec: Spec) {
    //TODO inspect spec for flags, such as http:// instead of https://, or other security issues
    const flaggableSpec: RawFlaggableSpec<Spec> = {
        spec,
    };
    return flaggableSpec;
}

export const vegaPlugin: Plugin<Spec> = {
    ...flaggablePlugin<Spec>(pluginName, className, inspectVegaSpec),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const { signalBus } = renderer;
        //initialize the expressionFunction only once
        if (!expressionsInitialized) {
            expressionFunction('encodeURIComponent', encodeURIComponent);
            expressionsInitialized = true;
        }

        const vegaInstances: VegaInstance[] = [];
        const specInits: SpecInit[] = [];
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);
            const specInit = createSpecInit(container, index, specReview.approvedSpec);
            if (specInit) {
                specInits.push(specInit);
            }
        }
        prioritizeSignalValues(specInits);
        for (const specInit of specInits) {
            const vegaInstance = await createVegaInstance(specInit, renderer, errorHandler);
            if (vegaInstance) {
                vegaInstances.push(vegaInstance);
            }
        }

        //make a single array of all the initialSignals that are marked isData
        const dataSignals = vegaInstances.map(vegaInstance => vegaInstance.initialSignals.filter(signal => signal.isData)).flat();

        //spin through all instances to see if its spec has data that matches with dataSignals
        for (const vegaInstance of vegaInstances) {
            if (!vegaInstance.spec.data) continue;
            for (const data of vegaInstance.spec.data) {
                //find a matching data signal
                const dataSignal = dataSignals.find(signal => (signal.name === data.name));
                if (dataSignal) {
                    //if we find a match, add it to our initialSignals
                    vegaInstance.initialSignals.push({
                        name: data.name,
                        value: (data as ValuesData).values,
                        priority: (data as ValuesData).values ? 1 : 0,
                        isData: true,
                    });
                }
            }
        }

        const instances = vegaInstances.map((vegaInstance): IInstance => {
            const { spec, view, initialSignals } = vegaInstance;
            const startBatch = (from: string) => {
                if (!vegaInstance.batch) {
                    signalBus.log(vegaInstance.id, 'starting batch', from);
                    vegaInstance.batch = {};
                    view.runAfter(() => {
                        const { batch } = vegaInstance;
                        vegaInstance.batch = undefined;
                        signalBus.log(vegaInstance.id, 'sending batch', batch);
                        signalBus.broadcast(vegaInstance.id, batch);
                    });
                }
            };
            return {
                ...vegaInstance,
                initialSignals,
                receiveBatch: async (batch, from) => {
                    signalBus.log(vegaInstance.id, 'received batch', batch, from);
                    return new Promise<void>(resolve => {
                        view.runAfter(async () => {
                            if (receiveBatch(batch, signalBus, vegaInstance)) {
                                signalBus.log(vegaInstance.id, 'running after _pulse, changes from', from);
                                vegaInstance.needToRun = true;
                            } else {
                                signalBus.log(vegaInstance.id, 'no changes');
                            }
                            signalBus.log(vegaInstance.id, 'running view after _pulse finished');
                            resolve();
                        });
                    });
                },
                broadcastComplete: async () => {
                    signalBus.log(vegaInstance.id, 'broadcastComplete');
                    if (vegaInstance.needToRun) {
                        view.runAfter(() => {
                            view.runAsync();    //do not await, since we are already in a runAfter
                            vegaInstance.needToRun = false;
                            signalBus.log(vegaInstance.id, 'running view after broadcastComplete');
                        });
                    }
                },
                beginListening: (sharedSignals) => {
                    for (const { isData, signalName } of sharedSignals) {
                        if (ignoredSignals.includes(signalName)) return;
                        if (isData) {
                            const matchData = spec.data?.find(data => data.name === signalName);
                            if (matchData && vegaInstance.dataSignals.includes(matchData.name)) {
                                signalBus.log(vegaInstance.id, 'listening to data', signalName);

                                //if current signalbus value has not been initialized and we have data, send it through
                                if (signalBus.signalDeps[signalName].value === undefined
                                    && view.data(signalName)?.length > 0) {
                                    signalBus.log(vegaInstance.id, 'un-initialized', signalName);
                                    const batch: Batch = {};
                                    batch[signalName] = { value: view.data(signalName), isData: true };
                                    signalBus.broadcast(vegaInstance.id, batch);
                                }

                                view.addDataListener(signalName, async (name, value) => {
                                    startBatch(`data:${signalName}`);
                                    vegaInstance.batch[name] = { value, isData };
                                });
                            }
                        }
                        const matchSignal = spec.signals?.find(signal => signal.name === signalName);
                        if (matchSignal) {
                            //only listen to signals that are change sources
                            const isChangeSource =
                                (matchSignal as BaseSignal).on ||   // event streams
                                (matchSignal as NewSignal).bind ||  // ui elements
                                (matchSignal as NewSignal).update   // calculations
                                ;
                            if (isChangeSource) {
                                signalBus.log(vegaInstance.id, 'listening to signal', signalName);
                                view.addSignalListener(signalName, async (name, value) => {
                                    startBatch(`signal:${signalName}`);
                                    vegaInstance.batch[name] = { value, isData };
                                });
                            } else {
                                //signalBus.log(vegaInstance.id, 'not listening to signal, not a change source', signalName);
                            }
                        } else {
                            //signalBus.log(vegaInstance.id, 'not listening to signal, no match', signalName);
                        }
                    }
                },
                getCurrentSignalValue: (signalName: string) => {
                    const matchSignal = spec.signals?.find(signal => signal.name === signalName);
                    if (matchSignal) {
                        return view.signal(signalName);
                    } else {
                        return undefined;
                    }
                },
                destroy: () => {
                    vegaInstance.view.finalize();
                },
            };
        });
        return instances;
    },
};

function receiveBatch(batch: Batch, signalBus: SignalBus, vegaInstance: VegaInstance) {
    const { spec, view } = vegaInstance;
    const doLog = signalBus.logLevel === LogLevel.all;
    doLog && signalBus.log(vegaInstance.id, 'receiveBatch', batch);
    let hasAnyChange = false;
    for (const signalName in batch) {
        const batchItem = batch[signalName];
        if (ignoredSignals.includes(signalName)) {
            doLog && signalBus.log(vegaInstance.id, 'ignoring reserved signal name', signalName, batchItem.value);
            continue;
        }
        if (batchItem.isData) {
            let logReason: string;
            if (!batchItem.value) {
                logReason = 'not updating data, no value';
            } else {
                const matchData = spec.data?.find(data => data.name === signalName);
                if (!matchData) {
                    logReason = 'not updating data, no match';
                } else {
                    logReason = 'updating data';
                    
                    // Use structuredClone to ensure deep copy
                    // vega may efficiently have symbols on data to cache a datum's values
                    // so this needs to appear to be new data
                    const data = structuredClone(batchItem.value);

                    view.change(signalName, changeset().remove(() => true).insert(data));
                    hasAnyChange = true;
                }
            }
            doLog && signalBus.log(vegaInstance.id, `(isData) ${logReason}`, signalName, batchItem.value);
        }
        let logReason = '';
        const matchSignal = spec.signals?.find(signal => signal.name === signalName);
        if (!matchSignal) {
            logReason = 'not updating signal, no match';
        } else {
            if ((matchSignal as NewSignal).update) {
                logReason = 'not updating signal, it is a calculation';
            } else {
                if (isSignalDataBridge(matchSignal)) {
                    logReason = 'not updating signal, data bridge';
                } else {
                    const oldValue = view.signal(signalName);
                    if (oldValue === batchItem.value) {
                        logReason = 'not updating signal, same value';
                    } else {
                        logReason = 'updating signal';
                        view.signal(signalName, batchItem.value);
                        hasAnyChange = true;
                    }
                }
            }
        }
        doLog && signalBus.log(vegaInstance.id, logReason, signalName, batchItem.value);
    }
    return hasAnyChange;
}

function createSpecInit(container: Element, index: number, spec: Spec) {
    const initialSignals: PrioritizedSignal[] = spec.signals?.map((signal: InitSignal | NewSignal) => {
        if (ignoredSignals.includes(signal.name)) return;
        let isData = isSignalDataBridge(signal as NewSignal);
        //dataSignalPrefix will set isData to true
        if (signal.name.startsWith(defaultCommonOptions.dataSignalPrefix)) {
            isData = true;
        }
        return {
            name: signal.name,
            value: signal.value,
            priority: signal.bind ? 1 : 0,
            isData,
        };
    }).filter(Boolean) || [];
    const specInit: SpecInit = { container, index, initialSignals, spec };
    return specInit;
}

async function createVegaInstance(specInit: SpecInit, renderer: Renderer, errorHandler: ErrorHandler) {
    const { container, index, initialSignals, spec } = specInit;
    const id = `${pluginName}-${index}`;

    let runtime: Runtime;
    let view: View;

    try {
        runtime = parse(spec);
    } catch (e) {
        container.innerHTML = `<div class="error">${e.toString()}</div>`;
        errorHandler(e, pluginName, index, 'parse', container);
        return;
    }

    try {
        view = new View(runtime, {
            container,
            renderer: renderer.options.vegaRenderer,
            logger: new VegaLogger(error => {
                errorHandler(error, pluginName, index, 'view', container);
            }),
        });
        view.run();

        //fix up initial signals
        for (const signal of initialSignals) {
            if (signal.isData) continue; //skip data signals
            const currentValue = view.signal(signal.name);
            if (currentValue !== signal.value) {
                renderer.signalBus.log(id, 're-setting initial signal', signal.name, signal.value, currentValue);
                signal.value = currentValue;
            }
        }

    } catch (e) {
        container.innerHTML = `<div class="error">${e.toString()}</div>`;
        errorHandler(e, pluginName, index, 'view', container);
        return;
    }

    //make a dataSignals array that is made of all the signals that are marked as isData, where the name is in the spec data
    const dataSignals = initialSignals.filter(signal => signal.isData && spec.data?.some(data => data.name === signal.name)).map(signal => signal.name);

    const instance: VegaInstance = { ...specInit, view, id, dataSignals };
    return instance;
}

function isSignalDataBridge(signal: NewSignal) {
    return signal.update === `data('${signal.name}')`;
}

function prioritizeSignalValues(specInits: SpecInit[]) {
    const highPrioritySignals = specInits.map(specInit => specInit.initialSignals.filter(signal => signal.priority > 0)).flat();
    for (const specInit of specInits) {
        for (const prioritySignal of highPrioritySignals) {
            const matchSignal = specInit.spec.signals?.find(signal => signal.name === prioritySignal.name);
            if (matchSignal && (matchSignal as NewSignal).value !== undefined && (matchSignal as NewSignal).value !== prioritySignal.value) {
                (matchSignal as NewSignal).value = prioritySignal.value;
            }
        }
    }
}

let expressionsInitialized = false;

class VegaLogger implements LoggerInterface {
    private logLevel: number = 0;

    constructor(private errorHandler: (error: Error) => void) {
        this.error = this.error.bind(this);
        this.warn = this.warn.bind(this);
        this.info = this.info.bind(this);
        this.debug = this.debug.bind(this);
    }

    level(level: number): this;
    level(): number;
    level(level?: number): this | number {
        if (level === undefined) {
            return this.logLevel;
        }
        this.logLevel = level;
        return this;
    }

    error(...args: readonly any[]) {
        if (this.errorHandler) {
            this.errorHandler(args[0]);
        }
        if (this.logLevel >= 1) {
            console.error(...args);
        }
        return this;
    }

    warn(...args: readonly any[]) {
        if (this.logLevel >= 2) {
            console.warn(...args);
        }
        return this;
    }

    info(...args: readonly any[]) {
        if (this.logLevel >= 3) {
            console.info(...args);
        }
        return this;
    }

    debug(...args: readonly any[]) {
        if (this.logLevel >= 4) {
            console.debug(...args);
        }
        return this;
    }
}
