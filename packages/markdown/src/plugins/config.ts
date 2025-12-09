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
 * Parse fence info and extract all metadata.
 * @param info The fence info string
 * @returns Object with format, pluginName, params (including variableId), and wasDefaultId flag
 */
export function parseFenceInfo(info: string): {
    format: 'json' | 'yaml';
    pluginName: string;
    params: Map<string, string>;
    wasDefaultId: boolean;
} {
    const parts = info.trim().split(/\s+/);
    
    // Determine format (json is default)
    let format: 'json' | 'yaml' = 'json';
    let startIndex = 0;
    
    if (parts[0] === 'json' || parts[0] === 'yaml') {
        format = parts[0];
        startIndex = 1;
    }
    
    // The next part could be the plugin name OR a parameter
    let pluginName = '';
    let pluginNameIndex = startIndex;
    
    if (startIndex < parts.length && !parts[startIndex].includes(':')) {
        // It's a plugin name (doesn't have a colon)
        pluginName = parts[startIndex];
        pluginNameIndex = startIndex + 1;
    }
    
    const params = new Map<string, string>();
    let variableId: string | null = null;
    
    // Parse remaining parts starting after plugin name (if found)
    for (let i = pluginNameIndex; i < parts.length; i++) {
        const part = parts[i];
        const colonIndex = part.indexOf(':');
        
        if (colonIndex > 0) {
            // Parameter with colon
            const key = part.slice(0, colonIndex);
            const value = part.slice(colonIndex + 1);
            
            if (value) {
                // Format: "key:value"
                params.set(key, value);
            } else if (i + 1 < parts.length) {
                // Format: "key: value" (value in next part)
                params.set(key, parts[++i]);
            }
        } else if (!variableId) {
            // First non-parameter value becomes variableId
            variableId = part;
        }
    }
    
    // If variableId param exists, use it; otherwise use the direct value
    const explicitVariableId = params.get('variableId');
    const finalVariableId = explicitVariableId || variableId;
    const wasDefaultId = !finalVariableId;
    
    if (finalVariableId) {
        params.set('variableId', finalVariableId);
    }
    
    return { format, pluginName, params, wasDefaultId };
}

/**
 * Parse body content as JSON or YAML based on fence info.
 * @param content The fence content
 * @param info The fence info string (used to detect format)
 * @returns Parsed object and format metadata
 */
export function parseBody<T>(content: string, info: string): {
    spec: T | null;
    format: 'json' | 'yaml';
    error?: string;
} {
    const { format } = parseFenceInfo(info);
    const formatName = format === 'yaml' ? 'YAML' : 'JSON';
    
    try {
        let spec: T;
        if (format === 'yaml') {
            spec = yaml.load(content.trim()) as T;
        } else {
            spec = JSON.parse(content.trim());
        }
        return { spec, format };
    } catch (e) {
        return {
            spec: null,
            format,
            error: `malformed ${formatName}: ${e instanceof Error ? e.message : String(e)}`
        };
    }
}

/*
//Tests for parseFenceInfo
const tests: [string, { format: 'json' | 'yaml'; pluginName: string; variableId: string | undefined; wasDefaultId: boolean }][] = [
    //Direct format cases
    ["dsv products", { format: "json", pluginName: "dsv", variableId: "products", wasDefaultId: false }],
    ["csv officeSupplies", { format: "json", pluginName: "csv", variableId: "officeSupplies", wasDefaultId: false }],
    
    //Explicit format cases
    ["json inventory", { format: "json", pluginName: "inventory", variableId: undefined, wasDefaultId: true }],
    ["yaml products", { format: "yaml", pluginName: "products", variableId: undefined, wasDefaultId: true }],
    
    //Explicit plugin name
    ["json value inventory", { format: "json", pluginName: "value", variableId: "inventory", wasDefaultId: false }],
    ["yaml value products", { format: "yaml", pluginName: "value", variableId: "products", wasDefaultId: false }],
    
    //Direct plugin without format
    ["value inventory", { format: "json", pluginName: "value", variableId: "inventory", wasDefaultId: false }],
    
    //Explicit variableId parameter (no space)
    ["json variableId:inventory", { format: "json", pluginName: "", variableId: "inventory", wasDefaultId: false }],
    ["dsv variableId:products", { format: "json", pluginName: "dsv", variableId: "products", wasDefaultId: false }],
    ["json value variableId:inventory", { format: "json", pluginName: "value", variableId: "inventory", wasDefaultId: false }],
    ["yaml value variableId:products", { format: "yaml", pluginName: "value", variableId: "products", wasDefaultId: false }],
    
    //Explicit variableId parameter (with space)
    ["json variableId: inventory", { format: "json", pluginName: "", variableId: "inventory", wasDefaultId: false }],
    ["dsv variableId: products", { format: "json", pluginName: "dsv", variableId: "products", wasDefaultId: false }],
    ["json value variableId: inventory", { format: "json", pluginName: "value", variableId: "inventory", wasDefaultId: false }],
    ["yaml value variableId: products", { format: "yaml", pluginName: "value", variableId: "products", wasDefaultId: false }],
    
    //Multiple parameters
    ["dsv products delimiter:|", { format: "json", pluginName: "dsv", variableId: "products", wasDefaultId: false }],
    ["dsv delimiter:| variableId:products", { format: "json", pluginName: "dsv", variableId: "products", wasDefaultId: false }],
    ["dsv delimiter: | variableId: products", { format: "json", pluginName: "dsv", variableId: "products", wasDefaultId: false }],
    
    //No variableId
    ["json value", { format: "json", pluginName: "value", variableId: undefined, wasDefaultId: true }],
    ["dsv", { format: "json", pluginName: "dsv", variableId: undefined, wasDefaultId: true }],
];

tests.forEach(([input, expected], i) => {
    const result = parseFenceInfo(input);
    const variableId = result.params.get('variableId');
    const pass = 
        result.format === expected.format &&
        result.pluginName === expected.pluginName &&
        variableId === expected.variableId &&
        result.wasDefaultId === expected.wasDefaultId;

    console.log(
        `${pass ? '✅' : '❌'} Test ${i + 1}: ${pass ? 'PASS' : `FAIL\n  Input: "${input}"\n  Got: ${JSON.stringify({format: result.format, pluginName: result.pluginName, variableId, wasDefaultId: result.wasDefaultId})}\n  Expected: ${JSON.stringify(expected)}`}`
    );
});
*/

/**
 * Creates a plugin that can parse both JSON and YAML formats.
 * This handles both "head" (fence info) and "body" (content) parsing.
 */
export function flaggablePlugin<T>(pluginName: PluginNames, className: string, flagger?: (spec: T) => RawFlaggableSpec<T>, attrs?: object) {
    const plugin: Plugin<T> = {
        name: pluginName,
        fence: (token, index) => {
            const info = token.info.trim();
            const content = token.content.trim();
            
            // Parse body content using the helper function
            const parseResult = parseBody<T>(content, info);
            
            let flaggableSpec: RawFlaggableSpec<T>;
            if (parseResult.error) {
                // Parsing failed
                flaggableSpec = {
                    spec: null,
                    hasFlags: true,
                    reasons: [parseResult.error],
                };
            } else if (parseResult.spec) {
                // Parsing succeeded, apply flagger if provided
                if (flagger) {
                    flaggableSpec = flagger(parseResult.spec);
                } else {
                    flaggableSpec = { spec: parseResult.spec };
                }
            } else {
                // No spec (shouldn't happen, but handle it)
                flaggableSpec = {
                    spec: null,
                    hasFlags: true,
                    reasons: ['No spec provided'],
                };
            }
            
            // Store the flaggable spec as JSON in the div
            const jsonContent = JSON.stringify(flaggableSpec);
            return sanitizedHTML('div', { class: className, id: `${pluginName}-${index}`, ...attrs }, jsonContent, true);
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


