import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const examplesDir = join(__dirname, '../../../docs/assets/examples');
const outputFile = join(__dirname, '../../../docs/examples.html');

const files = readdirSync(examplesDir).filter(file => file.endsWith('.folder.json'));

let htmlContent = `---
layout: default
title: Chartifact Examples
---
<a href="/chartifact/">Chartifact home</a>
<a id="github-repo" href="https://github.com/microsoft/chartifact">GitHub Repository</a>

<h1>Chartifact Examples</h1>

`;

files.forEach(file => {
  const filePath = join(examplesDir, file);
  const folderData = JSON.parse(readFileSync(filePath, 'utf-8'));

  htmlContent += `<h2>${folderData.title}</h2>\n`;
  htmlContent += `<a href="/chartifact/view?load=../assets/examples/${file}">view all</a>\n<ul>\n`;

  folderData.docs.forEach(doc => {
    const link = `/chartifact/view/?load=../assets/examples/${doc.href}`;
    htmlContent += `<li><a href="${link}">${doc.title}</a>`;
    if (doc.description) {
      htmlContent += `: ${doc.description}`;
    }
    htmlContent += `</li>\n`;
  });

  htmlContent += `</ul>\n`;
});

htmlContent += `</body>`;

writeFileSync(outputFile, htmlContent, 'utf-8');

console.log(`HTML file generated at ${outputFile}`);

