import { DataLoader, TabulatorElement, Variable } from "@microsoft/chartifact-schema";
import { validateDataSource } from "./data.js";

/**
 * Validates a loader object (can be from Variable.loader or DataLoader)
 * @param loader - The loader object to validate
 * @param context - Context string for error messages (e.g., 'Variable loader' or 'DataLoader')
 */
export function validateLoaderContent(loader: any, context: string): string[] {
    const errors: string[] = [];
    
    if (!loader.type) {
        errors.push(`${context} must have a type property`);
        return errors;
    }

    switch (loader.type) {
        case 'inline':
            if (!loader.content) {
                errors.push(`${context} of type "inline" must have content`);
            }
            // Validate format
            if (loader.format) {
                switch (loader.format) {
                    case 'json':
                    case 'csv':
                    case 'tsv':
                    case 'dsv':
                        break;
                    default:
                        errors.push(`${context} format "${loader.format}" is not supported`);
                }
            }
            break;
        case 'file':
            if (!loader.filename) {
                errors.push(`${context} of type "file" must have filename`);
            }
            if (!loader.content) {
                errors.push(`${context} of type "file" must have content`);
            }
            break;
        case 'url':
            if (!loader.url) {
                errors.push(`${context} of type "url" must have url`);
            }
            break;
        case 'spec':
            if (!loader.spec) {
                errors.push(`${context} of type "spec" must have spec`);
            }
            if (typeof loader.spec !== 'object') {
                errors.push(`${context} spec must be an object`);
            }
            break;
        default:
            errors.push(`${context} has unsupported type: ${loader.type}`);
    }
    
    return errors;
}

export async function validateDataLoader(dataLoader: DataLoader, variables: Variable[], tabulatorElements: TabulatorElement[], otherDataLoaders: DataLoader[]) {
    const errors: string[] = [];
    if (typeof dataLoader !== 'object') {
        errors.push('DataLoader must be an object');
        return errors;
    }

    // Validate loader content
    errors.push(...validateLoaderContent(dataLoader, 'DataLoader'));

    // For non-spec types, validate as data source
    if (dataLoader.type !== 'spec' && dataLoader.type) {
        errors.push(...validateDataSource(dataLoader, variables, tabulatorElements, otherDataLoaders.filter(dl => dl.type !== 'spec')));
    }

    return errors;
}
