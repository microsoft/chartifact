/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { readFile } from "./file.js";
import { Listener } from "./listener.js";
import { determineContent } from "./string.js";

export function setupClipboardHandling(host: Listener) {

  const pasteHandler = (e: ClipboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clipboardData = e.clipboardData;
    if (clipboardData && clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      readFile(file, host);
    } else if (clipboardData && clipboardData.items) {
      let handled = false;
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];

        if (item.kind === 'string' && item.type === 'text/plain') {
          item.getAsString(async (content) => {
            if (!content) {
              host.errorHandler(
                'Pasted content is empty',
                'The pasted content was empty. Please paste valid markdown content or JSON.'
              );
              return;
            }
            content = content.trim();
            if (!content) {
              host.errorHandler(
                'Pasted content is empty',
                'The pasted content was only whitespace. Please paste valid markdown content or JSON.'
              );
              return;
            }
            await determineContent('clipboard-content', content, host, true, true);
          });
          handled = true;
          break;
        }
      }
      if (!handled) {
        host.errorHandler(
          'Unsupported clipboard content',
          'Please paste a markdown file, JSON file, or valid text content.'
        );
      }
    } else {
      host.errorHandler(
        'Unsupported clipboard content',
        'Please paste a markdown file, JSON file, or valid text content.'
      );
    }
  };

  document.addEventListener('paste', pasteHandler);

  return () => {
    document.removeEventListener('paste', pasteHandler);
  };
}
