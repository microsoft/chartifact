import { ElementGroup, Variable, DataLoader, Vega_or_VegaLite_spec } from "@microsoft/chartifact-schema";
import { flattenMarkdownElements, validateElement } from "./element.js";


export async function validateGroup(group: ElementGroup, groupIndex: number, variables: Variable[], dataLoaders: DataLoader[], charts?: { [chartKey: string]: Vega_or_VegaLite_spec }) {
    const errors: string[] = [];

    //concatenate markdown elements
    group.elements = flattenMarkdownElements(group.elements);

    // Validate all elements
    for (const [index, e] of group.elements.entries()) {
        const elementValidationErrors = await validateElement(e, groupIndex, index, variables, dataLoaders, charts);
        if (elementValidationErrors.length > 0) {
            errors.push(...elementValidationErrors);
        }
    }

    return errors;
}
