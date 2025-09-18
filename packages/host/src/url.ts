/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import { guardedFetch } from "./guardedFetch.js";
import { Listener } from "./listener.js";
import { ContentResult, determineContent } from "./string.js";

export function checkUrlForFile(host: Listener) {
  const urlParams = new URLSearchParams(window.location.search);
  const loadUrl = urlParams.get(host.options.urlParamName);

  if (!loadUrl) {
    return false; // No load parameter found
  }

  loadViaUrl(loadUrl, host, true, false);

  return true; // We found a load parameter
}

export async function loadViaUrl(loadUrl: string, host: Listener, handle: boolean, showRestart: boolean): Promise<ContentResult> {
  // Allow same-origin (including relative) URLs, or validate external URLs
  if (!isSameOrigin(loadUrl) && !isValidLoadUrl(loadUrl)) {
    return {
      error: 'Invalid URL format',
      errorDetail: 'The URL provided is not same-origin or has an invalid format, protocol, or contains suspicious characters.'
    };
  }

  try {
    const url = new URL(loadUrl, window.location.href);
    const response = await guardedFetch({ url: url.href });

    if (!response.status) {
      return {
        error: 'Error loading file',
        errorDetail: `Error loading file from the provided URL`
      };
    }
    const result = await determineContent(url.href, response.body, host, handle, showRestart);
    return result;
  } catch (error) {
    return {
      error: 'Error loading file',
      errorDetail: `Error loading file from the provided URL`
    };
  }
}

function isSameOrigin(url: string) {
  try {
    // First check if it's a relative URL (no protocol)
    if (!url.includes('://')) {
      // Relative URLs are inherently same-origin
      return true;
    }

    // For absolute URLs, check if origin matches
    const parsedUrl = new URL(url);
    return parsedUrl.origin === window.location.origin;
  } catch {
    return false;
  }
}

function isValidLoadUrl(url: string): boolean {
  try {
    // Resolve relative URLs against current location
    const parsedUrl = new URL(url, window.location.href);

    // Only allow http and https protocols, but allow http for localhost
    if (
      parsedUrl.protocol !== 'https:' &&
      !(parsedUrl.protocol === 'http:' && (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1'))
    ) {
      return false;
    }

    // Prevent javascript:, vbscript:, and data: URLs (redundant check but good for clarity)
    if (['javascript:', 'vbscript:', 'data:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Basic hostname validation (prevent obvious malicious patterns)
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname.includes('<') || hostname.includes('>') || hostname.includes('"') || hostname.includes("'")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
