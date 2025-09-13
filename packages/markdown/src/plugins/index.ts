/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { registerMarkdownPlugin } from '../factory.js';

import { checkboxPlugin } from './checkbox.js';
import { commentPlugin } from './comment.js';
import { cssPlugin } from './css.js';
import { csvPlugin } from './csv.js';
import { dsvPlugin } from './dsv.js';
import { googleFontsPlugin } from './google-fonts.js';
import { dropdownPlugin } from './dropdown.js';
import { imagePlugin } from './image.js';
import { mermaidPlugin } from './mermaid.js';
import { numberPlugin } from './number.js';
import { placeholdersPlugin } from './placeholders.js';
import { presetsPlugin } from './presets.js';
import { sliderPlugin } from './slider.js';
import { tabulatorPlugin } from './tabulator.js';
import { textboxPlugin } from './textbox.js';
import { tsvPlugin } from './tsv.js';
import { vegaLitePlugin } from './vega-lite.js';
import { vegaPlugin } from './vega.js';

export function registerNativePlugins() {
    registerMarkdownPlugin(checkboxPlugin);
    registerMarkdownPlugin(commentPlugin);
    registerMarkdownPlugin(cssPlugin);
    registerMarkdownPlugin(csvPlugin);
    registerMarkdownPlugin(dsvPlugin);
    registerMarkdownPlugin(googleFontsPlugin);
    registerMarkdownPlugin(dropdownPlugin);
    registerMarkdownPlugin(imagePlugin);
    registerMarkdownPlugin(mermaidPlugin);
    registerMarkdownPlugin(numberPlugin);
    registerMarkdownPlugin(placeholdersPlugin);
    registerMarkdownPlugin(presetsPlugin);
    registerMarkdownPlugin(sliderPlugin);
    registerMarkdownPlugin(tabulatorPlugin);
    registerMarkdownPlugin(textboxPlugin);
    registerMarkdownPlugin(tsvPlugin);
    registerMarkdownPlugin(vegaLitePlugin);
    registerMarkdownPlugin(vegaPlugin);
}
