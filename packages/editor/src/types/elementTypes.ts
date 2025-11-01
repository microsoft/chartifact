/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

/**
 * Enum for all supported element types in interactive documents
 */
export enum ElementType {
    MARKDOWN = 'markdown',
    TEXTBOX = 'textbox',
    NUMBER = 'number',
    SLIDER = 'slider',
    CHECKBOX = 'checkbox',
    DROPDOWN = 'dropdown',
    CHART = 'chart',
    TABULATOR = 'tabulator',
    IMAGE = 'image',
    MERMAID = 'mermaid',
    TREEBARK = 'treebark',
    PRESETS = 'presets'
}

/**
 * Configuration for an element type in the insert menu
 */
export interface ElementConfig {
    type: ElementType;
    label: string;
    icon: string;
    description: string;
}

/**
 * Configuration for all element types
 * Single source of truth for element metadata
 */
export const ELEMENT_CONFIGS: Record<ElementType, ElementConfig> = {
    [ElementType.MARKDOWN]: {
        type: ElementType.MARKDOWN,
        label: 'Text/Markdown',
        icon: '📝',
        description: 'Add text content with markdown formatting'
    },
    [ElementType.TEXTBOX]: {
        type: ElementType.TEXTBOX,
        label: 'Textbox',
        icon: '📝',
        description: 'Text input field'
    },
    [ElementType.NUMBER]: {
        type: ElementType.NUMBER,
        label: 'Number',
        icon: '🔢',
        description: 'Numeric input field'
    },
    [ElementType.SLIDER]: {
        type: ElementType.SLIDER,
        label: 'Slider',
        icon: '🎚️',
        description: 'Numeric slider control'
    },
    [ElementType.CHECKBOX]: {
        type: ElementType.CHECKBOX,
        label: 'Checkbox',
        icon: '☑️',
        description: 'Boolean checkbox input'
    },
    [ElementType.DROPDOWN]: {
        type: ElementType.DROPDOWN,
        label: 'Dropdown',
        icon: '📋',
        description: 'Selection dropdown list'
    },
    [ElementType.CHART]: {
        type: ElementType.CHART,
        label: 'Chart',
        icon: '📊',
        description: 'Data visualization chart'
    },
    [ElementType.TABULATOR]: {
        type: ElementType.TABULATOR,
        label: 'Table',
        icon: '📋',
        description: 'Interactive data table'
    },
    [ElementType.IMAGE]: {
        type: ElementType.IMAGE,
        label: 'Image',
        icon: '🖼️',
        description: 'Display images'
    },
    [ElementType.MERMAID]: {
        type: ElementType.MERMAID,
        label: 'Diagram',
        icon: '📊',
        description: 'Mermaid diagrams'
    },
    [ElementType.TREEBARK]: {
        type: ElementType.TREEBARK,
        label: 'Template',
        icon: '🌳',
        description: 'HTML template component'
    },
    [ElementType.PRESETS]: {
        type: ElementType.PRESETS,
        label: 'Presets',
        icon: '⚙️',
        description: 'Variable preset controls'
    }
};

/**
 * Array of all element configurations for iteration
 */
export const ELEMENT_TYPES = Object.values(ELEMENT_CONFIGS);
