import { PageElement, Variable, DataLoader, CheckboxElement, DropdownElement, SliderElement, TextboxElement, ChartElement, ImageElement, InspectorElement, MermaidElement, TreebarkElement, Vega_or_VegaLite_spec } from "@microsoft/chartifact-schema";
import { getChartType } from "../util.js";
import { validateVegaLite, validateVegaChart } from "./chart.js";
import { validateVariableID, validateRequiredString, validateOptionalString, validateOptionalPositiveNumber, validateOptionalBoolean, validateOptionalObject, validateInputElementWithVariableId, validateMarkdownString } from "./common.js";

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

export async function validateElement(element: PageElement, groupIndex: number, elementIndex: number, variables: Variable[], dataLoaders: DataLoader[], charts?: { [chartKey: string]: Vega_or_VegaLite_spec }) {
    const errors: string[] = [];
    if (element == null) {  //catch both null and undefined
        errors.push('Element must not be null or undefined.');
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
                case 'inspector': {
                    // Inspector has optional variableId (if omitted, inspects all variables)
                    if (element.variableId) {
                        errors.push(...validateInputElementWithVariableId(element));
                    }
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
                    if (mermaidElement.diagramText) {
                        errors.push(...validateMarkdownString(mermaidElement.diagramText, 'diagramText', 'Mermaid'));
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
                case 'treebark': {
                    const treebarkElement = element as TreebarkElement;

                    // Template is required
                    if (!treebarkElement.template) {
                        errors.push('Treebark element must have a template property');
                    } else {
                        errors.push(...validateOptionalObject(treebarkElement.template, 'template', 'Treebark'));
                    }

                    // Validate data if present
                    if (treebarkElement.data !== undefined) {
                        errors.push(...validateOptionalObject(treebarkElement.data, 'data', 'Treebark'));
                    }

                    // Validate variableId if present (follows OptionalVariableControl)
                    if (treebarkElement.variableId) {
                        errors.push(...validateVariableID(treebarkElement.variableId));
                    }

                    break;
                }
                case 'number': {
                    errors.push(...validateInputElementWithVariableId(element));
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

                    //if a variableId is specified, it must be valid
                    if (element.variableId) {
                        errors.push(...validateVariableID(element.variableId));

                        //it must not collide with existing variable names
                        const existingVariable = variables?.find((v) => v.variableId === element.variableId);
                        if (existingVariable) {
                            errors.push(`Tabulator variableId ${element.variableId} collides with existing variable name, the variable should be renamed or removed.`);
                        }
                    }

                    // TODO: validate tabulatorOptions properties later
                    break;
                }
                case 'textbox': {
                    errors.push(...validateInputElementWithVariableId(element));
                    break;
                }
                default: {
                    errors.push(`Unknown element type ${(element as any).type} at group ${groupIndex}, element index ${elementIndex}: ${JSON.stringify(element)}`);
                    break;
                }
            }
        } else if (typeof element !== 'string') {
            errors.push('Element must be an array or a string.');
        } else {
            // Validate string elements (markdown content) for HTML
            errors.push(...validateMarkdownString(element, 'content', 'Markdown'));
        }
    }
    return errors.filter(Boolean);
}
