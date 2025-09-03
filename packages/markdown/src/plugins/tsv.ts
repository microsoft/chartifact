/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { DsvSpec, dsvPlugin, parseVariableId } from './dsv.js';
import { Plugin } from '../factory.js';

export interface TsvSpec extends DsvSpec {}

// TSV plugin delegates to DSV with tab delimiter for backwards compatibility
export const tsvPlugin: Plugin<TsvSpec> = {
    name: 'tsv',
    fence: (token, index) => {
        const info = token.info.trim();
        
        // Use the shared utility function to parse variable ID
        const { variableId } = parseVariableId(info, 'tsv', index);
        
        // Create DSV fence info with tab delimiter (use escaped \t)
        const dsvInfo = `dsv delimiter:\\t variableId:${variableId}`;
        
        // Create a modified token with DSV info
        const dsvToken = Object.assign({}, token, { info: dsvInfo });
        
        return dsvPlugin.fence!(dsvToken, index);
    },
    hydrateSpecs: dsvPlugin.hydrateSpecs,
    hydrateComponent: dsvPlugin.hydrateComponent,
};
