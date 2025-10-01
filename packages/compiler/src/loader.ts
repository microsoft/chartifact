/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { DataSourceByDynamicURL, DataSourceByFile, DataSourceInline } from '@microsoft/chartifact-schema';
import { Data, SignalRef, SourceData, ValuesData } from 'vega';
import { VegaScope } from './scope.js';
import { dataAsSignal, ensureDataAndSignalsArray } from './spec.js';
import { tokenizeTemplate } from 'common';
import { tickWrap } from './md.js';

export function addStaticDataLoaderToSpec(vegaScope: VegaScope, dataSource: DataSourceInline | DataSourceByFile) {
    const { spec } = vegaScope;
    const { dataSourceName, delimiter } = dataSource;
    let inlineDataMd: string;

    ensureDataAndSignalsArray(spec);

    if (dataSource.type === 'inline' && dataSource.format === 'json') {

        const newData: ValuesData = {
            name: dataSourceName,
            values: dataSource.content as object[],
            transform: dataSource.dataFrameTransformations || [],
        };
        spec.signals.push(dataAsSignal(dataSourceName));

        //real data goes to the beginning of the data array
        spec.data.unshift(newData);

    } else if (typeof dataSource.content === 'string' || (Array.isArray(dataSource.content) && typeof dataSource.content[0] === 'string')) {

        const content = dataSource.type === 'file' ? dataSource.content : dsvContent(dataSource.content as string | string[]);

        let ds_raw = dataSourceName;
        
        if (dataSource.dataFrameTransformations) {
            ds_raw += '_raw'; //append _raw to the original data source name to create a new data source for the inline data

            const newData: SourceData = {
                name: dataSourceName,
                source: ds_raw,
                transform: dataSource.dataFrameTransformations || [],
            };
            spec.signals.push(dataAsSignal(dataSourceName));

            //real data goes to the beginning of the data array
            spec.data.unshift(newData);
        }

        switch (dataSource.format) {
            case 'csv': {
                inlineDataMd = tickWrap(`csv ${ds_raw}`, content);
                break;
            }
            case 'tsv': {
                inlineDataMd = tickWrap(`tsv ${ds_raw}`, content);
                break;
            }
            case 'dsv': {
                inlineDataMd = tickWrap(`dsv delimiter:${delimiter} variableId:${ds_raw}`, content);
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

    return inlineDataMd;
}

function dsvContent(content: string | string[]) {
    if (Array.isArray(content)) {
        return content.join('\n');
    }
    return content;
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
