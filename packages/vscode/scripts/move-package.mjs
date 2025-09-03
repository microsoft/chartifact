import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(__dirname, '..');
const destinationDir = path.resolve(__dirname, '../../../docs/dist/v1');

fs.readdir(sourceDir, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    process.exit(1);
  }

  const vsixFiles = files.filter(file => file.endsWith('.vsix'));

  if (vsixFiles.length === 0) {
    console.error('No .vsix files found to move.');
    process.exit(1);
  }

  vsixFiles.forEach(file => {
    const source = path.join(sourceDir, file);
    const destination = path.join(destinationDir, file);

    fs.rename(source, destination, (err) => {
      if (err) {
        console.error(`Error moving file ${file}:`, err);
        process.exit(1);
      } else {
        console.log(`File ${file} moved successfully to docs/dist`);
      }
    });
  });
});
