/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { DataSourceByDynamicURL, DataSourceByFile, DataSourceInline } from '@microsoft/chartifact-schema';
import { Data, SignalRef, ValuesData } from 'vega';
import { VegaScope } from './scope.js';
import { dataAsSignal, ensureDataAndSignalsArray } from './spec.js';
import { tokenizeTemplate } from 'common';
import { tickWrap } from './md.js';

export function addStaticDataLoaderToSpec(vegaScope: VegaScope, dataSource: DataSourceInline | DataSourceByFile) {
    const { spec } = vegaScope;
    const { dataSourceName, delimiter } = dataSource;
    let inlineDataMd: string;

    ensureDataAndSignalsArray(spec);

    spec.signals.push(dataAsSignal(dataSourceName));

    const newData: ValuesData = {
        name: dataSourceName,
        values: [],
        transform: dataSource.dataFrameTransformations || [],
    };

    if (dataSource.type === 'inline') {

        if (dataSource.format === 'json') {
            newData.values = dataSource.content as object[];
        } else if (typeof dataSource.content === 'string') {

            switch (dataSource.format) {
                case 'csv': {
                    inlineDataMd = tickWrap(`csv ${dataSourceName}`, dataSource.content);
                    break;
                }
                case 'tsv': {
                    inlineDataMd = tickWrap(`tsv ${dataSourceName}`, dataSource.content);
                    break;
                }
                case 'dsv': {
                    inlineDataMd = tickWrap(`dsv delimiter:${delimiter} variableId:${dataSourceName}`, dataSource.content);
                    break;
                }
                default: {
                    console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
                    break;
                }
            }
        } else {
            console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
        }

    } else if (dataSource.type === 'file') {
        if (dataSource.format === 'dsv') {
            newData.format = {
                type: dataSource.format,
                delimiter: dataSource.delimiter
            };
        } else {
            newData.format = {
                type: dataSource.format
            };
        }
        newData.values = [dataSource.content];
    }

    //real data goes to the beginning of the data array
    spec.data.unshift(newData);

    return inlineDataMd;
}

export function addDynamicDataLoaderToSpec(vegaScope: VegaScope, dataSource: DataSourceByDynamicURL) {
    const { spec } = vegaScope;
    const { dataSourceName, delimiter } = dataSource;

    //look for signal token within the dataSource.url
    const tokens = tokenizeTemplate(dataSource.url);
    const variableCount = tokens.filter(token => token.type === 'variable').length;

    let url: string | SignalRef;

    if (variableCount) {
        const urlSignal = vegaScope.createUrlSignal(dataSource.url, tokens);
        url = { signal: urlSignal.name };

    } else {
        //dont need an extra signal, just load url directly
        url = dataSource.url;
    }

    ensureDataAndSignalsArray(spec);
    spec.signals.push(dataAsSignal(dataSourceName));

    const data: Data = {
        name: dataSourceName,
        url,
        transform: dataSource.dataFrameTransformations || [],
    };

    if (dataSource.format === 'dsv') {
        data.format = { type: dataSource.format, delimiter };
    } else {
        data.format = { type: dataSource.format || 'json' };
    }

    //real data goes to the beginning of the data array
    spec.data.unshift(data);
}
