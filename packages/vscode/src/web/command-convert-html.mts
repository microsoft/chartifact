/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import * as vscode from 'vscode';
import { findAvailableFileName } from './file.js';
import hw from 'html-wrapper';

/**
 * Handles the conversion of .idoc.md and .idoc.json files to HTML
 */
export async function convertToHtml(fileUri: vscode.Uri) {
	try {
		// Read the file content
		const fileContent = await vscode.workspace.fs.readFile(fileUri);
		const fileText = new TextDecoder().decode(fileContent);

		// Check file extension to determine how to process
		const fileName = fileUri.fsPath.toLowerCase();
		let htmlContent: string;
		let originalExtension: string;

		const title = getFileNameWithoutExtension(fileUri);

		if (fileName.endsWith('.json')) {
			// Handle JSON files
			htmlContent = hw.htmlJsonWrapper(title, fileText);
			originalExtension = '.idoc.json';
		} else if (fileName.endsWith('.md')) {
			// Handle Markdown files
			htmlContent = hw.htmlMarkdownWrapper(title, fileText);
			originalExtension = '.idoc.md';
		} else {
			throw new Error(`Unsupported file type. Expected .idoc.md or .idoc.json, got: ${fileName}`);
		}

		// Generate the output filename with conflict resolution
		const outputUri = await findAvailableFileName(fileUri, '.idoc.html', originalExtension);

		// Write the HTML file
		const htmlBytes = new TextEncoder().encode(htmlContent);
		await vscode.workspace.fs.writeFile(outputUri, htmlBytes);

		// Show success message and offer to open the file
		const openAction = 'Open HTML file';
		const result = await vscode.window.showInformationMessage(
			`Successfully converted to HTML: ${outputUri.fsPath}`,
			openAction
		);

		if (result === openAction) {
			const document = await vscode.workspace.openTextDocument(outputUri);
			await vscode.window.showTextDocument(document);
		}
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to convert to HTML: ${error}`);
	}
}

function getFileNameWithoutExtension(fileUri: any): any {
	const path = fileUri.path;
	const lastSlashIndex = path.lastIndexOf('/');
	const lastDotIndex = path.lastIndexOf('.');
	if (lastDotIndex > lastSlashIndex) {
		return path.substring(lastSlashIndex + 1, lastDotIndex);
	}
	return path.substring(lastSlashIndex + 1);
}
