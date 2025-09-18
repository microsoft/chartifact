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

    for (const dataLoader of dataLoaders) {
        const otherDataLoaders = dataLoaders.filter(dl => dl !== dataLoader);
        errors.push(...await validateDataLoader(dataLoader, variables, tabulatorElements, otherDataLoaders));
    }

    for (const group of page.groups) {
        errors.push(...await validateGroup(group, variables, dataLoaders, page.resources?.charts));
    }
    return errors;
}
