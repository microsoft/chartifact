import { ElementGroup, Variable, DataLoader, Vega_or_VegaLite_spec } from "@microsoft/chartifact-schema";
import { flattenMarkdownElements, validateElement } from "./element.js";


export async function validateGroup(group: ElementGroup, variables: Variable[], dataLoaders: DataLoader[], charts?: { [chartKey: string]: Vega_or_VegaLite_spec }) {
    const errors: string[] = [];

    //concatenate markdown elements
    group.elements = flattenMarkdownElements(group.elements);

    // Validate all elements
    for (const e of group.elements) {
        const elementValidationErrors = await validateElement(e, variables, dataLoaders, charts);
        if (elementValidationErrors.length > 0) {
            errors.push(...elementValidationErrors);
        }
    }

    return errors;
}
