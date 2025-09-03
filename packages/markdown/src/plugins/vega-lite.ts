/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Plugin, RawFlaggableSpec } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { flaggablePlugin } from './config.js';
import { pluginClassName } from './util.js';
import { inspectVegaSpec, vegaPlugin } from './vega.js';
import { compile, TopLevelSpec } from 'vega-lite';
import { Spec } from 'vega';
import { PluginNames } from './interfaces.js';
import * as yaml from 'js-yaml';

const pluginName: PluginNames = 'vega-lite';
const className = pluginClassName(pluginName);

export const vegaLitePlugin: Plugin<TopLevelSpec> = {
    ...flaggablePlugin<TopLevelSpec>(pluginName, className),
    fence: (token, index) => {
        let content = token.content.trim();
        let spec: TopLevelSpec;
        let flaggableSpec: RawFlaggableSpec<Spec>;
        
        // Determine format from token info
        const info = token.info.trim();
        const isYaml = info.startsWith('yaml ');
        const formatName = isYaml ? 'YAML' : 'JSON';
        
        try {
            if (isYaml) {
                spec = yaml.load(content) as TopLevelSpec;
            } else {
                spec = JSON.parse(content);
            }
        } catch (e) {
            flaggableSpec = {
                spec: null,
                hasFlags: true,
                reasons: [`malformed ${formatName}`],
            };
        }
        if (spec) {
            try {
                const vegaSpec = compile(spec);
                flaggableSpec = inspectVegaSpec(vegaSpec.spec);
            }
            catch (e) {
                flaggableSpec = {
                    spec: null,
                    hasFlags: true,
                    reasons: [`failed to compile vega spec`],
                };
            }
        }
        if (flaggableSpec) {
            content = JSON.stringify(flaggableSpec);
        }
        return sanitizedHTML('div', { class: pluginClassName(vegaPlugin.name), id: `${pluginName}-${index}` }, content, true);
    },
    hydratesBefore: vegaPlugin.name,
};
