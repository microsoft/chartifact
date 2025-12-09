/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { Plugin, RawFlaggableSpec } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { flaggablePlugin, parseHeadAndBody } from './config.js';
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
        
        // Parse both head and body using the helper function
        const { head, body } = parseHeadAndBody<TopLevelSpec>(content, info);
        
        let flaggableSpec: RawFlaggableSpec<TopLevelSpec>;
        
        if (body.error) {
            // Parsing failed
            flaggableSpec = {
                spec: null,
                hasFlags: true,
                reasons: [body.error],
                head: {
                    format: head.format,
                    pluginName: head.pluginName,
                    params: Object.fromEntries(head.params),
                    wasDefaultId: head.wasDefaultId
                }
            };
        } else if (body.spec) {
            // Parsing succeeded, try to compile to Vega
            try {
                const vegaSpec = compile(body.spec);
                // inspectVegaSpec returns RawFlaggableSpec<Spec> (Vega), but we store as TopLevelSpec
                const inspected = inspectVegaSpec(vegaSpec.spec);
                // Create a compatible flaggableSpec that uses the compiled Vega spec
                // Note: This plugin compiles Vega-Lite to Vega and stores the compiled spec.
                // The type assertion is needed because we're storing a Vega Spec where TopLevelSpec is expected.
                // This is a pre-existing design decision in the vega-lite plugin architecture.
                flaggableSpec = {
                    spec: vegaSpec.spec as any as TopLevelSpec,
                    hasFlags: inspected.hasFlags,
                    reasons: inspected.reasons,
                    head: {
                        format: head.format,
                        pluginName: head.pluginName,
                        params: Object.fromEntries(head.params),
                        wasDefaultId: head.wasDefaultId
                    }
                };
            } catch (e) {
                flaggableSpec = {
                    spec: null,
                    hasFlags: true,
                    reasons: [`failed to compile vega spec: ${e instanceof Error ? e.message : String(e)}`],
                    head: {
                        format: head.format,
                        pluginName: head.pluginName,
                        params: Object.fromEntries(head.params),
                        wasDefaultId: head.wasDefaultId
                    }
                };
            }
        } else {
            // body.spec is null (can happen with empty/null YAML content)
            // This is a legitimate case handled by parseHeadAndBody for empty or invalid content
            flaggableSpec = {
                spec: null,
                hasFlags: true,
                reasons: body.error ? [body.error] : ['No spec provided'],
                head: {
                    format: head.format,
                    pluginName: head.pluginName,
                    params: Object.fromEntries(head.params),
                    wasDefaultId: head.wasDefaultId
                }
            };
        }
        
        const jsonContent = JSON.stringify(flaggableSpec);
        return sanitizedHTML('div', { class: pluginClassName(vegaPlugin.name), id: `${pluginName}-${index}` }, jsonContent, true);
    },
    hydratesBefore: vegaPlugin.name,
};
