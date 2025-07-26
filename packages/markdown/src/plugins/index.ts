/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { registerMarkdownPlugin } from '../factory.js';

import { checkboxPlugin } from './checkbox.js';
import { cssPlugin } from './css.js';
import { dropdownPlugin } from './dropdown.js';
import { iframePlugin } from './iframe.js';
import { imagePlugin } from './image.js';
import { placeholdersPlugin } from './placeholders.js';
import { presetsPlugin } from './presets.js';
import { tabulatorPlugin } from './tabulator.js';
import { vegaLitePlugin } from './vega-lite.js';
import { vegaPlugin } from './vega.js';
import { youtubePlugin } from './youtube.js';

export function registerNativePlugins() {
    registerMarkdownPlugin(checkboxPlugin);
    registerMarkdownPlugin(cssPlugin);
    registerMarkdownPlugin(dropdownPlugin);
    // Note: iframePlugin is not registered - it's used as a utility by other plugins
    registerMarkdownPlugin(imagePlugin);
    registerMarkdownPlugin(placeholdersPlugin);
    registerMarkdownPlugin(presetsPlugin);
    registerMarkdownPlugin(tabulatorPlugin);
    registerMarkdownPlugin(vegaLitePlugin);
    registerMarkdownPlugin(vegaPlugin);
    registerMarkdownPlugin(youtubePlugin);
}
