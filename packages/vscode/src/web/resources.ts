/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import * as vscode from 'vscode';

// Cache for resource contents - can be string content, Uint8Array (binary), or Error object
const cachedResources: Record<string, string | Uint8Array | Error> = {};

// Initialize resource contents (call this during extension activation)
export const initializeResources = async (context: vscode.ExtensionContext): Promise<void> => {
  const resourcesToLoad: string[] = [

    //TODO - remove these once we have a proper CDN
    'chartifact.sandbox.umd.js',
    'chartifact.compiler.umd.js',

    //offline copies for editor sandbox (which can't access via vscode resources url)
    'chartifact-reset.css',
    'chartifact.markdown.umd.js',
    'tabulator.min.css',
    'markdown-it.min.js',
    'csstree.js',
    'js-yaml.min.js',
    'vega.min.js',
    'vega-lite.min.js',
    'tabulator.min.js',
    'mermaid.min.js',

    // Example documents
    '1.idoc.md',
    'grocery-list.idoc.json',
    
    //html templates
    'html-json.html',
    'html-markdown.html',
    'preview.html',
    'edit.html',

    //html scripts
    'html-json.js',
    'html-markdown.js',
  ];

  const binaryResourcesToLoad: string[] = [
    'chartifact-examples.zip',
  ];
  
  for (const filename of resourcesToLoad) {
    try {
      const resourceUri = vscode.Uri.joinPath(context.extensionUri, 'resources', filename);
      const fileData = await vscode.workspace.fs.readFile(resourceUri);
      const content = new TextDecoder().decode(fileData);
      
      cachedResources[filename] = content;
    } catch (error) {
      console.error(`Failed to read ${filename}:`, error);
      cachedResources[filename] = error instanceof Error ? error : new Error(`Failed to load ${filename}`);
    }
  }

  for (const filename of binaryResourcesToLoad) {
    try {
      const resourceUri = vscode.Uri.joinPath(context.extensionUri, 'resources', filename);
      const fileData = await vscode.workspace.fs.readFile(resourceUri);
      
      cachedResources[filename] = fileData;
    } catch (error) {
      console.error(`Failed to read ${filename}:`, error);
      cachedResources[filename] = error instanceof Error ? error : new Error(`Failed to load ${filename}`);
    }
  }
};

// Get a cached resource by name
export const getResourceContent = (resourceName: string): string => {
  const resource = cachedResources[resourceName];
  
  if (!resource) {
    throw new Error(`Resource not found: ${resourceName}`);
  }
  
  if (resource instanceof Error) {
    throw resource;
  }
  
  if (typeof resource !== 'string') {
    throw new Error(`Resource ${resourceName} is not a text resource`);
  }
  
  return resource;
};

// Get a cached binary resource by name
export const getBinaryResourceContent = (resourceName: string): Uint8Array => {
  const resource = cachedResources[resourceName];
  
  if (!resource) {
    throw new Error(`Resource not found: ${resourceName}`);
  }
  
  if (resource instanceof Error) {
    throw resource;
  }
  
  if (typeof resource === 'string') {
    throw new Error(`Resource ${resourceName} is not a binary resource`);
  }
  
  return resource;
};
