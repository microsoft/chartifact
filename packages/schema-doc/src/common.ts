/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Transforms } from 'vega';

/**
 * VariableID
 * 
 * - The VariableID is an identifier for a variable.
 * - Do NOT use operator characters in the VariableID, such as /|\\\'"`,.;:~-=+?!@#$%^&*()[]{}<> 
 * - Do NOT use space characters in the VariableID, but you may use underscores.
 * - Do NOT prefix the VariableID with a digit.
 * - Do NOT prefix/suffix the VariableID with the type, e.g. "value_number" is bad.
 * - The following names are not allowed as VariableIDs: "width", "height", "padding", "autosize", "background", "style", "parent", "datum", "item", "event", "cursor", "encodeUriComponent"
 */
export type VariableID = string;

export type VariableType = 'number' | 'string' | 'boolean' | 'object';
export type VariableValuePrimitive = string | number | boolean | object;
export type VariableValueArray = string[] | number[] | boolean[] | object[];
export type VariableValue = VariableValuePrimitive | VariableValueArray;

export interface Variable {
  variableId: VariableID;
  type: VariableType;
  isArray?: boolean;
  initialValue: VariableValue;
  calculation?: Calculation;
}

/** Scalar calculation for primitive values. Not for object arrays. */
export interface ScalarCalculation {

  /** Vega expression language, used to calculate the value based on other variables. */
  vegaExpression: string;
}

/** DataFrame calculation for object arrays. Not for primitive/scalar values. */
export interface DataFrameCalculation {

  /** The upstream object array source dataSourceName(s) the dataFrameTransformations depends on. */
  dataSourceNames: VariableID[];

  dataFrameTransformations: Transforms[];
}

export type Calculation = ScalarCalculation | DataFrameCalculation;

/** A url, it may contain template variables, e.g. https://example.com/{{category}}/{{item}} */
export type TemplatedUrl = string;

export interface DataSourceBase {
  /** name of the data source, used to reference it in the UI, has same constraints as VariableID */
  dataSourceName: VariableID;
  /** optional, default is 'json' */
  format?: DataSourceBaseFormat;
  /** only if format = dsv */
  delimiter?: string;
  dataFrameTransformations?: Transforms[];
}

export type DataSourceBaseFormat = 'csv' | 'json' | 'tsv' | 'dsv';

export interface ElementBase {
}

export interface VariableControl extends ElementBase {
  variableId: VariableID;
  /** optional label if the variableId is not descriptive enough */
  label?: string;
}

export interface OptionalVariableControl extends ElementBase {
  variableId?: VariableID;
}
