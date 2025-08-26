/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
interface DocRef {
    title: string;
    description?: string;
    /** URL to the document, either absolute or relative to the folder location. */
    href: string;
}
interface Folder {
    title: string;
    docs: DocRef[];
}

/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

/** JSON Schema version with $schema property for validation */
type FolderWithSchema = Folder & {
    $schema?: string;
};

export type { DocRef, Folder, FolderWithSchema };
