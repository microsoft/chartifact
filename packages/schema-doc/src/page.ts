/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { InteractiveElement } from './interactive.js';
import { DataLoader } from './datasource.js';
import { Variable } from './common.js';

export interface ElementGroup {
  groupId: string;
  elements: PageElement[];
}

export type Vega_or_VegaLite_spec = object;

/** Define the basic structure of an interactive document */
export interface InteractiveDocument {
  title: string;
  /** the first groupId should be 'main' */
  groups: ElementGroup[];

  /**
   * DataLoaders populate variables for tables and charts
   * Note: 'image' is not a valid type for a variable, do not provide a dataLoader if returnType.type = 'image', 
   * (ImageElements can load images from URLs directly without a DataLoader.)
   */
  dataLoaders?: DataLoader[];

  variables?: Variable[];

  style?: PageStyle;

  resources?: {
    charts?: { [chartKey: string]: Vega_or_VegaLite_spec }
  };

  /** Optional comments from the author */
  notes?: string[];
}

/**
 * Use markdown elements to be verbose and descriptive. Do not use as labels for interactive elements.
 * Embed dynamic variables in markdown using double curly braces {{variableId}} as a placeholder for their values.
 */
export type MarkdownElement = string;

/** Union type for all possible elements */
export type PageElement = MarkdownElement | InteractiveElement;

export interface PageStyle {
  /** CSS styles, either a string, or array of strings which will be concatenated. The array is for developer ergonomics for authoring and merging. */
  css: string | string[];
  googleFonts?: GoogleFontsSpec;
}

export interface GoogleFontsSpec {
  googleFontsUrl: string;

  /* Optional mapping of font families for different element types.*/
  mapping?: {
    /* Font family for body text */
    body?: string;
    /* Font family for hero (H1) title */
    hero?: string;
    /* Font family for headings */
    headings?: string;
    /* Font family for code blocks and inline code */
    code?: string;
    /* Font family for tables and tabulator */
    table?: string;
  };

  /* Optional sizing multipliers for font sizes of different element types. */
  sizing?: {
    body?: number;
    hero?: number;
    headings?: number;
    code?: number;
    table?: number;
  };
}
