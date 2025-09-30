import { validation } from './packages/compiler/dist/esnext/index.js';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve(process.cwd(), 'packages/web-deploy/json/features/8.danfo.idoc.json');
const json = fs.readFileSync(inputPath, 'utf-8');
const idoc = JSON.parse(json);

const errors = await validation.validateDocument(idoc);

if (errors.length === 0) {
    console.log('Success - Danfo example is valid!');
} else {
    console.log('Errors:');
    errors.forEach(error => {
        console.log(` - ${error}`);
    });
}
