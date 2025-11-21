/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { VariableID, ElementBase } from './common.js';

export interface CsvElement extends ElementBase {
  type: 'csv';
  variableId: VariableID;
  content: string | string[] | string[][];
}

export interface TsvElement extends ElementBase {
  type: 'tsv';
  variableId: VariableID;
  content: string | string[] | string[][];
}

export interface DsvElement extends ElementBase {
  type: 'dsv';
  variableId: VariableID;
  delimiter: string;
  content: string | string[] | string[][];
}

export interface JsonValueElement extends ElementBase {
  type: 'json';
  variableId: VariableID;
  content: object | object[];
}

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
