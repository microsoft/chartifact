/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { InteractiveDocument } from './page.js';
/** JSON Schema version with $schema property for validation */
export type InteractiveDocumentWithSchema = InteractiveDocument & {
    $schema?: string;
};
