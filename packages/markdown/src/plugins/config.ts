/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Plugin, RawFlaggableSpec } from "../factory.js";
import { sanitizedHTML } from "../sanitize.js";
import { PluginNames } from "./interfaces.js";
import { getJsonScriptTag } from "./util.js";
import { SpecReview } from 'common';
import * as yaml from 'js-yaml';

/**
 * Creates a plugin that can parse both JSON and YAML formats
 */
export function flaggablePlugin<T>(pluginName: PluginNames, className: string, flagger?: (spec: T) => RawFlaggableSpec<T>, attrs?: object) {
    const plugin: Plugin<T> = {
        name: pluginName,
        fence: (token, index) => {
            let content = token.content.trim();
            let spec: T;
            let flaggableSpec: RawFlaggableSpec<T>;
            
            // Determine format from token info
            const info = token.info.trim();
            const isYaml = info.startsWith('yaml ');
            const formatName = isYaml ? 'YAML' : 'JSON';
            
            try {
                if (isYaml) {
                    spec = yaml.load(content) as T;
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
                if (flagger) {
                    flaggableSpec = flagger(spec);
                } else {
                    flaggableSpec = { spec };
                }
            }
            if (flaggableSpec) {
                content = JSON.stringify(flaggableSpec);
            }
            return sanitizedHTML('div', { class: className, id: `${pluginName}-${index}`, ...attrs }, content, true);
        },
        hydrateSpecs: (renderer, errorHandler) => {
            const flagged: SpecReview<T>[] = [];
            const containers = renderer.element.querySelectorAll(`.${className}`);
            for (const [index, container] of Array.from(containers).entries()) {
                const flaggableSpec = getJsonScriptTag(container, e => errorHandler(e, pluginName, index, 'parse', container)) as RawFlaggableSpec<T>;
                if (!flaggableSpec) continue;
                const f: SpecReview<T> = { approvedSpec: null, pluginName, containerId: container.id };
                if (flaggableSpec.hasFlags) {
                    f.blockedSpec = flaggableSpec.spec;
                    f.reason = flaggableSpec.reasons?.join(', ') || 'Unknown reason';
                } else {
                    f.approvedSpec = flaggableSpec.spec;
                }
                flagged.push(f);
            }
            return flagged;
        },
    };
    return plugin;
}


