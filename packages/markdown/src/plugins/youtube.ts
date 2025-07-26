/*!
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/

import { definePlugin, IInstance, Plugin } from '../factory.js';
import { sanitizedHTML } from '../sanitize.js';
import { getJsonScriptTag } from './util.js';
import { iframePlugin, IframeSpec } from './iframe.js';

export interface YouTubeSpec {
    url: string;
    // Optional advanced options
    width?: number | string;
    height?: number | string;
    start?: number;
    end?: number;
    autoplay?: boolean;
    controls?: boolean;
    modestbranding?: boolean;
    rel?: boolean;
    loop?: boolean;
}

// Extract video ID from various YouTube URL formats
function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /youtu\.be\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Build YouTube embed URL from spec
function buildYouTubeEmbedUrl(spec: YouTubeSpec): string {
    const videoId = extractYouTubeVideoId(spec.url);
    if (!videoId) throw new Error('Invalid YouTube URL');
    
    const url = new URL(`https://www.youtube.com/embed/${videoId}`);
    
    // Add parameters based on spec
    if (spec.start !== undefined) url.searchParams.set('start', spec.start.toString());
    if (spec.end !== undefined) url.searchParams.set('end', spec.end.toString());
    if (spec.autoplay !== undefined) url.searchParams.set('autoplay', spec.autoplay ? '1' : '0');
    if (spec.controls !== undefined) url.searchParams.set('controls', spec.controls ? '1' : '0');
    if (spec.modestbranding !== undefined) url.searchParams.set('modestbranding', spec.modestbranding ? '1' : '0');
    if (spec.rel !== undefined) url.searchParams.set('rel', spec.rel ? '1' : '0');
    if (spec.loop !== undefined && spec.loop) {
        url.searchParams.set('loop', '1');
        url.searchParams.set('playlist', videoId); // Required for loop
    }
    
    return url.toString();
}

// Convert YouTube spec to iframe spec
function youTubeSpecToIframeSpec(youtubeSpec: YouTubeSpec): IframeSpec {
    const embedUrl = buildYouTubeEmbedUrl(youtubeSpec);
    
    return {
        src: embedUrl,
        width: youtubeSpec.width || 560,
        height: youtubeSpec.height || 315,
        title: 'YouTube video player',
        allowfullscreen: true,
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        referrerpolicy: 'strict-origin-when-cross-origin'
    };
}

// Parse YouTube iframe HTML and extract spec  
function parseYouTubeIframe(html: string): YouTubeSpec | null {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const iframe = doc.querySelector('iframe');
        
        if (!iframe) return null;
        
        const src = iframe.getAttribute('src');
        if (!src) return null;
        
        // Validate it's a YouTube URL
        const videoId = extractYouTubeVideoId(src);
        if (!videoId) return null;
        
        // Extract parameters from src URL
        const url = new URL(src);
        const spec: YouTubeSpec = { url: src };
        
        // Extract iframe attributes
        const width = iframe.getAttribute('width');
        const height = iframe.getAttribute('height');
        if (width) spec.width = isNaN(Number(width)) ? width : Number(width);
        if (height) spec.height = isNaN(Number(height)) ? height : Number(height);
        
        // Extract URL parameters
        if (url.searchParams.has('start')) {
            spec.start = parseInt(url.searchParams.get('start')!, 10);
        }
        if (url.searchParams.has('end')) {
            spec.end = parseInt(url.searchParams.get('end')!, 10);
        }
        if (url.searchParams.has('autoplay')) {
            spec.autoplay = url.searchParams.get('autoplay') === '1';
        }
        if (url.searchParams.has('controls')) {
            spec.controls = url.searchParams.get('controls') !== '0';
        }
        if (url.searchParams.has('modestbranding')) {
            spec.modestbranding = url.searchParams.get('modestbranding') === '1';
        }
        if (url.searchParams.has('rel')) {
            spec.rel = url.searchParams.get('rel') !== '0';
        }
        if (url.searchParams.has('loop')) {
            spec.loop = url.searchParams.get('loop') === '1';
        }
        
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

// Parse YouTube content
function parseYouTubeContent(content: string): YouTubeSpec | null {
    const contentType = detectContentType(content);
    
    if (contentType === 'html') {
        return parseYouTubeIframe(content);
    } else {
        try {
            const parsed = JSON.parse(content) as YouTubeSpec;
            if (!parsed.url) return null;
            
            // Validate it's a YouTube URL
            if (!extractYouTubeVideoId(parsed.url)) return null;
            
            return parsed;
        } catch (e) {
            return null;
        }
    }
}

export const youtubePlugin: Plugin = {
    name: 'youtube',
    initializePlugin: (md) => definePlugin(md, 'youtube'),
    fence: (token, idx) => {
        const content = token.content.trim();
        const youtubeSpec = parseYouTubeContent(content);
        
        if (!youtubeSpec) {
            return sanitizedHTML('div', { class: 'youtube-error' }, 'Invalid YouTube content', true);
        }
        
        // Convert to iframe spec and delegate to iframe plugin
        const iframeSpec = youTubeSpecToIframeSpec(youtubeSpec);
        return sanitizedHTML('div', { class: 'iframe' }, JSON.stringify(iframeSpec), true);
    },
    hydrateComponent: async (renderer, errorHandler) => {
        // Handle YouTube-specific errors
        const errorContainers = renderer.element.querySelectorAll('.youtube-error');
        errorContainers.forEach((container, index) => {
            container.innerHTML = '<div class="error">Invalid YouTube URL or content format</div>';
        });
        
        // Delegate to iframe plugin for actual rendering
        return iframePlugin.hydrateComponent!(renderer, errorHandler);
    },
};
