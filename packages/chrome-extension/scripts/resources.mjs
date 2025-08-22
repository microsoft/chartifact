/**
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT License.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');
const srcDir = path.join(__dirname, '..', 'src');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files
const staticFiles = [
  'manifest.json',
  'popup.html'
];

for (const file of staticFiles) {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(distDir, file);
  
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file}`);
  }
}

// Copy UMD bundles for use in content script
const docsDir = path.join(__dirname, '..', '..', '..', 'docs', 'dist', 'v1');
const bundleFiles = [
  'chartifact.sandbox.umd.js',
  'chartifact.compiler.umd.js'
];

for (const file of bundleFiles) {
  const srcFile = path.join(docsDir, file);
  const destFile = path.join(distDir, file.replace('.umd.js', '.js'));
  
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied ${file} as ${path.basename(destFile)}`);
  } else {
    console.warn(`Bundle file not found: ${srcFile}`);
  }
}

// Create icons directory and placeholder icons
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create simple text-based placeholder icons (in production, use actual PNG files)
const iconSizes = [16, 32, 48, 128];
for (const size of iconSizes) {
  const iconFile = path.join(iconsDir, `icon-${size}.png`);
  
  // Create a minimal fake PNG-like file to make Chrome happy
  // In production, these should be proper PNG icon files
  const header = `PNG ICON ${size}x${size}`;
  const padding = Buffer.alloc(Math.max(0, 100 - header.length), 0);
  const iconBuffer = Buffer.concat([Buffer.from(header), padding]);
  fs.writeFileSync(iconFile, iconBuffer);
}

console.log('Resources copied successfully');