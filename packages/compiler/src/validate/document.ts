import { InteractiveDocument } from "@microsoft/chartifact-schema";
import { validateDataLoader } from "./loader.js";
import { validateGroup } from "./group.js";


export async function validateDocument(page: InteractiveDocument, isNew: boolean) {
    const errors: string[] = [];

    if (!page.title) {
        errors.push('Page title is required.');
    }

    //variables
    if (!page.variables) {
        errors.push('Page must have a variables array (even if empty).');
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
