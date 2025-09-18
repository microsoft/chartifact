import { Variable, DataLoader, Calculation, TabulatorElement } from '@microsoft/chartifact-schema';
import { parse } from 'vega';
import { createSpecWithVariables } from '../spec.js';
import { validateTransforms } from './transforms.js';

const illegalChars = '/|\\\'"`,.;:~-=+?!@#$%^&*()[]{}<>';

export const ignoredSignals = ['width', 'height', 'padding', 'autosize', 'background', 'style', 'parent', 'datum', 'item', 'event', 'cursor', 'origins'];

// Utility functions for property validation
export function validateRequiredString(value: any, propertyName: string, elementType: string): string[] {
    const errors: string[] = [];
    if (!value) {
        errors.push(`${elementType} element must have a ${propertyName} property`);
    } else if (typeof value !== 'string') {
        errors.push(`${elementType} element ${propertyName} must be a string`);
    } else if (value.trim() === '') {
        errors.push(`${elementType} element ${propertyName} cannot be empty`);
    }
    return errors;
}

export function validateOptionalString(value: any, propertyName: string, elementType: string): string[] {
    const errors: string[] = [];
    if (value !== undefined && typeof value !== 'string') {
        errors.push(`${elementType} element ${propertyName} must be a string`);
    }
    return errors;
}

export function validateOptionalPositiveNumber(value: any, propertyName: string, elementType: string): string[] {
    const errors: string[] = [];
    if (value !== undefined) {
        if (typeof value !== 'number') {
            errors.push(`${elementType} element ${propertyName} must be a number`);
        } else if (value <= 0) {
            errors.push(`${elementType} element ${propertyName} must be a positive number`);
        }
    }
    return errors;
}

export function validateOptionalBoolean(value: any, propertyName: string, elementType: string): string[] {
    const errors: string[] = [];
    if (value !== undefined && typeof value !== 'boolean') {
        errors.push(`${elementType} element ${propertyName} must be a boolean`);
    }
    return errors;
}

export function validateOptionalObject(value: any, propertyName: string, elementType: string): string[] {
    const errors: string[] = [];
    if (value !== undefined) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            errors.push(`${elementType} element ${propertyName} must be an object`);
        }
    }
    return errors;
}

export function validateInputElementWithVariableId(element: { type: string; variableId: string }): string[] {
    const errors: string[] = [];
    errors.push(...validateVariableID(element.variableId));

    // Check if variableId contains element type
    if (element.variableId.includes(element.type)) {
        errors.push(`VariableID must not contain the element type: ${element.type}`);
    }

    return errors;
}

export function validateVariableID(id: string): string[] {
    if (!id) {
        return ['VariableID must not be null'];
    }
    const errors: string[] = [];
    if (ignoredSignals.includes(id)) {
        errors.push(`VariableID must not be one of the following reserved words: ${ignoredSignals.join(', ')}`);
    }
    //check for illegal characters
    for (let i = 0; i < illegalChars.length; i++) {
        if (id.includes(illegalChars[i])) {
            errors.push(`VariableID must not contain the following characters: ${illegalChars}`);
            break;
        }
    }
    return errors;
}

export const variableTypes = ['number', 'string', 'boolean'];

// HTML tag detection regex - matches opening and closing HTML tags
const HTML_TAG_REGEX = /<\/?[a-zA-Z][a-zA-Z0-9\-]*(?:\s[^>]*)?>|<![^>]*>/g;

export function validateMarkdownString(value: string, propertyName: string, elementType: string): string[] {
    const errors: string[] = [];
    if (value && typeof value === 'string') {
        const htmlMatches = value.match(HTML_TAG_REGEX);
        if (htmlMatches && htmlMatches.length > 0) {
            errors.push(`${elementType} ${propertyName} must not contain HTML elements. Found: ${htmlMatches.slice(0, 3).join(', ')}${htmlMatches.length > 3 ? '...' : ''}`);
        }
    }
    return errors;
}

export function validateVariable(variable: Variable, otherVariables: Variable[], tabulatorElements: TabulatorElement[], dataLoaders: DataLoader[]): string[] {
    const errors: string[] = [];

    if (typeof variable !== 'object' || variable === null) {
        errors.push('Variable must be an object.');
        return errors;
    }

    if (!variable.variableId) {
        errors.push('Variable must have a variableId property.');
    } else if (typeof variable.variableId !== 'string') {
        errors.push('Variable variableId must be a string.');
    } else {
        const idErrors = validateVariableID(variable.variableId);
        if (idErrors.length > 0) {
            errors.push(...idErrors);
        }
    }

    //check if is array is set to true, but type is not an array type
    if (variable.isArray) {
        if (!Array.isArray(variable.initialValue)) {
            errors.push('Variable isArray is true, but initialValue is not an array.');
        } else {
            //check if all elements of initialValue are of the same type as variable.type
            for (let i = 0; i < variable.initialValue.length; i++) {
                if (typeof variable.initialValue[i] !== variable.type) {
                    errors.push(`Variable initialValue[${i}] must be of type ${variable.type}.`);
                }
                //children may not be arrays
                if (Array.isArray(variable.initialValue[i])) {
                    errors.push(`Variable initialValue[${i}] must not be an array.`);
                }
            }
        }
    } else {
        //check if is array is set to false, but type is an array type
        if (Array.isArray(variable.initialValue)) {
            errors.push('Variable isArray is false, but initialValue is an array.');
        } else {

            //check if type of initialValue is the same as type of variable
            if (typeof variable.initialValue !== variable.type) {
                errors.push(`Variable initialValue must be of type ${variable.type}.`);
            }
        }
    }

    if (variable.calculation) {
        const calculationErrors = validateCalculation(variable.calculation, otherVariables, tabulatorElements, dataLoaders);
        if (calculationErrors.length > 0) {
            errors.push(...calculationErrors.map((error) => `Calculation error: ${error}`));
        }
    }

    //check for duplicate variableId
    const existingVariable = otherVariables.find((v) => v.variableId === variable.variableId);
    if (existingVariable) {
        errors.push(`Variable with variableId ${variable.variableId} already exists.`);
    }

    //check for collision with data loader names
    const existingDataLoader = dataLoaders.filter(ds => ds.type !== 'spec').find((dl) => dl.dataSourceName === variable.variableId);
    if (existingDataLoader) {
        errors.push(`Variable with variableId ${variable.variableId} collides with data loader name ${existingDataLoader.dataSourceName}.`);
    }

    return errors;
}

export function validateCalculation(calculation: Calculation, variables: Variable[], tabulatorElements: TabulatorElement[], dataLoaders: DataLoader[]): string[] {
    const errors: string[] = [];

    if (typeof calculation !== 'object' || calculation === null) {
        errors.push('Calculation must be an object.');
        return errors;
    }

    // Check if this is a DataFrameCalculation
    if ('dataSourceNames' in calculation || 'dataFrameTransformations' in calculation) {
        // Validate DataFrameCalculation
        const dfCalc = calculation as any; // Using any for now to access properties

        if (dfCalc.dataSourceNames) {
            if (!Array.isArray(dfCalc.dataSourceNames)) {
                errors.push('DataFrameCalculation dataSourceNames must be an array.');
            } else {
                // Validate that all referenced data sources exist
                dfCalc.dataSourceNames.forEach((dsName: string, index: number) => {
                    if (typeof dsName !== 'string') {
                        errors.push(`DataFrameCalculation dataSourceNames[${index}] must be a string.`);
                    } else {
                        // Check if the data source exists in variables or dataLoaders
                        const existsInVariables = variables.some(v => v.variableId === dsName);
                        const existsInDataLoaders = dataLoaders.filter(dl => {
                            return dl.type !== 'spec';
                        }).some(dl => dl.dataSourceName === dsName);
                        if (!existsInVariables && !existsInDataLoaders) {
                            errors.push(`DataFrameCalculation references unknown data source: ${dsName}`);
                        }
                    }
                });
            }
        }

        if (dfCalc.dataFrameTransformations) {
            errors.push(...validateTransforms(dfCalc.dataFrameTransformations, variables, tabulatorElements, dataLoaders));
        }
    } else if ('vegaExpression' in calculation) {
        // Validate ScalarCalculation
        const scalarCalc = calculation as any;
        if (typeof scalarCalc.vegaExpression !== 'string') {
            errors.push('ScalarCalculation vegaExpression must be a string.');
        } else if (scalarCalc.vegaExpression.indexOf('\n') !== -1) {
            errors.push('ScalarCalculation vegaExpression must not contain newlines.');
        }
        errors.push(...validateVegaExpression(scalarCalc.vegaExpression, variables, tabulatorElements, dataLoaders));
    } else {
        errors.push('Calculation must be either a DataFrameCalculation (with dataSourceNames/dataFrameTransformations) or ScalarCalculation (with vegaExpression).');
    }

    return errors;
}

export function validateVegaExpression(vegaExpression: string, variables: Variable[], tabulatorElements: TabulatorElement[], dataLoaders: DataLoader[]): string[] {
    const errors: string[] = [];

    //create a Vega spec to validate the expression
    const spec = createSpecWithVariables(variables, tabulatorElements, dataLoaders);

    //now add one more signal with the calculation expression
    spec.signals.push({
        name: 'calculation',
        update: vegaExpression,
    });

    try {
        parse(spec);
    } catch (e) {
        errors.push(`Calculation vegaExpression is invalid: ${e.message}`);
    }
    return errors;
}
