import wrapper from '../dist/index.mjs';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve(process.cwd(), 'packages/web-deploy/json/vendor-rfp-bids.idoc.json');
const outputPath = path.resolve(process.cwd(), 'vendor-rfp-bids.html');

const jsonContent = fs.readFileSync(inputPath, 'utf-8');
const html = wrapper.htmlJsonWrapper('Vendor RFP Bid Comparison Dashboard', jsonContent);

fs.writeFileSync(outputPath, html);

console.log(`Wrote ${outputPath}`);