import wrapper from '../dist/index.mjs';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve(process.cwd(), 'docs/assets/examples/json/seattle-weather/1.idoc.json');
const outputPath = path.resolve(process.cwd(), 'seattle-weather.html');

const jsonContent = fs.readFileSync(inputPath, 'utf-8');
const html = wrapper.htmlJsonWrapper('Seattle Weather', jsonContent);

fs.writeFileSync(outputPath, html);

console.log(`Wrote ${outputPath}`);
