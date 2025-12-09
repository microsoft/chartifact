/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Plugin, RawFlaggableSpec } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { flaggablePlugin, parseBody } from './config.js';
import { pluginClassName } from './util.js';
import { inspectVegaSpec, vegaPlugin } from './vega.js';
import { compile, TopLevelSpec } from 'vega-lite';
import { Spec } from 'vega';
import { PluginNames } from './interfaces.js';

const pluginName: PluginNames = 'vega-lite';
const className = pluginClassName(pluginName);

export const vegaLitePlugin: Plugin<TopLevelSpec> = {
    ...flaggablePlugin<TopLevelSpec>(pluginName, className),
    fence: (token, index) => {
        const info = token.info.trim();
        const content = token.content.trim();
        
        // Parse body content using the helper function
        const parseResult = parseBody<TopLevelSpec>(content, info);
        
        let flaggableSpec: RawFlaggableSpec<Spec>;
        
        if (parseResult.error) {
            // Parsing failed
            flaggableSpec = {
                spec: null,
                hasFlags: true,
                reasons: [parseResult.error],
            };
        } else if (parseResult.spec) {
            // Parsing succeeded, try to compile to Vega
            try {
                const vegaSpec = compile(parseResult.spec);
                flaggableSpec = inspectVegaSpec(vegaSpec.spec);
            } catch (e) {
                flaggableSpec = {
                    spec: null,
                    hasFlags: true,
                    reasons: [`failed to compile vega spec: ${e instanceof Error ? e.message : String(e)}`],
                };
            }
        } else {
            // No spec (shouldn't happen)
            flaggableSpec = {
                spec: null,
                hasFlags: true,
                reasons: ['No spec provided'],
            };
        }
        
        const jsonContent = JSON.stringify(flaggableSpec);
        return sanitizedHTML('div', { class: pluginClassName(vegaPlugin.name), id: `${pluginName}-${index}` }, jsonContent, true);
    },
    hydratesBefore: vegaPlugin.name,
};
