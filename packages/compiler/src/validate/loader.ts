import { DataLoader, TabulatorElement, Variable } from "@microsoft/chartifact-schema";
import { validateDataSource } from "./data.js";

export async function validateDataLoader(dataLoader: DataLoader, variables: Variable[], tabulatorElements: TabulatorElement[], otherDataLoaders: DataLoader[]) {
    const errors: string[] = [];
    if (typeof dataLoader !== 'object') {
        errors.push('DataLoader must be an object');
        return errors;
    }
    if (!dataLoader.type) {
        errors.push('DataLoader must have a type');
    }

    switch (dataLoader.type) {
        case 'file': {
            errors.push(...validateDataSource(dataLoader, variables, tabulatorElements, otherDataLoaders.filter(dl => dl.type !== 'spec')));
            //TODO check for collision with variable names
            //TODO other props
            break;
        }
        case 'url': {
            errors.push(...validateDataSource(dataLoader, variables, tabulatorElements, otherDataLoaders.filter(dl => dl.type !== 'spec')));
            //TODO check for collision with variable names

            break;
        }
        case 'spec': {
            if (!dataLoader.spec) {
                errors.push('DataLoader must have a spec');
            }
            if (typeof dataLoader.spec !== 'object') {
                errors.push('DataLoader spec must be an object');
            }
            //TODO validate spec
            break;
        }
        case 'inline': {
            //validate format
            if (dataLoader.format) {
                switch (dataLoader.format) {
                    case 'json':
                    case 'csv':
                    case 'tsv':
                    case 'dsv':
                        break;
                    default:
                        errors.push(`Inline DataLoader format "${dataLoader.format}" is not supported`);
                }
            }

            if (!dataLoader.content) {
                errors.push('Inline DataLoader must have content');
            }
            break;
        }
        default: {
            errors.push(`DataLoader type "${(dataLoader as DataLoader).type}" is not supported`);
        }
    }
    return errors;
}
