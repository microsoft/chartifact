/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

export interface DocRef {
    title: string;
    description?: string;

    /** URL to the document, either absolute or relative to the folder location. */
    href: string;
}

export interface Folder {
    title: string;
    docs: DocRef[];
}
