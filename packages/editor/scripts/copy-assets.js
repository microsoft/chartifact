import fs from 'fs';
import path from 'path';

const sourceDir = '../../docs/dist/v1';
const targetDir = 'public/chartifact/dist/v1';

// Check if source exists
if (!fs.existsSync(sourceDir)) {
    console.log('Assets not found, run npm run build in workspace root first');
    process.exit(0);
}

// Create target directory
fs.mkdirSync(targetDir, { recursive: true });

// Copy all files (skip directories)
const files = fs.readdirSync(sourceDir);
let copiedCount = 0;

files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    // Only copy if it's a file (not a directory)
    if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
    }
});

console.log(`Copied ${copiedCount} assets to ${targetDir}`);
