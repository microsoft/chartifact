import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { zipSync } from 'fflate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputZip = resolve(__dirname, '../../../docs/assets/chartifact-examples.zip');

// Helper function to recursively read directory and create file entries
function addDirectoryToZip(dirPath: string, zipPath: string = ''): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  const items = readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = join(dirPath, item);
    const zipFilePath = zipPath ? `${zipPath}/${item}` : item;
    
    if (statSync(fullPath).isDirectory()) {
      // Recursively add directory contents
      Object.assign(files, addDirectoryToZip(fullPath, zipFilePath));
    } else {
      // Add file
      files[zipFilePath] = readFileSync(fullPath);
    }
  }
  
  return files;
}

// Collect all files for the ZIP
const zipFiles: Record<string, Uint8Array> = {};

// Add folders
Object.assign(zipFiles, addDirectoryToZip(resolve(__dirname, '../../../docs/assets/examples/json'), 'json'));
Object.assign(zipFiles, addDirectoryToZip(resolve(__dirname, '../../../docs/assets/examples/markdown'), 'markdown'));

// Add schema files
zipFiles['schema/idoc_v1.d.ts'] = readFileSync(resolve(__dirname, '../../../docs/schema/idoc_v1.d.ts'));
zipFiles['schema/idoc_v1.json'] = readFileSync(resolve(__dirname, '../../../docs/schema/idoc_v1.json'));

// Add agent instructions file
zipFiles['agent-instructions.md'] = readFileSync(resolve(__dirname, '../agent-instructions.md'));

// Ensure output directory exists
const outputDir = resolve(__dirname, '../../../docs/assets');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Create and write ZIP file
const zipped = zipSync(zipFiles);
writeFileSync(outputZip, zipped);
console.log(`Zip file created: ${outputZip}`);
