import { PageElement, Variable, DataLoader, CheckboxElement, DropdownElement, SliderElement, TextboxElement, ChartElement, ImageElement, MermaidElement, Vega_or_VegaLite_spec } from "@microsoft/chartifact-schema";
import { getChartType } from "../util.js";
import { validateVegaLite, validateVegaChart } from "./chart.js";
import { validateVariableID, validateRequiredString, validateOptionalString, validateOptionalPositiveNumber, validateOptionalBoolean, validateOptionalObject, validateInputElementWithVariableId } from "./common.js";

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

export async function validateElement(element: PageElement, variables: Variable[], dataLoaders: DataLoader[], charts?: { [chartKey: string]: Vega_or_VegaLite_spec }) {
    const errors: string[] = [];
    if (!element) {
        errors.push('Element must not be null');
    } else {
        if (typeof element === 'object') {
            switch (element.type) {
                case 'chart': {
                    const chartElement = element as ChartElement;
                    if (!chartElement.chartKey) {
                        errors.push('Chart element must have a chartKey');
                    } else if (!charts) {
                        errors.push('Document must have a resources.charts section to use chart elements');
                    } else if (!charts[chartElement.chartKey]) {
                        errors.push(`Chart key '${chartElement.chartKey}' not found in resources.charts`);
                    } else {
                        // Validate the referenced chart spec
                        const chartSpec = charts[chartElement.chartKey];
                        const chartType = getChartType(chartSpec);
                        if (chartType === 'vega-lite') {
                            errors.push(...validateVegaLite(chartSpec));
                        } else if (chartType === 'vega') {
                            errors.push(...validateVegaChart(chartSpec));
                        } else {
                            errors.push(`Chart '${chartElement.chartKey}' has unrecognized chart type`);
                        }
                    }
                    break;
                }
                case 'checkbox': {
                    errors.push(...validateInputElementWithVariableId(element));
                    break;
                }
                case 'image': {
                    const imageElement = element as ImageElement;
                    
                    // Validate required url property
                    errors.push(...validateRequiredString(imageElement.url, 'url', 'Image'));
                    
                    // Validate optional alt property
                    errors.push(...validateOptionalString(imageElement.alt, 'alt', 'Image'));
                    
                    // Validate optional height and width properties
                    errors.push(...validateOptionalPositiveNumber(imageElement.height, 'height', 'Image'));
                    errors.push(...validateOptionalPositiveNumber(imageElement.width, 'width', 'Image'));
                    
                    break;
                }
                case 'mermaid': {
                    const mermaidElement = element as MermaidElement;
                    
                    // At least one of diagramText, template, or variableId must be present
                    if (!mermaidElement.diagramText && !mermaidElement.template && !mermaidElement.variableId) {
                        errors.push('Mermaid element must have at least one of: diagramText, template, or variableId');
                    }
                    
                    // Validate diagramText if present
                    errors.push(...validateOptionalString(mermaidElement.diagramText, 'diagramText', 'Mermaid'));
                    if (mermaidElement.diagramText && mermaidElement.diagramText.trim() === '') {
                        errors.push('Mermaid element diagramText cannot be empty');
                    }
                    
                    // Validate template if present
                    if (mermaidElement.template) {
                        errors.push(...validateOptionalObject(mermaidElement.template, 'template', 'Mermaid'));
                        if (typeof mermaidElement.template === 'object' && mermaidElement.template !== null) {
                            errors.push(...validateRequiredString(mermaidElement.template.header, 'template.header', 'Mermaid'));
                            if (!mermaidElement.template.lineTemplates) {
                                errors.push('Mermaid element template must have a lineTemplates property');
                            } else if (typeof mermaidElement.template.lineTemplates !== 'object' || 
                                     mermaidElement.template.lineTemplates === null || 
                                     Array.isArray(mermaidElement.template.lineTemplates)) {
                                errors.push('Mermaid element template.lineTemplates must be an object');
                            }
                            errors.push(...validateOptionalString(mermaidElement.template.dataSourceName, 'template.dataSourceName', 'Mermaid'));
                        }
                    }
                    
                    // Validate variableId if present (follows OptionalVariableControl)
                    if (mermaidElement.variableId) {
                        errors.push(...validateVariableID(mermaidElement.variableId));
                    }
                    
                    break;
                }
                case 'dropdown': {
                    errors.push(...validateInputElementWithVariableId(element));
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
                    errors.push(...validateInputElementWithVariableId(element));
                    break;
                }
                case 'tabulator': {
                    errors.push(...validateRequiredString(element.dataSourceName, 'dataSourceName', 'Tabulator'));
                    errors.push(...validateOptionalBoolean(element.editable, 'editable', 'Tabulator'));
                    errors.push(...validateOptionalObject(element.tabulatorOptions, 'tabulatorOptions', 'Tabulator'));
                    // TODO: validate tabulatorOptions properties later
                    break;
                }
                case 'textbox': {
                    errors.push(...validateInputElementWithVariableId(element));
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
