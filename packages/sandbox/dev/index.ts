/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { SandboxOptions, Sandbox } from '../src/index.ts';
// @ts-ignore: import raw CSS as a string without type declarations
import rendererCss from '../../markdown/dist/css/chartifact-reset.css?raw';
// @ts-ignore: import raw CSS as a string without type declarations
import rendererUmdJs from '../../markdown/dist/umd/chartifact.markdown.umd.js?raw';
const textarea = document.getElementById('md') as HTMLTextAreaElement;

class LocalSandbox extends Sandbox {
    constructor(elementOrSelector: string | HTMLElement, markdown: string, options: SandboxOptions) {
        super(elementOrSelector, markdown, options);
    }

    getDependencies() {
        return `
<link href="https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css" rel="stylesheet" />
<style>\n${rendererCss}</style>
<script src="https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js"></script>
<script src="https://unpkg.com/css-tree@3.1.0/dist/csstree.js"></script>
<script src="https://unpkg.com/js-yaml@4.1.1/dist/js-yaml.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vega@6.2.0"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@6.4.1"></script>
<script src="https://unpkg.com/tabulator-tables@6.3.1/dist/js/tabulator.min.js"></script>
<script>${rendererUmdJs}</script>
`;
    }

}

const sandbox = new LocalSandbox(document.body, textarea.value, {
    onReady: () => {
        console.log('Sandbox is ready');
    },
    onError: (error) => {
        console.error('Sandbox error:', error);
    },
    onApprove: (message) => {
        console.log('Sandbox approval message:', message);
        //TODO policy to approve unapproved on localhost
        const { specs } = message;
        return specs;
    },
});

//allow sandbox to be accessed globally for debugging
(window as any)['sandbox'] = sandbox;

textarea.addEventListener('input', () => {
    sandbox.send(textarea.value);
});
