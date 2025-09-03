/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import * as vscode from 'vscode';
import { unzipSync } from 'fflate';
import { getBinaryResourceContent } from './resources';

/**
 * Creates a chartifact-examples folder and extracts the examples ZIP file into it
 * @param uri The URI where to create the folder (usually a workspace folder or selected folder)
 */
export async function createExamplesFolder(uri?: vscode.Uri): Promise<void> {
	// Determine the target directory
	let targetDir: vscode.Uri;
	
	if (uri && uri.scheme === 'file') {
		// Check if the URI is a directory
		try {
			const stat = await vscode.workspace.fs.stat(uri);
			if (stat.type === vscode.FileType.Directory) {
				targetDir = uri;
			} else {
				// It's a file, use its parent directory
				const pathParts = uri.path.split('/');
				pathParts.pop(); // Remove the filename
				targetDir = uri.with({ path: pathParts.join('/') });
			}
		} catch {
			// If stat fails, assume it's a directory
			targetDir = uri;
		}
	} else {
		// No URI provided, use the first workspace folder
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			throw new Error('No workspace folder available. Please open a folder first.');
		}
		targetDir = workspaceFolders[0].uri;
	}

	// Find an available folder name
	const baseFolderUri = vscode.Uri.joinPath(targetDir, 'chartifact-examples');
	let availableFolderUri = baseFolderUri;
	
	// Check if folder exists and find an available name
	let counter = 1;
	while (true) {
		try {
			await vscode.workspace.fs.stat(availableFolderUri);
			// Folder exists, try next number
			availableFolderUri = vscode.Uri.joinPath(targetDir, `chartifact-examples-${counter}`);
			counter++;
		} catch {
			// Folder doesn't exist, we can use this name
			break;
		}
	}

	try {
		// Get the examples ZIP file from the cached resources
		const zipData = getBinaryResourceContent('chartifact-examples.zip');

		// Create the examples folder
		await vscode.workspace.fs.createDirectory(availableFolderUri);

		// Extract the ZIP file
		const unzipped = unzipSync(zipData);

		for (const [filePath, fileData] of Object.entries(unzipped)) {
			const targetPath = vscode.Uri.joinPath(availableFolderUri, filePath);
			
			// Create parent directories if they don't exist
			const pathParts = filePath.split('/');
			if (pathParts.length > 1) {
				const parentParts = pathParts.slice(0, -1);
				const parentDir = vscode.Uri.joinPath(availableFolderUri, ...parentParts);
				try {
					await vscode.workspace.fs.createDirectory(parentDir);
				} catch {
					// Directory might already exist, ignore error
				}
			}

			// Write the file
			await vscode.workspace.fs.writeFile(targetPath, fileData);
		}

		// Show success message and offer to open the folder
		const folderName = availableFolderUri.path.split('/').pop();
		const action = await vscode.window.showInformationMessage(
			`Successfully created and extracted chartifact-examples to "${folderName}"`,
			'Open Folder',
			'Show in Explorer'
		);

		if (action === 'Open Folder') {
			// Open the examples folder in the explorer
			vscode.commands.executeCommand('revealInExplorer', availableFolderUri);
		} else if (action === 'Show in Explorer') {
			// Reveal in VS Code explorer
			vscode.commands.executeCommand('revealInExplorer', availableFolderUri);
		}

	} catch (error) {
		throw new Error(`Failed to create examples folder: ${error instanceof Error ? error.message : error}`);
	}
}
