/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { VariableID, ElementBase } from './common.js';

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
  | JsonValueElement
  | YamlValueElement;
