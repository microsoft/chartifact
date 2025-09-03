/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import * as vscode from 'vscode';
import { newPanel, WebViewWithUri } from './panel';
import { script, style } from './html';
import { getResourceContent } from './resources';
import type { EditorPageMessage, EditorReadyMessage, EditorGetOfflineDependenciesMessage, EditorSetOfflineDependenciesMessage } from 'common' with { 'resolution-mode': 'import' };

/**
 * Manages the edit functionality for Interactive Documents
 */
export class EditManager {
	private current: WebViewWithUri | undefined = undefined;
	private fileWatcher: vscode.FileSystemWatcher | undefined = undefined;

	constructor(private context: vscode.ExtensionContext) { }

	/**
	 * Shows the preview for the given file URI
	 */
	showPreview(fileUri: vscode.Uri) {
		const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
		const uriFsPath = fileUri.fsPath;

		// Only allow one viewer at a time
		if (this.current && this.current.uriFsPath !== uriFsPath) {
			this.current.panel.dispose();
			this.current = undefined;
		}

		if (this.current) {
			// If we already have a panel, show it in the target column
			this.current.panel.reveal(columnToShowIn);
		} else {
			// Otherwise, create a new panel
			this.current = newPanel(this.context, uriFsPath, undefined, columnToShowIn, "Chartifact Interactive Document Editor");
			const { panel } = this.current;

			panel.webview.html = getWebviewContent(panel.webview, this.context);

			panel.onDidDispose(() => {
				this.current = undefined;
				this.disposeFileWatcher();
			}, null, this.context.subscriptions);

			// Handle messages from the webview
			panel.webview.onDidReceiveMessage(message => {
				this.handleWebviewMessage(message, fileUri, uriFsPath);
			}, undefined, this.context.subscriptions);

			// Set up file watcher for auto-refresh
			this.setupFileWatcher(fileUri);
		}
	}

	/**
	 * Handles messages from the webview
	 */
	private handleWebviewMessage(message: EditorPageMessage | EditorReadyMessage | EditorGetOfflineDependenciesMessage, fileUri: vscode.Uri, uriFsPath: string) {
		switch (message.type) {
			case 'editorGetOfflineDependencies': {
				// Send offline dependencies to the webview
				if (this.current) {
					const setOfflineDependenciesMessage: EditorSetOfflineDependenciesMessage = {
						type: 'editorSetOfflineDependencies',
						sender: 'vscode',
						offlineDeps:
							style(getResourceContent('chartifact-reset.css')) +
							style(getResourceContent('tabulator.min.css')) +
							script(getResourceContent('markdown-it.min.js')) +
							script(getResourceContent('csstree.js')) +
							script(getResourceContent('js-yaml.min.js')) +
							script(getResourceContent('vega.min.js')) +
							script(getResourceContent('vega-lite.min.js')) +
							script(getResourceContent('tabulator.min.js')) +
							script(getResourceContent('mermaid.min.js')) +
							script(getResourceContent('chartifact.markdown.umd.js'))
					};
					this.current.panel.webview.postMessage(setOfflineDependenciesMessage);
				}
				break;
			}
			case 'editorReady': {
				this.getFileContentAndRender(fileUri, uriFsPath);
				break;
			}
			case 'editorPage': {
				// Handle page updates from the editor
				this.handlePageUpdate(message, fileUri, uriFsPath);
				break;
			}
		}
	}

	/**
	 * Handles page update messages from the webview editor
	 */
	private async handlePageUpdate(message: EditorPageMessage, fileUri: vscode.Uri, uriFsPath: string) {
		try {
			// Convert the page data to JSON string
			const jsonContent = JSON.stringify(message.page, null, 2);

			// Write the updated content back to the file
			const uint8Array = new TextEncoder().encode(jsonContent);
			await vscode.workspace.fs.writeFile(fileUri, uint8Array);

			// Show a brief status message
			vscode.window.setStatusBarMessage('Document saved', 2000);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to save document: ${error}`);
		}
	}

	private getFileContentAndRender(fileUri: vscode.Uri, uriFsPath: string) {
		vscode.workspace.fs.readFile(fileUri).then(uint8array => {

			// If the file is a markdown file, we can send the markdown content
			if (uriFsPath.endsWith('.idoc.md')) {
				const markdown = new TextDecoder().decode(uint8array);

				//TODO: we need to decompile??

				//this.render({ markdown });
			} else if (uriFsPath.endsWith('.json')) {
				// If the file is a JSON file, we can send the JSON content
				const jsonContent = new TextDecoder().decode(uint8array);
				try {
					const interactiveDocument = JSON.parse(jsonContent);
					this.render({
						page: interactiveDocument,
						type: 'editorPage',
						sender: 'app'
					});
				} catch (error) {
					vscode.window.showErrorMessage(`Failed to parse JSON: ${error}`);
				}
			}

		});
	}

	public render(renderRequestMessage: EditorPageMessage) {
		if (this.current && this.current.panel.visible) {
			this.current.panel.webview.postMessage(renderRequestMessage);
		}
	}

	/**
	 * Disposes of any current preview panel
	 */
	dispose() {
		if (this.current) {
			this.current.panel.dispose();
			this.current = undefined;
		}
		this.disposeFileWatcher();
	}

	/**
	 * Sets up a file system watcher for the given file URI
	 */
	private setupFileWatcher(fileUri: vscode.Uri) {
		// Dispose existing watcher if any
		this.disposeFileWatcher();

		// Create a file watcher for the specific file
		this.fileWatcher = vscode.workspace.createFileSystemWatcher(fileUri.fsPath);

		// Listen for file changes
		this.fileWatcher.onDidChange(() => {
			this.refreshPreview(fileUri);
		});

		// Add to context subscriptions for cleanup
		this.context.subscriptions.push(this.fileWatcher);
	}

	/**
	 * Disposes of the current file watcher
	 */
	private disposeFileWatcher() {
		if (this.fileWatcher) {
			this.fileWatcher.dispose();
			this.fileWatcher = undefined;
		}
	}

	/**
	 * Refreshes the preview by re-reading the file and rendering
	 */
	private refreshPreview(fileUri: vscode.Uri) {
		if (this.current && this.current.panel.visible) {
			this.getFileContentAndRender(fileUri, this.current.uriFsPath);
		}
	}
}

function getWebviewContent(webView: vscode.Webview, context: vscode.ExtensionContext) {

	function resourceUrl(resource: string) {
		// Get path to resource on disk
		const onDiskPath = vscode.Uri.file(context.extensionPath + '/resources/' + resource);

		// And get the special URI to use with the webview
		return webView.asWebviewUri(onDiskPath);
	}

	// Build the resource links block
	const resourceLinks = [
		script(resourceUrl('react.production.min.js')),
		script(resourceUrl('react-dom.production.min.js')),
		script(resourceUrl('vega.min.js')),
		script(resourceUrl('chartifact.editor.umd.js')),
		script(resourceUrl('edit.js')),
	].join('\n    ');

	const template = getResourceContent('edit.html');

	return template
		.replace('{{RESOURCE_LINKS}}', () => resourceLinks);
}
