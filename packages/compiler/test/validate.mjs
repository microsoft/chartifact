import { validation } from '../dist/esnext/index.js';
import fs from 'fs';
import path from 'path';

const inputArg = process.argv[2];
const inputPath = inputArg
    ? path.resolve(process.cwd(), inputArg)
    : path.resolve(process.cwd(), 'docs/assets/examples/json/seattle-weather/3.idoc.json');

if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(2);
}

const json = fs.readFileSync(inputPath, 'utf-8');
const idoc = JSON.parse(json);

const errors = await validation.validateDocument(idoc);

if (errors.length === 0) {
    console.log('Success');
} else {
    console.log('Errors:');
    errors.forEach(error => {
        console.log(` - ${error}`);
    });
}
