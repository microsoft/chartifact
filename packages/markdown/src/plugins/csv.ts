/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { DsvSpec, dsvPlugin, parseVariableId } from './dsv.js';
import { Plugin } from '../factory.js';

export interface CsvSpec extends DsvSpec {}

// CSV plugin delegates to DSV with comma delimiter for backwards compatibility
export const csvPlugin: Plugin<CsvSpec> = {
    name: 'csv',
    fence: (token, index) => {
        const info = token.info.trim();
        
        // Use the shared utility function to parse variable ID
        const { variableId } = parseVariableId(info, 'csv', index);
        
        // Create DSV fence info with comma delimiter
        const dsvInfo = `dsv delimiter:, variableId:${variableId}`;
        
        // Create a modified token with DSV info
        const dsvToken = Object.assign({}, token, { info: dsvInfo });
        
        return dsvPlugin.fence!(dsvToken, index);
    },
    hydrateSpecs: dsvPlugin.hydrateSpecs,
    hydrateComponent: dsvPlugin.hydrateComponent,
};
