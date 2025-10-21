import { InteractiveDocument } from "@microsoft/chartifact-schema";
import { validateDataLoader } from "./loader.js";
import { validateGroup } from "./group.js";


export async function validateDocument(page: InteractiveDocument) {
    const errors: string[] = [];

    if (!page.title) {
        errors.push('Page title is required.');
    }

    const dataLoaders = page.dataLoaders || [];
    const variables = page.variables || [];
    const tabulatorElements = page.groups.flatMap(group => group.elements.filter(e => typeof e !== 'string' && e.type === 'tabulator'));

    // Check for duplicate dataLoader names
    const dataLoaderNames = new Set<string>();
    for (const dataLoader of dataLoaders) {
        if (dataLoaderNames.has(dataLoader.dataSourceName)) {
            errors.push(`Duplicate dataLoader name: '${dataLoader.dataSourceName}' - each dataLoader must have a unique dataSourceName`);
        }
        dataLoaderNames.add(dataLoader.dataSourceName);
    }

    // Check for duplicate variable IDs
    const variableIds = new Set<string>();
    for (const variable of variables) {
        if (variableIds.has(variable.variableId)) {
            errors.push(`Duplicate variable ID: '${variable.variableId}' - each variable must have a unique variableId`);
        }
        variableIds.add(variable.variableId);
    }

    for (const dataLoader of dataLoaders) {
        const otherDataLoaders = dataLoaders.filter(dl => dl !== dataLoader);
        errors.push(...await validateDataLoader(dataLoader, variables, tabulatorElements, otherDataLoaders));
    }

    for (const [groupIndex, group] of page.groups.entries()) {
        errors.push(...await validateGroup(group, groupIndex, variables, dataLoaders, page.resources?.charts));
    }
    return errors;
}
