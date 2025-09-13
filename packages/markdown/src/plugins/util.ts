/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

export function getJsonScriptTag(container: Element, errorHandler: (error: Error) => void) {
    const scriptTag = container.previousElementSibling;
    if (scriptTag?.tagName !== 'SCRIPT' || scriptTag.getAttribute('type') !== 'application/json') {
        errorHandler(new Error('Invalid JSON script tag'));
        return null;
    }
    if (!scriptTag.textContent) {
        errorHandler(new Error('Empty JSON script tag'));
        return null;
    }
    try {
        return JSON.parse(scriptTag.textContent);
    } catch (error) {
        errorHandler(error);
        return null;
    }
}

export function pluginClassName(pluginName: string) {
    return `chartifact-plugin-${pluginName}`;
}

export const newId = () => ([...Date.now().toString(36) + Math.random().toString(36).slice(2)]).sort(() => 0.5 - Math.random()).join('');

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return ((...args: any[]) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    }) as T;
}
