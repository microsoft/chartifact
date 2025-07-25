/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { definePlugin, IInstance, Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';

export interface GoogleFontsSpec {
    googleFontsUrl: string;
    mapping?: {
        body?: string;      // Base font - applies to everything if others not specified
        hero?: string;      // H1 only - the main hero title
        headings?: string;  // all headings
        code?: string;      // Code blocks and inline code
        table?: string;     // Tables and tabulator
    };
}

interface GoogleFontsInstance {
    id: string;
    spec: GoogleFontsSpec;
    styleElement: HTMLStyleElement;
    linkElement?: HTMLLinkElement;
}

interface FontFamily {
    name: string;
    fallback: string;
}

// Helper function to validate Google Fonts URL
function isValidGoogleFontsUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' &&
               parsed.hostname === 'fonts.googleapis.com' && 
               parsed.pathname === '/css2';
    } catch {
        return false;
    }
}

// Helper function to sanitize font family names for CSS safety
function sanitizeFontFamily(fontName: string): string {
    // Remove any characters that could be used for CSS injection
    // Allow only letters, numbers, spaces, hyphens, and basic punctuation
    return fontName.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
}

// Helper function to extract font families from Google Fonts URL
function extractFontFamilies(googleFontsUrl: string): FontFamily[] {
    const families: FontFamily[] = [];
    
    try {
        // Security: Validate this is a Google Fonts URL
        if (!isValidGoogleFontsUrl(googleFontsUrl)) {
            console.error('Invalid Google Fonts URL - only https://fonts.googleapis.com/css2 URLs are allowed');
            return families;
        }
        
        const url = new URL(googleFontsUrl);
        const params = url.searchParams;
        
        // Extract family parameters - Google Fonts uses 'family' parameter multiple times
        const familyParams = params.getAll('family');
        for (const value of familyParams) {
            // Parse: family=Cascadia+Code:ital,wght@0,200..700;1,200..700
            const rawFamilyName = value.split(':')[0].replace(/\+/g, ' ');
            
            // Security: Sanitize font family name to prevent CSS injection
            const familyName = sanitizeFontFamily(rawFamilyName);
            
            if (!familyName) {
                console.warn('Skipped invalid font family name:', rawFamilyName);
                continue;
            }
            
            // Determine fallback based on font name patterns
            let fallback = 'sans-serif';
            const lowerName = familyName.toLowerCase();
            if (lowerName.includes('mono') || lowerName.includes('code') || lowerName.includes('consola')) {
                fallback = 'monospace';
            } else if (lowerName.includes('serif') && !lowerName.includes('sans')) {
                fallback = 'serif';
            }
            
            families.push({ name: familyName, fallback });
        }
    } catch (error) {
        console.error('Failed to parse Google Fonts URL:', error);
    }
    
    return families;
}

// Helper function to generate scoped CSS for semantic elements
function generateSemanticCSS(spec: GoogleFontsSpec, families: FontFamily[], scopeId: string): string {
    const cssRules: string[] = [];
    
    if (spec.mapping) {
        // Base/Body font - applies to everything first (cascading base)
        if (spec.mapping.body) {
            const sanitizedName = sanitizeFontFamily(spec.mapping.body);
            const family = families.find(f => f.name === sanitizedName);
            if (family) {
                cssRules.push(`body {
  font-family: '${family.name}';
}`);
            }
        }
        
        // Headings font (h1, h2, h3, h4, h5, h6) - overrides body
        if (spec.mapping.headings) {
            const sanitizedName = sanitizeFontFamily(spec.mapping.headings);
            const family = families.find(f => f.name === sanitizedName);
            if (family) {
                cssRules.push(`h1, h2, h3, h4, h5, h6 {
  font-family: '${family.name}';
}`);
            }
        }
        
        // Code font - applies to code blocks and inline code
        if (spec.mapping.code) {
            const sanitizedName = sanitizeFontFamily(spec.mapping.code);
            const family = families.find(f => f.name === sanitizedName);
            if (family) {
                cssRules.push(`code, pre, kbd, samp, tt, .hljs {
  font-family: '${family.name}';
}`);
            }
        }
        
        // Table font - overrides code for table cells (if you want different from code)
        if (spec.mapping.table) {
            const sanitizedName = sanitizeFontFamily(spec.mapping.table);
            const family = families.find(f => f.name === sanitizedName);
            if (family) {
                cssRules.push(`table, .tabulator {
  font-family: '${family.name}';
}`);
            }
        }
        
        // Hero font (h1 only) - overrides headings (most specific, goes last)
        if (spec.mapping.hero) {
            const sanitizedName = sanitizeFontFamily(spec.mapping.hero);
            const family = families.find(f => f.name === sanitizedName);
            if (family) {
                cssRules.push(`h1 {
  font-family: '${family.name}';
}`);
            }
        }
    }
    
    return cssRules.join('\n\n');
}

// Helper function to generate unique document ID
function generateDocumentId(): string {
    return Math.random().toString(36).substr(2, 8);
}

export const googleFontsPlugin: Plugin = {
    name: 'google-fonts',
    initializePlugin: (md) => definePlugin(md, 'google-fonts'),
    fence: (token, idx) => {
        const googleFontsId = `google-fonts-${idx}`;
        return sanitizedHTML('div', { id: googleFontsId, class: 'google-fonts' }, token.content.trim());
    },
    hydrateComponent: async (renderer, errorHandler) => {
        const googleFontsInstances: GoogleFontsInstance[] = [];
        const containers = renderer.element.querySelectorAll('.google-fonts');
        
        // Enforce one Google Fonts block per page
        if (containers.length > 1) {
            for (let i = 1; i < containers.length; i++) {
                containers[i].innerHTML = '<!-- Additional Google Fonts blocks ignored - only one per page allowed -->';
            }
        }
        
        // Only process the first container
        const container = containers[0];
        if (!container || !container.textContent) {
            return [];
        }

        try {
            const spec: GoogleFontsSpec = JSON.parse(container.textContent);
            
            if (!spec.googleFontsUrl) {
                container.innerHTML = '<!-- Google Fonts Error: googleFontsUrl is required -->';
                return [];
            }
            
            // Security: Validate Google Fonts URL before processing
            if (!isValidGoogleFontsUrl(spec.googleFontsUrl)) {
                container.innerHTML = '<!-- Google Fonts Error: Only HTTPS Google Fonts URLs (https://fonts.googleapis.com/css2) are allowed -->';
                return [];
            }
            
            // Extract font families from the URL
            const families = extractFontFamilies(spec.googleFontsUrl);
            
            if (families.length === 0) {
                container.innerHTML = '<!-- Google Fonts Error: No font families found in URL -->';
                return [];
            }
            
            // Generate unique instance ID for scoping
            const instanceId = `gf-${Date.now()}-0`;
            
            // Create font import (using @import for now, could switch to <link> tags)
            const importCSS = `@import url('${spec.googleFontsUrl}');`;
            
            // Generate semantic CSS with instance-specific scoping
            const semanticCSS = generateSemanticCSS(spec, families, instanceId);
            
            // Combine import and semantic CSS
            const fullCSS = importCSS + '\n\n' + semanticCSS;
            
            // Create style element
            const styleElement = document.createElement('style');
            styleElement.type = 'text/css';
            styleElement.id = `idocs-google-fonts-${container.id}`;
            styleElement.textContent = fullCSS;
            
            // Apply to shadow DOM if available, otherwise document
            const target = renderer.shadowRoot || document.head;
            target.appendChild(styleElement);
            
            const googleFontsInstance: GoogleFontsInstance = {
                id: container.id,
                spec,
                styleElement
            };
            
            googleFontsInstances.push(googleFontsInstance);
            
            // Replace container content with summary
            const fontsList = families.map(f => f.name).join(', ');
            container.innerHTML = `<!-- Google Fonts loaded: ${fontsList} -->`;
            
        } catch (e) {
            container.innerHTML = `<!-- Google Fonts Error: ${e.toString()} -->`;
            errorHandler(e, 'Google Fonts', 0, 'parse', container);
        }

        const instances: IInstance[] = googleFontsInstances.map((googleFontsInstance) => {
            return {
                id: googleFontsInstance.id,
                initialSignals: [], // Google Fonts doesn't need signals
                destroy: () => {
                    // Remove the style element when the instance is destroyed
                    if (googleFontsInstance.styleElement && googleFontsInstance.styleElement.parentNode) {
                        googleFontsInstance.styleElement.parentNode.removeChild(googleFontsInstance.styleElement);
                    }
                    // Remove link element if it exists
                    if (googleFontsInstance.linkElement && googleFontsInstance.linkElement.parentNode) {
                        googleFontsInstance.linkElement.parentNode.removeChild(googleFontsInstance.linkElement);
                    }
                },
            };
        });

        return instances;
    },
};
