/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { Listener } from "./listener.js";
import { determineContent } from "./string.js";

export function readFile(file: File, host: Listener) {
    if (file.name.endsWith('.json') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            let content = e.target?.result as string;
            if (!content) {
                host.errorHandler(
                    'File content is empty',
                    'The file is empty. Please use a valid markdown or JSON file.'
                );
                return;
            }
            content = content.trim();
            if (!content) {
                host.errorHandler(
                    'File content is empty',
                    'The file is empty or contains only whitespace. Please use a valid markdown or JSON file.'
                );
                return;
            }
            await determineContent(file.name, content, host, true, true);
        };
        reader.onerror = (e) => {
            host.errorHandler(
                'Failed to read file',
                'Error reading file'
            );
        };
        reader.readAsText(file);
    } else {
        host.errorHandler(
            'Invalid file type',
            'Only markdown (.md) or JSON (.json) files are supported.'
        );
    }
}