import { PageElement, Variable, DataLoader, CheckboxElement, DropdownElement, SliderElement, TextboxElement } from "@microsoft/chartifact-schema";
import { getChartType } from "../util.js";
import { validateVegaLite, validateVegaChart } from "./chart.js";
import { validateVariableID } from "./common.js";

export function flattenMarkdownElements(elements: PageElement[]) {
    return elements.reduce((acc, e) => {
        if (typeof e === 'string') {
            if (acc.length > 0 && typeof acc[acc.length - 1] === 'string') {
                acc[acc.length - 1] += '\n' + e;
            } else {
                acc.push(e);
            }
        } else {
            acc.push(e);
        }
        return acc;
    }, [] as PageElement[]);
}

export async function validateElement(element: PageElement, variables: Variable[], dataLoaders: DataLoader[]) {
    const errors: string[] = [];
    if (!element) {
        errors.push('Element must not be null');
    } else {
        if (typeof element === 'object') {
            switch (element.type) {
                case 'chart': {
                    //OUTDATED
                    // const chartFull = element..chart as ChartFull;
                    // if (!chartFull) {
                    //     errors.push('Chart must have a ChartValue');
                    // } else {
                    //     const { spec } = chartFull;
                    //     if (!spec) {
                    //         //it is a chart placeholder
                    //     } else {
                    //         const chartType = getChartType(spec);
                    //         if (chartType === 'vega-lite') {
                    //             errors.push(...validateVegaLite(chartFull.spec));
                    //         } else if (chartType === 'vega') {
                    //             errors.push(...validateVegaChart(chartFull.spec));
                    //         }
                    //     }
                    // }
                    break;
                }
                case 'checkbox': {
                    errors.push(...validateVariableID(element.variableId));
                    errors.push(error_idContainsType(element));
                    break;
                }
                case 'image': {
                    //OUTDATED
                    //errors.push(...validateUrlRef(element.url, variables, dataLoaders));
                    break;
                }
                case 'dropdown': {
                    errors.push(...validateVariableID(element.variableId));
                    errors.push(error_idContainsType(element));
                    //cannot have both static and dynamic options
                    if (element.options && element.dynamicOptions) {
                        errors.push('Dropdown cannot have both static and dynamic options');
                        break;
                    }
                    if (element.dynamicOptions) {
                        if (!element.dynamicOptions.dataSourceName) {
                            errors.push('Dynamic dropdown must have a data source name');
                        }
                        if (!element.dynamicOptions.fieldName) {
                            errors.push('Dynamic dropdown must have a field name');
                        }
                    }
                    if (element.options) {
                        // ensure each option is a string
                        if (!Array.isArray(element.options)) {
                            errors.push('Dropdown options must be an array of strings');
                        }
                        element.options.forEach((option, index) => {
                            if (typeof option !== 'string') {
                                errors.push(`Dropdown option at index ${index} must be a string`);
                            }
                        });
                    }
                    break;
                }
                case 'presets': {
                    break;
                }
                case 'slider': {
                    errors.push(...validateVariableID(element.variableId));
                    errors.push(error_idContainsType(element));
                    break;
                }
                case 'tabulator': {
                    if (!element.dataSourceName) {
                        errors.push('Tabulator must have a dataSourceName');
                    }
                    if (element.tabulatorOptions) {
                        // TODO validate Tabulator options
                    }
                    break;
                }
                case 'textbox': {
                    errors.push(...validateVariableID(element.variableId));
                    errors.push(error_idContainsType(element));
                    break;
                }
                default: {
                    errors.push(`Unknown element type: ${JSON.stringify(element)}`);
                    break;
                }
            }
        } else if (typeof element !== 'string') {
            errors.push('Element must be an array or a string.');
        }
    }
    return errors.filter(Boolean);
}

function error_idContainsType(element: CheckboxElement | DropdownElement | SliderElement | TextboxElement) {
    //get element type
    const elementType = element.type;
    //get variableId
    const variableId = element.variableId;
    //if variableId contains elementType, return error
    if (variableId.includes(elementType)) {
        return `VariableID must not contain the element type: ${elementType}`;
    }
    return null;
}
