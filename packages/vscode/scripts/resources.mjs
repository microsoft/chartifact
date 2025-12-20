import { resolve, basename } from 'path';
import { existsSync, mkdirSync, unlinkSync, copyFileSync, readdirSync } from 'fs';

const resources = [
    
    //npm dependencies (use docs/dist/v1 versions since node_modules missing)
    '../../docs/dist/v1/react.production.min.js',
    '../../docs/dist/v1/react-dom.production.min.js',
    '../../docs/dist/v1/vega.min.js',
    '../../docs/dist/v1/vega-lite.min.js',
    '../../docs/dist/v1/markdown-it.min.js',
    '../../docs/dist/v1/csstree.js',
    '../../docs/dist/v1/js-yaml.min.js',
    '../../docs/dist/v1/tabulator.min.js',
    '../../docs/dist/v1/tabulator.min.css',
    '../../docs/dist/v1/mermaid.min.js',

    //local umd builds (use docs/dist/v1 versions since packages not built)
    '../../docs/dist/v1/chartifact-reset.css',
    '../../docs/dist/v1/chartifact.markdown.umd.js',
    '../../docs/dist/v1/chartifact.host.umd.js',
    '../../docs/dist/v1/chartifact.sandbox.umd.js',
    '../../docs/dist/v1/chartifact.compiler.umd.js',
    '../../docs/dist/v1/chartifact.editor.umd.js',
    '../../docs/dist/v1/chartifact.toolbar.umd.js',
    '../../docs/dist/v1/chartifact-toolbar.css',

    //webview resources
    '../../packages/vscode-resources/dist/edit.js',
    '../../packages/vscode-resources/dist/preview.js',
    '../../packages/vscode-resources/html/preview.html',
    '../../packages/vscode-resources/html/edit.html',

    //sample docs
    '../../docs/assets/examples/json/grocery-list.idoc.json',
    '../../docs/assets/examples/markdown/seattle-weather/1.idoc.md',
    '../../docs/assets/chartifact-examples.zip',
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
