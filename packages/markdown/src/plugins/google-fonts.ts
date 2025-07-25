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

// Helper function to extract font families from Google Fonts URL
function extractFontFamilies(googleFontsUrl: string): FontFamily[] {
    const families: FontFamily[] = [];
    
    try {
        const url = new URL(googleFontsUrl);
        const params = url.searchParams;
        
        // Extract family parameters - Google Fonts uses 'family' parameter multiple times
        const familyParams = params.getAll('family');
        for (const value of familyParams) {
            // Parse: family=Cascadia+Code:ital,wght@0,200..700;1,200..700
            const familyName = value.split(':')[0].replace(/\+/g, ' ');
            
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
    
    console.log('CSS Generation Debug:', {
        families,
        mapping: spec.mapping
    });
    
    if (spec.mapping) {
        // Base/Body font - applies to everything first (cascading base)
        if (spec.mapping.body) {
            const family = families.find(f => f.name === spec.mapping.body);
            console.log('Body font lookup:', { requested: spec.mapping.body, found: family });
            if (family) {
                cssRules.push(`body {
  font-family: '${family.name}';
}`);
            }
        }
        
        // Headings font (h1, h2, h3, h4, h5, h6) - overrides body
        if (spec.mapping.headings) {
            const family = families.find(f => f.name === spec.mapping.headings);
            console.log('Headings font lookup:', { requested: spec.mapping.headings, found: family });
            if (family) {
                cssRules.push(`h1, h2, h3, h4, h5, h6 {
  font-family: '${family.name}';
}`);
            }
        }
        
        // Code font - applies to code blocks and inline code
        if (spec.mapping.code) {
            const family = families.find(f => f.name === spec.mapping.code);
            console.log('Code font lookup:', { requested: spec.mapping.code, found: family });
            if (family) {
                cssRules.push(`code, pre, kbd, samp, tt, .hljs {
  font-family: '${family.name}';
}`);
            }
        }
        
        // Table font - overrides code for table cells (if you want different from code)
        if (spec.mapping.table) {
            const family = families.find(f => f.name === spec.mapping.table);
            console.log('Table font lookup:', { requested: spec.mapping.table, found: family });
            if (family) {
                cssRules.push(`table, .tabulator {
  font-family: '${family.name}';
}`);
            }
        }
        
        // Hero font (h1 only) - overrides headings (most specific, goes last)
        if (spec.mapping.hero) {
            const family = families.find(f => f.name === spec.mapping.hero);
            console.log('Hero font lookup:', { requested: spec.mapping.hero, found: family });
            if (family) {
                cssRules.push(`h1 {
  font-family: '${family.name}';
}`);
            }
        }
    }
    
    const finalCSS = cssRules.join('\n\n');
    console.log('Generated CSS:', finalCSS);
    return finalCSS;
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
            
            // Extract font families from the URL
            const families = extractFontFamilies(spec.googleFontsUrl);
            
            console.log('Google Fonts Debug:', {
                url: spec.googleFontsUrl,
                extractedFamilies: families,
                mapping: spec.mapping
            });
            
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
