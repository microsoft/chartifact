
import MarkdownIt from 'markdown-it';
import * as csstree from 'css-tree';
import { JSDOM } from 'jsdom';
import { Renderer, setMarkdownIt, setCssTree, setDomDocument } from '../../markdown/dist/esnext/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set jsdom flavor for DOM operations in Node.js
const jsdom = new JSDOM('<!DOCTYPE html>');
setDomDocument(jsdom.window.document);
setMarkdownIt(MarkdownIt);
setCssTree(csstree);
const renderer = new Renderer(null, { openLinksInNewTab: false });

// Load the readme file from root of the project
const readmePath = resolve(__dirname, '../../../README.md');
const readme = readFileSync(readmePath, 'utf-8');

//replace all '(https://microsoft.github.io/chartifact' with '(.' for local testing
const updatedReadme = readme.replace(/\(https:\/\/microsoft\.github\.io\/chartifact/g, () => '(.');

const html = renderer.renderHtml(updatedReadme);

//write output to ../../docs/index.html
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const content = `---
layout: default
title: "Chartifact Home"
---
<a id="github-repo" href="https://github.com/microsoft/chartifact">GitHub Repository</a>
<div id="content">
${html}
</div>
<script src="./dist/v1/chartifact.markdown.umd.js"></script>
<script src="./assets/js/home.js"></script>
`;

const outputPath = join(__dirname, '../../../docs/index.html');
writeFileSync(outputPath, content);