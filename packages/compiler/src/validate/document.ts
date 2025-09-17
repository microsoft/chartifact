import { InteractiveDocument } from "@microsoft/chartifact-schema";
import { validateDataLoader } from "./loader.js";
import { validateGroup } from "./group.js";


export async function validateDocument(page: InteractiveDocument) {
    const errors: string[] = [];

    if (!page.title) {
        errors.push('Page title is required.');
    }

    for (const dataLoader of page.dataLoaders || []) {
        const otherDataLoaders = (page.dataLoaders || []).filter(dl => dl !== dataLoader);
        errors.push(...await validateDataLoader(dataLoader, page.variables, otherDataLoaders));
    }

    for (const group of page.groups) {
        errors.push(...await validateGroup(group, page.variables, page.dataLoaders, page.resources?.charts));
    }
    return errors;
}
