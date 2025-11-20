/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */
import { VariableID, ElementBase } from './common.js';

/**
 * Inline Data Elements
 * These elements are defined using markdown fence blocks to embed data directly in the document.
 */

/**
 * CSV Element
 * Embed CSV data inline using markdown fence block: ```csv variableId
 * Content should be CSV rows (comma-separated values).
 * All values are stored as strings.
 */
export interface CsvElement extends ElementBase {
  type: 'csv';
  variableId: VariableID;
  /** CSV content as string, array of strings, or array of string arrays */
  content: string | string[] | string[][];
}

/**
 * TSV Element
 * Embed TSV data inline using markdown fence block: ```tsv variableId
 * Content should be TSV rows (tab-separated values).
 * All values are stored as strings.
 */
export interface TsvElement extends ElementBase {
  type: 'tsv';
  variableId: VariableID;
  /** TSV content as string, array of strings, or array of string arrays */
  content: string | string[] | string[][];
}

/**
 * DSV Element
 * Embed delimiter-separated data inline using markdown fence block: ```dsv delimiter:| variableId
 * Content should be delimiter-separated rows.
 * All values are stored as strings.
 */
export interface DsvElement extends ElementBase {
  type: 'dsv';
  variableId: VariableID;
  /** Custom delimiter character (e.g., '|', ';', etc.) */
  delimiter: string;
  /** DSV content as string, array of strings, or array of string arrays */
  content: string | string[] | string[][];
}

/**
 * Value Element (JSON)
 * Embed JSON data inline using markdown fence block: ```json value variableId
 * Content should be a JSON array or object.
 * Preserves data types: numbers remain numbers, booleans remain booleans, nested objects are preserved.
 * Use this for structured data with type preservation.
 */
export interface JsonValueElement extends ElementBase {
  type: 'json-value';
  variableId: VariableID;
  /** JSON content as array or object */
  content: object | object[];
}

/**
 * Value Element (YAML)
 * Embed YAML data inline using markdown fence block: ```yaml value variableId
 * Content should be YAML array or object.
 * Preserves data types: numbers remain numbers, booleans remain booleans, nested objects are preserved.
 * Use this for structured data with type preservation.
 */
export interface YamlValueElement extends ElementBase {
  type: 'yaml-value';
  variableId: VariableID;
  /** YAML content as array, object, string, or string array */
  content: object | object[] | string | string[];
}

/**
 * Union type for all inline data elements
 */
export type InlineDataElement =
  | CsvElement
  | TsvElement
  | DsvElement
  | JsonValueElement
  | YamlValueElement;
