/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { VariableID, ElementBase } from './common.js';

/**
 * CSV data in markdown fence: ```csv variableId
 */
export interface CsvElement extends ElementBase {
  type: 'csv';
  variableId: VariableID;
  content: string | string[] | string[][];
}

/**
 * TSV data in markdown fence: ```tsv variableId
 */
export interface TsvElement extends ElementBase {
  type: 'tsv';
  variableId: VariableID;
  content: string | string[] | string[][];
}

/**
 * Custom delimiter-separated data in markdown fence: ```dsv delimiter:| variableId
 */
export interface DsvElement extends ElementBase {
  type: 'dsv';
  variableId: VariableID;
  delimiter: string;
  content: string | string[] | string[][];
}

/**
 * JSON data with type preservation in markdown fence: ```json value variableId
 */
export interface JsonValueElement extends ElementBase {
  type: 'json';
  variableId: VariableID;
  content: object | object[];
}

/**
 * YAML data with type preservation in markdown fence: ```yaml value variableId
 */
export interface YamlValueElement extends ElementBase {
  type: 'yaml';
  variableId: VariableID;
  content: object | object[] | string | string[];
}

export type InlineDataElement =
  | CsvElement
  | TsvElement
  | DsvElement
  | JsonValueElement
  | YamlValueElement;
