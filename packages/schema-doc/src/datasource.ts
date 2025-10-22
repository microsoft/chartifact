/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { DataSourceBase, DataSourceBaseFormat, TemplatedUrl, VariableType } from './common.js';

export interface ReturnType {
  type: VariableType;

  /** in our system, a pandas dataframe is an array of objects */
  isArray?: boolean;
}

/** Data source types */

/** JSON data or CSV / TSV / DSV */
export interface DataSourceInline extends DataSourceBase {
  type: 'inline';

  /** object array or a string or string array of CSV / TSV / DSV */
  content: object[] | string | string[];
}

/** User uploaded their own data file */
export interface DataSourceByFile extends DataSourceBase {
  type: 'file';
  filename: string;
  content: string;
}

/** User references a data source by URL, may be either static or dynamic */
export interface DataSourceByDynamicURL extends DataSourceBase {
  type: 'url';
  url: TemplatedUrl;
  returnType?: ReturnType;

  /** Assistant should not populate this. */
  docString?: string;
}

/** Union type for DataSource */
export type DataSource<T = {}> = (DataSourceInline | DataSourceByFile | DataSourceByDynamicURL) & T;

/** LLM Should not use this type */
export interface DataLoaderBySpec {
  type: 'spec';
  /** Vega Specification - Not Vega-Lite */
  spec: object;
}

export type DataLoader = DataSource | DataLoaderBySpec;

/**
 * Loader types for Variable.loader property
 * These are copies of the DataSource types but without dataFrameTransformations
 * (transforms can be added via Variable.calculation instead)
 */

/** Base interface for loaders - excludes dataFrameTransformations */
export interface LoaderBase {
  /** optional, default is 'json' */
  format?: DataSourceBaseFormat;
  /** only if format = dsv */
  delimiter?: string;
}

/** JSON data or CSV / TSV / DSV for Variable.loader */
export interface LoaderInline extends LoaderBase {
  type: 'inline';

  /** object array or a string or string array of CSV / TSV / DSV */
  content: object[] | string | string[];
}

/** User uploaded their own data file for Variable.loader */
export interface LoaderByFile extends LoaderBase {
  type: 'file';
  filename: string;
  content: string;
}

/** User references a data source by URL for Variable.loader */
export interface LoaderByDynamicURL extends LoaderBase {
  type: 'url';
  url: TemplatedUrl;
  returnType?: ReturnType;

  /** Assistant should not populate this. */
  docString?: string;
}

/** Union type for Loader - used in Variable.loader property */
export type Loader = LoaderInline | LoaderByFile | LoaderByDynamicURL;
