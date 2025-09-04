import { Variable, DataLoader, Calculation } from '@microsoft/chartifact-schema';
import { parse } from 'vega';
import { createSpecWithVariables } from '../spec.js';
import { validateTransforms } from './transforms.js';

const illegalChars = '/|\\\'"`,.;:~-=+?!@#$%^&*()[]{}<>';

export const ignoredSignals = ['width', 'height', 'padding', 'autosize', 'background', 'style', 'parent', 'datum', 'item', 'event', 'cursor', 'origins'];

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

export function validateVariable(variable: Variable, otherVariables: Variable[], dataLoaders: DataLoader[]): string[] {
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
        const calculationErrors = validateCalculation(variable.calculation, otherVariables, dataLoaders);
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

export function validateCalculation(calculation: Calculation, variables: Variable[], dataLoaders: DataLoader[]): string[] {
    const errors: string[] = [];

    if (typeof calculation !== 'object' || calculation === null) {
        errors.push('Calculation must be an object.');
        return errors;
    }

    
    //OUTDATED
    // if (!calculation.vegaExpression && !calculation.dataFrameTransformations) {
    //     errors.push('Calculation must have either a vegaExpression or dataFrameTransformation property.');
    // } else {
    //     if (calculation.dataFrameTransformations) {
    //         errors.push(...validateTransforms(calculation.dataFrameTransformations));
    //     } else if (calculation.vegaExpression) {
    //         if (typeof calculation.vegaExpression !== 'string') {
    //             errors.push('Calculation vegaExpression must be a string.');
    //         } else if (calculation.vegaExpression.indexOf('\n') !== -1) {
    //             errors.push('Calculation vegaExpression must not contain newlines.');
    //         } else {
    //             //create a Vega spec to validate the expression
    //             const spec = createSpecWithVariables(variables, dataLoaders);

    //             //now add one more signal with the calculation expression
    //             spec.signals.push({
    //                 name: 'calculation',
    //                 update: calculation.vegaExpression,
    //             });

    //             try {
    //                 parse(spec);
    //             } catch (e) {
    //                 errors.push(`Calculation vegaExpression is invalid: ${e.message}`);
    //             }
    //         }
    //     }
    // }

    return errors;
}
