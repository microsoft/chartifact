/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import * as vscode from 'vscode';
import { createNewDocument } from './command-new';
import { PreviewManager } from './command-preview';
import { EditManager } from './command-edit';
import { initializeResources } from './resources';

export async function activate(context: vscode.ExtensionContext) {
	// Initialize all resource contents eagerly
	await initializeResources(context);

	// Create preview manager
	const previewManager = new PreviewManager(context);

	// Create edit manager
	const editManager = new EditManager(context);

	// Register the new Interactive Document command
	const newDocumentDisposable = vscode.commands.registerCommand('chartifact.newIdocMarkdown', async (uri?: vscode.Uri) => {
		try {
			await createNewDocument(uri, 'markdown');
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create Chartifact Interactive Document (Markdown): ${error}`);
		}
	});

	context.subscriptions.push(newDocumentDisposable);

	// Register the new Interactive Document (JSON) command
	const newJsonDocumentDisposable = vscode.commands.registerCommand('chartifact.newIdocJson', async (uri?: vscode.Uri) => {
		try {
			await createNewDocument(uri, 'json');
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create Chartifact Interactive Document (JSON): ${error}`);
		}
	});

	context.subscriptions.push(newJsonDocumentDisposable);

	// Register the preview command for .idoc.md files
	const previewDisposable = vscode.commands.registerCommand('chartifact.previewIdoc', (fileUri: vscode.Uri) => {
		previewManager.showPreview(fileUri);
	});

	context.subscriptions.push(previewDisposable);

	// Register the split preview command for .idoc.md and .idoc.json files
	const previewSplitDisposable = vscode.commands.registerCommand('chartifact.previewIdocSplit', (fileUri: vscode.Uri) => {
		previewManager.showPreviewSplit(fileUri);
	});

	context.subscriptions.push(previewSplitDisposable);

	// Register the edit command for .idoc.md and .idoc.json files
	const editDisposable = vscode.commands.registerCommand('chartifact.editIdoc', (fileUri: vscode.Uri) => {
		editManager.showPreview(fileUri);
	});

	context.subscriptions.push(editDisposable);

	// Register the convert to HTML command for .idoc.md files
	const convertToHtmlDisposable = vscode.commands.registerCommand('chartifact.convertToHtml', async (fileUri: vscode.Uri) => {
		try {
			const { convertToHtml } = await import('./command-convert-html.mjs');
			await convertToHtml(fileUri);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to convert to HTML: ${error}`);
		}
	});

	context.subscriptions.push(convertToHtmlDisposable);

	// Register the convert to Markdown command for .idoc.json files
	const convertToMarkdownDisposable = vscode.commands.registerCommand('chartifact.convertToMarkdown', async (fileUri: vscode.Uri) => {
		try {
			const { convertToMarkdown } = await import('./command-convert-md.mjs');
			await convertToMarkdown(fileUri);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to convert to Markdown: ${error}`);
		}
	});

	context.subscriptions.push(convertToMarkdownDisposable);

	// Register the create examples folder command
	const createExamplesFolderDisposable = vscode.commands.registerCommand('chartifact.createExamplesFolder', async (uri?: vscode.Uri) => {
		try {
			const { createExamplesFolder } = await import('./command-create-examples.js');
			await createExamplesFolder(uri);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create examples folder: ${error}`);
		}
	});

	context.subscriptions.push(createExamplesFolderDisposable);

	// Ensure preview manager is disposed when extension deactivates
	context.subscriptions.push({
		dispose: () => previewManager.dispose()
	});

	// Ensure edit manager is disposed when extension deactivates
	context.subscriptions.push({
		dispose: () => editManager.dispose()
	});
}

export function deactivate() { }
