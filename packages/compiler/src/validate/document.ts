import { InteractiveDocument } from "@microsoft/chartifact-schema";
import { validateDataLoader } from "./loader.js";
import { validateGroup } from "./group.js";
import { validateVegaChart, validateVegaLite } from "./chart.js";
import { getChartType } from "../util.js";


export async function validateDocument(page: InteractiveDocument, isNew: boolean) {
    const errors: string[] = [];

    if (!page.title) {
        errors.push('Page title is required.');
    }

    //variables
    if (!page.variables) {
        errors.push('Page must have a variables array (even if empty).');
    }

    // validate resources.charts if present
    if (page.resources?.charts) {
        for (const [chartKey, chartSpec] of Object.entries(page.resources.charts)) {
            if (!chartKey || typeof chartKey !== 'string') {
                errors.push('Chart keys must be non-empty strings');
                continue;
            }
            if (!chartSpec || typeof chartSpec !== 'object') {
                errors.push(`Chart '${chartKey}' must have a valid spec object`);
                continue;
            }
            
            const chartType = getChartType(chartSpec);
            if (chartType === 'vega-lite') {
                errors.push(...validateVegaLite(chartSpec));
            } else if (chartType === 'vega') {
                errors.push(...validateVegaChart(chartSpec));
            } else {
                errors.push(`Chart '${chartKey}' has unrecognized chart type`);
            }
        }
    }

    for (const dataLoader of page.dataLoaders || []) {
        const otherDataLoaders = (page.dataLoaders || []).filter(dl => dl !== dataLoader);
        errors.push(...await validateDataLoader(dataLoader, page.variables, otherDataLoaders));
    }

    for (const group of page.groups) {
        errors.push(...await validateGroup(group, isNew, page.variables, page.dataLoaders, page.resources?.charts));
    }
    return errors;
}
