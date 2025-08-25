import { resolve, basename } from 'path';
import { existsSync, mkdirSync, unlinkSync, copyFileSync, readdirSync } from 'fs';

const resources = [
    
    //npm dependencies
    '../../node_modules/react/umd/react.production.min.js',
    '../../node_modules/react-dom/umd/react-dom.production.min.js',
    '../../node_modules/vega/build/vega.min.js',
    '../../node_modules/vega-lite/build/vega-lite.min.js',
    '../../node_modules/markdown-it/dist/markdown-it.min.js',
    '../../node_modules/css-tree/dist/csstree.js',
    '../../node_modules/js-yaml/dist/js-yaml.min.js',
    '../../node_modules/tabulator-tables/dist/js/tabulator.min.js',
    '../../node_modules/tabulator-tables/dist/css/tabulator.min.css',
    '../../node_modules/mermaid/dist/mermaid.min.js',

    //local umd builds
    '../../packages/markdown/dist/css/chartifact-reset.css',
    '../../packages/markdown/dist/umd/chartifact.markdown.umd.js',
    '../../packages/host/dist/umd/chartifact.host.umd.js',
    '../../packages/sandbox/dist/umd/chartifact.sandbox.umd.js',
    '../../packages/compiler/dist/umd/chartifact.compiler.umd.js',
    '../../packages/editor/dist/umd/chartifact.editor.umd.js',

    //webview resources
    '../../packages/vscode-resources/dist/edit.js',
    '../../packages/vscode-resources/dist/preview.js',
    '../../packages/vscode-resources/html/preview.html',
    '../../packages/vscode-resources/html/edit.html',

    //sample docs
    '../../docs/assets/examples/json/grocery-list.idoc.json',
    '../../docs/assets/examples/markdown/seattle-weather/1.idoc.md',
];

const errors = [];
const resourcesPath = 'resources';

if (!existsSync(resourcesPath)) {
    mkdirSync(resourcesPath);
} else {
    // Empty the directory
    for (const file of readdirSync(resourcesPath)) {
        unlinkSync(resolve(resourcesPath, file));
    }
}

resources.forEach(resource => {
    const dest = resolve(resourcesPath, basename(resource));
    if (existsSync(resource)) {
        try {
            copyFileSync(resource, dest);
        } catch (err) {
            errors.push({ err, resource });
        }
    } else { 
        errors.push('file does not exist', resource);
    }
});

if (errors.length) {
    console.log(errors);
    process.exitCode = 1;
}
