/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { definePlugin, IInstance, Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { getJsonScriptTag } from './util.js';

export interface IframeSpec {
    src: string;
    width?: number | string;
    height?: number | string;
    title?: string;
    allowfullscreen?: boolean;
    loading?: 'lazy' | 'eager';
    sandbox?: string;
    allow?: string;
    referrerpolicy?: string;
}

interface IframeInstance {
    id: string;
    spec: IframeSpec;
    element: HTMLIFrameElement;
}

// Whitelist of allowed domains for iframe embeds
const ALLOWED_DOMAINS = [
    'youtube.com',
    'www.youtube.com',
    'player.vimeo.com',
    'codepen.io',
    'codesandbox.io',
    'stackblitz.com',
    'embed.music.apple.com',
    'open.spotify.com',
    'soundcloud.com',
    'w.soundcloud.com'
];

// Check if URL is from an allowed domain
function isAllowedDomain(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return ALLOWED_DOMAINS.some(domain => 
            urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
        );
    } catch (e) {
        return false;
    }
}

// Parse iframe HTML and extract spec
function parseIframeHtml(html: string): IframeSpec | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const iframe = doc.querySelector('iframe');
        
        if (!iframe) return null;
        
        const src = iframe.getAttribute('src');
        if (!src) return null;
        
        // Validate domain
        if (!isAllowedDomain(src)) return null;
        
        const spec: IframeSpec = { src };
        
        // Extract attributes
        const width = iframe.getAttribute('width');
        const height = iframe.getAttribute('height');
        const title = iframe.getAttribute('title');
        const allowfullscreen = iframe.hasAttribute('allowfullscreen');
        const loading = iframe.getAttribute('loading') as 'lazy' | 'eager' | null;
        const sandbox = iframe.getAttribute('sandbox');
        const allow = iframe.getAttribute('allow');
        const referrerpolicy = iframe.getAttribute('referrerpolicy');
        
        if (width) spec.width = isNaN(Number(width)) ? width : Number(width);
        if (height) spec.height = isNaN(Number(height)) ? height : Number(height);
        if (title) spec.title = title;
        if (allowfullscreen) spec.allowfullscreen = true;
        if (loading) spec.loading = loading;
        if (sandbox) spec.sandbox = sandbox;
        if (allow) spec.allow = allow;
        if (referrerpolicy) spec.referrerpolicy = referrerpolicy;
        
        return spec;
    } catch (e) {
        return null;
    }
}

// Detect content type (json vs html)
function detectContentType(content: string): 'json' | 'html' {
    const trimmed = content.trim();
    if (trimmed.startsWith('<iframe')) return 'html';
    return 'json';
}

// Parse content based on type
function parseIframeContent(content: string): IframeSpec | null {
    const contentType = detectContentType(content);
    
    if (contentType === 'html') {
        return parseIframeHtml(content);
    } else {
        try {
            const parsed = JSON.parse(content) as IframeSpec;
            if (!parsed.src) return null;
            
            // Validate domain
            if (!isAllowedDomain(parsed.src)) return null;
            
            return parsed;
        } catch (e) {
            return null;
        }
    }
}

export const iframePlugin: Plugin = {
    name: 'iframe',
    initializePlugin: (md) => definePlugin(md, 'iframe'),
    fence: (token, idx) => {
        const content = token.content.trim();
        const spec = parseIframeContent(content);
        
        if (!spec) {
            // Return error content that will be handled in hydration
            return sanitizedHTML('div', { class: 'iframe-error' }, 'Invalid iframe content or disallowed domain', true);
        }
        
        return sanitizedHTML('div', { class: 'iframe' }, JSON.stringify(spec), true);
    },
    hydrateComponent: async (renderer, errorHandler) => {
        const iframeInstances: IframeInstance[] = [];
        
        // Handle error cases first
        const errorContainers = renderer.element.querySelectorAll('.iframe-error');
        errorContainers.forEach((container, index) => {
            container.innerHTML = '<div class="error">Invalid iframe URL or content format, or domain not allowed</div>';
        });
        
        // Handle valid iframe containers
        const containers = renderer.element.querySelectorAll('.iframe');
        for (const [index, container] of Array.from(containers).entries()) {
            const scriptTag = getJsonScriptTag(container);
            if (!scriptTag) continue;

            try {
                const spec: IframeSpec = JSON.parse(scriptTag.textContent);
                
                // Create iframe element
                const iframe = document.createElement('iframe');
                iframe.src = spec.src;
                iframe.width = (spec.width || 560).toString();
                iframe.height = (spec.height || 315).toString();
                iframe.title = spec.title || 'Embedded content';
                
                // Set optional attributes
                if (spec.allowfullscreen) iframe.setAttribute('allowfullscreen', '');
                if (spec.loading) iframe.setAttribute('loading', spec.loading);
                if (spec.sandbox) iframe.setAttribute('sandbox', spec.sandbox);
                if (spec.allow) iframe.setAttribute('allow', spec.allow);
                if (spec.referrerpolicy) iframe.setAttribute('referrerpolicy', spec.referrerpolicy);
                
                // Default security attributes
                iframe.setAttribute('frameborder', '0');
                
                // Clear container and add iframe
                container.innerHTML = '';
                container.appendChild(iframe);
                
                const iframeInstance: IframeInstance = { 
                    id: `iframe-${index}`, 
                    spec, 
                    element: iframe 
                };
                iframeInstances.push(iframeInstance);
                
            } catch (e) {
                container.innerHTML = `<div class="error">${e.toString()}</div>`;
                errorHandler(e, 'Iframe', index, 'parse', container);
                continue;
            }
        }
        
        const instances: IInstance[] = iframeInstances.map((iframeInstance) => {
            return {
                id: iframeInstance.id,
                initialSignals: [], // Iframe doesn't need signals initially
                destroy: () => {
                    if (iframeInstance.element && iframeInstance.element.parentNode) {
                        iframeInstance.element.parentNode.removeChild(iframeInstance.element);
                    }
                },
            };
        });

        return instances;
    },
};
