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

// Copy all files
const files = fs.readdirSync(sourceDir);
files.forEach(file => {
    fs.copyFileSync(
        path.join(sourceDir, file),
        path.join(targetDir, file)
    );
});

console.log(`Copied ${files.length} assets to ${targetDir}`);
