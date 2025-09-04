import { ElementGroup, Variable, DataLoader } from "@microsoft/chartifact-schema";
import { flattenMarkdownElements, validateElement } from "./element.js";


export async function validateGroup(group: ElementGroup, isNew: boolean, variables: Variable[], dataLoaders: DataLoader[]) {
    const errors: string[] = [];

    //concatenate markdown elements
    group.elements = flattenMarkdownElements(group.elements);

    if (isNew) {
        // Make all charts have FullChartValue
        for (const e of group.elements) {
            if (typeof e === 'object' && e.type === 'chart') {

                //OUTDATED

                // //originally was ChartPlaceholder, but we want to make sure it's ChartFull
                // const fullChartValue = e.chart as ChartFull;

                // //TODO: make sure chartTemplateKey exists in the list of available chart templates

                // fullChartValue.spec = {
                //     "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                //     "data": {
                //         "values": [
                //             {
                //                 "url": "/img/chart-spinner.gif"
                //             }
                //         ]
                //     },
                //     "mark": {
                //         "type": "image",
                //         "width": 300,
                //         "height": 300
                //     },
                //     "encoding": {
                //         "url": {
                //             "field": "url",
                //             "type": "nominal"
                //         }
                //     }
                // };
            } else {
                const elementValidationErrors = await validateElement(e, variables, dataLoaders);
                if (elementValidationErrors.length > 0) {
                    errors.push(...elementValidationErrors);
                }
            }
        }
    }

    return errors;
}
