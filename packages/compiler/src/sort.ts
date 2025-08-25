/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Variable } from '@microsoft/chartifact-schema';
import { calculationType } from './spec.js';
import { parseExpression } from 'vega';
import { collectIdentifiers } from 'common';

export function topologicalSort(list: Variable[]) {
    const nameToObject = new Map<string, Variable>();
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    for (const obj of list) {
        nameToObject.set(obj.variableId, obj);
        inDegree.set(obj.variableId, 0);
        graph.set(obj.variableId, []);
    }

    for (const obj of list) {
        let sources: string[] = [];

        const calculation = calculationType(obj);

        if (calculation?.dfCalc) {
            sources = calculation.dfCalc.dataSourceNames || [];
        } else if (calculation?.scalarCalc) {
            const ast = parseExpression(calculation.scalarCalc.vegaExpression);
            sources = [...collectIdentifiers(ast)];
        }

        for (const dep of sources) {
            if (!graph.has(dep)) {
                continue; // Skip if the dependency is not in the list
            }
            graph.get(dep)!.push(obj.variableId);
            inDegree.set(obj.variableId, inDegree.get(obj.variableId)! + 1);
        }
    }

    const queue: string[] = [];
    for (const [name, degree] of inDegree.entries()) {
        if (degree === 0) queue.push(name);
    }

    const sorted: Variable[] = [];
    while (queue.length) {
        const current = queue.shift()!;
        sorted.push(nameToObject.get(current)!);

        for (const neighbor of graph.get(current)!) {
            inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        }
    }

    if (sorted.length !== list.length) {
        throw new Error("Cycle or missing dependency detected");
    }

    return sorted;
}
