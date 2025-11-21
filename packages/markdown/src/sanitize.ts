/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

// Exported domDocument, defaults to browser document if available
let domDocument: Document | undefined = (typeof document !== 'undefined') ? document : undefined;

export function setDomDocument(doc: Document) {
    domDocument = doc;
}

export function sanitizedHTML(tagName: string, attributes: { [key: string]: string }, content: string, precedeWithScriptTag?: boolean) {

    if (!domDocument) {
        throw new Error('No DOM Document available. Please set domDocument using setDomDocument.');
    }

    // Create a temp element with the specified tag name
    const element = domDocument.createElement(tagName);

    // Iterate over the attribute list and set each attribute
    Object.keys(attributes).forEach(key => {
        element.setAttribute(key, attributes[key]);
    });

    if (precedeWithScriptTag) {
        // Create a script tag that precedes the main element
        const scriptElement = sanitizedScriptTag(content);

        // Return script tag followed by empty element
        return scriptElement.outerHTML + element.outerHTML;
    } else {
        // Set the textContent to automatically escape the content
        element.textContent = content;
    }

    // Return the outer HTML of the element
    return element.outerHTML;
}

export function sanitizedScriptTag(content: string, attributes?: { [key: string]: string }): HTMLScriptElement {
    if (!domDocument) {
        throw new Error('No DOM Document available. Please set domDocument using setDomDocument.');
    }

    const scriptElement = domDocument.createElement('script');
    
    // Set default type to application/json
    scriptElement.setAttribute('type', 'application/json');
    
    // Set additional attributes if provided
    if (attributes) {
        Object.keys(attributes).forEach(key => {
            scriptElement.setAttribute(key, attributes[key]);
        });
    }
    
    // Only escape the dangerous sequence that could break out of script tag
    const safeContent = content.replace(/<\/script>/gi, '<\\/script>');
    scriptElement.innerHTML = safeContent;

    return scriptElement;
}

export function sanitizeHtmlComment(content: string) {

    // First escape the content safely
    const tempElement = document.createElement('div');
    tempElement.textContent = content;
    const safeContent = tempElement.innerHTML;

    // Then create comment with the safe content
    const comment = document.createComment(safeContent);
    const container = document.createElement('div');
    container.appendChild(comment);

    return container.innerHTML;
}