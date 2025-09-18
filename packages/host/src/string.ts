/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Listener } from "./listener.js";
import { InteractiveDocument, InteractiveDocumentWithSchema } from "@microsoft/chartifact-schema";
import { Folder, FolderWithSchema } from "@microsoft/chartifact-schema-folder";
import { loadFolder } from "./folder.js";

export interface ContentResult {
    markdown?: string;
    idoc?: InteractiveDocument;
    folder?: Folder;
    error?: string;
    errorDetail?: string;
}

export async function determineContent(urlOrTitle: string, content: string, host: Listener, handle: boolean, showRestart: boolean): Promise<ContentResult> {
    const result = _determineContent(content);
    if (handle) {
        if (result.error) {
            host.errorHandler(
                result.error,
                result.errorDetail
            );
            return;
        } else if (result.idoc) {
            await host.render(urlOrTitle, undefined, result.idoc, showRestart);
        } else if (result.folder) {
            loadFolder(urlOrTitle, result.folder, host);
        } else if (result.markdown) {
            await host.render(urlOrTitle, result.markdown, undefined, showRestart);
        }
    }
    return result;
}

function _determineContent(content: string): ContentResult {
    if (!content) {
        return {
            error: 'Content is empty',
            errorDetail: 'The content was empty. Please use valid markdown content or JSON.'
        };
    }

    if (typeof content !== 'string') {
        return {
            error: 'Invalid content type',
            errorDetail: 'The content is not a string. Please use valid markdown content or JSON.'
        };
    }

    content = content.trim();

    if (!content) {
        return {
            error: 'Content is empty',
            errorDetail: 'The content was only whitespace. Please use valid markdown content or JSON.'
        };
    }

    // Check if the content is valid markdown or JSON
    if (content.startsWith('{') && content.endsWith('}')) {
        // Try to parse as JSON
        try {
            const idoc_or_folder = JSON.parse(content) as InteractiveDocumentWithSchema | FolderWithSchema;
            if (typeof idoc_or_folder !== 'object') {
                return {
                    error: 'Invalid JSON format',
                    errorDetail: 'Please provide a valid Interactive Document or Folder JSON.'
                };
            } else if (idoc_or_folder.$schema.endsWith('idoc_v1.json')) {
                const idoc = idoc_or_folder as InteractiveDocument;
                return {
                    idoc
                };
            } else if (idoc_or_folder.$schema.endsWith('folder_v1.json')) {
                const folder = idoc_or_folder as Folder;
                return {
                    folder
                };
            } else {
                return {
                    error: 'Unsupported schema',
                    errorDetail: 'The provided JSON does not match any known schema.'
                };
            }
        } catch (jsonError) {
            return {
                error: 'Invalid JSON content in clipboard',
                errorDetail: 'The pasted content is not valid JSON. Please copy a valid interactive document JSON file.'
            };
        }
    } else {
        return {
            markdown: content
        };
    }
}

