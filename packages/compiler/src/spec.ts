/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Spec as VegaSpec } from 'vega-typings';
import { Variable, DataLoader, TabulatorElement, DataFrameCalculation, ScalarCalculation } from '@microsoft/chartifact-schema';
import { SourceData, ValuesData, Signal, NewSignal } from "vega";
import { topologicalSort } from "./sort.js";

export const $schema = "https://vega.github.io/schema/vega/v5.json";

export function createSpecWithVariables(variables: Variable[], tabulatorElements: TabulatorElement[], stubDataLoaders?: DataLoader[]) {

    //preload with variables as signals
    const spec: VegaSpec = {
        $schema: "https://vega.github.io/schema/vega/v5.json",
        description: "This is the central brain of the page",
        signals: [],
        data: [],
    };

    //add tabulator elements as data sources
    tabulatorElements.forEach((tabulator) => {
        const { variableId } = tabulator;
        if (!variableId) {
            return;
        }
        spec.signals.push(dataAsSignal(variableId));
        spec.data.unshift({
            name: variableId,
            values: [],
        });
    });

    //ensure (fake) data loaders are at the beginning of the data array
    if (stubDataLoaders) {
        //add data loaders as both signals and data sources
        stubDataLoaders.filter(dl => dl.type !== 'spec').forEach((dl) => {
            spec.signals.push(dataAsSignal(dl.dataSourceName));
            spec.data.push({
                name: dl.dataSourceName,
                values: [],
            });
        });
    }

    topologicalSort(variables).forEach((v) => {
        const calculation = calculationType(v);
        if (calculation?.dfCalc) {
            const { dataFrameTransformations } = calculation.dfCalc;
            const data: SourceData & Partial<ValuesData> = {
                name: v.variableId,
                source: calculation.dfCalc.dataSourceNames || [],
                transform: dataFrameTransformations,
            };
            spec.data.push(data);
            spec.signals.push(dataAsSignal(v.variableId));
        } else {
            const signal: Signal = { name: v.variableId, value: v.initialValue };
            if (calculation?.scalarCalc) {
                signal.update = calculation.scalarCalc.vegaExpression;
            }
            spec.signals.push(signal);
        }
    });

    return spec;
}

export function calculationType(variable: Variable) {
    const dfCalc = variable.calculation as DataFrameCalculation;
    if (dfCalc
        && variable.type === 'object'
        && !!variable.isArray
        && (
            (dfCalc.dataSourceNames !== undefined && dfCalc.dataSourceNames.length > 0)
            || (dfCalc.dataFrameTransformations !== undefined && dfCalc.dataFrameTransformations.length > 0)
        )) {
        return { dfCalc };
    }
    const scalarCalc = variable.calculation as ScalarCalculation;
    if (scalarCalc
        && (!(variable.type === 'object' && variable.isArray))
        && (scalarCalc.vegaExpression !== undefined && scalarCalc.vegaExpression.length > 0)) {
        return { scalarCalc };
    }
}

export function ensureDataAndSignalsArray(spec: VegaSpec) {
    if (!spec.data) {
        spec.data = [];
    }
    if (!spec.signals) {
        spec.signals = [];
    }
}

export function dataAsSignal(name: string): NewSignal {
    return {
        name,
        update: `data('${name}')`
    };
}   
