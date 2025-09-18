/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { readFile } from "./file.js";
import { Listener } from "./listener.js";
import { determineContent } from "./string.js";

export function setupDragDropHandling(host: Listener) {

  const dragHandler = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const dropHandler = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      // Handle regular file drops (Windows shell)
      const file = files[0];
      readFile(file, host);
    } else if (e.dataTransfer?.types.includes('text/plain')) {
      let content = e.dataTransfer.getData('text/plain');
      if (!content) {
        host.errorHandler(
          'Dropped content is empty',
          'The dropped content was empty. Please drop valid markdown content or JSON.'
        );
        return;
      }
      content = content.trim();
      if (!content) {
        host.errorHandler(
          'Dropped content is empty',
          'The dropped content was only whitespace. Please drop valid markdown content or JSON.'
        );
        return;
      }
      await determineContent('dropped-content', content, host, true, true);
    } else {
      host.errorHandler(
        'Unsupported drop content',
        'Please drop a markdown file, JSON file, or valid text content.'
      );
    }
  };

  document.addEventListener('drop', dropHandler);
  document.addEventListener('dragover', dragHandler);

  return () => {
    document.removeEventListener('drop', dropHandler);
    document.removeEventListener('dragover', dragHandler);
  };
}
