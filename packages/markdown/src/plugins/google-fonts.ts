/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { GoogleFontsSpec } from '@microsoft/chartifact-schema';
import { IInstance, Plugin, RawFlaggableSpec } from '../factory.js';
import { flaggablePlugin } from './config.js';
import { PluginNames } from './interfaces.js';
import { pluginClassName } from './util.js';

interface GoogleFontsInstance {
    id: string;
    spec: GoogleFontsSpec;
    styleElement: HTMLStyleElement;
    linkElement?: HTMLLinkElement;
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

// Helper function to sanitize sizing values for CSS safety
function sanitizeSizing(sizeValue: number): number | null {
    // Ensure it's a valid number
    if (typeof sizeValue !== 'number' || isNaN(sizeValue) || !isFinite(sizeValue)) {
        console.warn('Invalid sizing value - must be a finite number:', sizeValue);
        return null;
    }

    // Reasonable bounds: 0.1 (10%) to 9.999... (just under 1000%)
    if (sizeValue < 0.1 || sizeValue >= 10) {
        console.warn('Sizing value out of safe range (0.1 to 9.999):', sizeValue);
        return null;
    }

    // Round to 3 decimal places to prevent excessive precision
    return Math.round(sizeValue * 1000) / 1000;
}

// Helper function to extract font families from Google Fonts URL
function extractFontFamilies(googleFontsUrl: string) {
    const families: string[] = [];

    try {
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

            families.push(familyName);
        }
    } catch (error) {
        console.error('Failed to parse Google Fonts URL:', error);
    }

    return families;
}

// Helper function to generate scoped CSS for semantic elements
function generateSemanticCSS(spec: GoogleFontsSpec, families: string[], scopeId: string): string {
    const cssRules: string[] = [];

    // Helper to generate CSS rule for a specific element type
    const generateRule = (elementType: keyof NonNullable<GoogleFontsSpec['mapping']>, selectors: string) => {
        const fontFamily = spec.mapping?.[elementType];
        const sizeValue = spec.sizing?.[elementType];

        // Skip if neither font nor sizing is specified
        if (!fontFamily && !sizeValue) return;

        let css = `${selectors} {`;

        // Add font-family if mapping exists
        if (fontFamily) {
            const sanitizedName = sanitizeFontFamily(fontFamily);
            const family = families.find(f => f === sanitizedName);
            if (family) {
                css += `\n  font-family: '${family}';`;
            }
        }

        // Add font-size if sizing exists
        if (sizeValue) {
            const sanitizedSize = sanitizeSizing(sizeValue);
            if (sanitizedSize !== null) {
                css += `\n  font-size: ${sanitizedSize}em;`;
            }
        }

        css += '\n}';
        cssRules.push(css);
    };

    // Generate rules in cascading order (most general to most specific)
    generateRule('body', 'body');
    generateRule('headings', 'h1, h2, h3, h4, h5, h6');
    generateRule('code', 'code, pre, kbd, samp, tt, .hljs');
    generateRule('table', 'table, .tabulator');
    generateRule('hero', 'h1'); // Most specific, goes last

    return cssRules.join('\n\n');
}

const pluginName: PluginNames = 'google-fonts';
const className = pluginClassName(pluginName);

function inspectGoogleFontsSpec(spec: GoogleFontsSpec): RawFlaggableSpec<GoogleFontsSpec> {
    const reasons: string[] = [];
    let hasFlags = false;

    // Check if googleFontsUrl is provided
    if (!spec.googleFontsUrl) {
        reasons.push('googleFontsUrl is required');
        hasFlags = true;
    } else if (!isValidGoogleFontsUrl(spec.googleFontsUrl)) {
        reasons.push('Invalid googleFontsUrl - must be HTTPS and point to fonts.googleapis.com/css2');
        hasFlags = true;
    }

    // Check mapping and sizing for valid values
    for (const key of ['body', 'hero', 'headings', 'code', 'table'] as (keyof GoogleFontsSpec['mapping'])[]) {
        if (spec.mapping?.[key] && typeof spec.mapping[key] !== 'string') {
            reasons.push(`Invalid mapping for ${key} - must be a string`);
            hasFlags = true;
        }
        if (spec.sizing?.[key] && typeof spec.sizing[key] !== 'number') {
            reasons.push(`Invalid sizing for ${key} - must be a number`);
            hasFlags = true;
        }
    }

    return {
        spec,
        hasFlags,
        reasons,
    };
}

export const googleFontsPlugin: Plugin<GoogleFontsSpec> = {
    ...flaggablePlugin<GoogleFontsSpec>(pluginName, className, inspectGoogleFontsSpec),
    hydrateComponent: async (renderer, errorHandler, specs) => {
        const googleFontsInstances: GoogleFontsInstance[] = [];
        let emitted = false;
        for (let index = 0; index < specs.length; index++) {
            const specReview = specs[index];
            if (!specReview.approvedSpec) {
                continue;
            }
            const container = renderer.element.querySelector(`#${specReview.containerId}`);

            // Enforce one Google Fonts block per page
            if (emitted) {
                container.innerHTML = '<!-- Additional Google Fonts blocks ignored - only one per page allowed -->';
                continue;
            }

            try {
                const spec: GoogleFontsSpec = specReview.approvedSpec;

                if (!spec.googleFontsUrl) {
                    container.innerHTML = '<!-- Google Fonts Error: googleFontsUrl is required -->';
                    continue;
                }

                // Security: Validate Google Fonts URL before processing
                if (!isValidGoogleFontsUrl(spec.googleFontsUrl)) {
                    container.innerHTML = '<!-- Google Fonts Error: Only HTTPS Google Fonts URLs (https://fonts.googleapis.com/css2) are allowed -->';
                    continue;
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
                emitted = true;

                // Replace container content with summary
                const fontsList = families.join(', ');
                container.innerHTML = `<!-- Google Fonts loaded: ${fontsList} -->`;

            } catch (e) {
                container.innerHTML = `<!-- Google Fonts Error: ${e.toString()} -->`;
                errorHandler(e, 'Google Fonts', 0, 'parse', container);
            }
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
    }
};
