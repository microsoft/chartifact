/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
import htmlMarkdown from "./htmlMarkdown.mjs";
import htmlMarkdownJs from "./htmlMarkdownJs.mjs";
import htmlJson from "./htmlJson.mjs";
import htmlJsonJs from "./htmlJsonJs.mjs";

function htmlMarkdownWrapper(title: string, markdown: string) {
    const template = htmlMarkdown;

    const result = template
        .replace('{{TITLE}}', () => escapeHtml(title))

        .replace('{{HTML_MARKDOWN_JS}}', () => `<script>\n${htmlMarkdownJs}\n</script>`)
        .replace('{{TEXTAREA_CONTENT}}', () => escapeTextareaContent(markdown));

    return result;
}

function htmlJsonWrapper(title: string, json: string) {
    const template = htmlJson;

    const result = template
        .replace('{{TITLE}}', () => escapeHtml(title))

        .replace('{{HTML_JSON_JS}}', () => `<script>\n${htmlJsonJs}\n</script>`)
        .replace('{{TEXTAREA_CONTENT}}', () => escapeTextareaContent(json));

    return result;
}

function escapeTextareaContent(text: string) {
    return text
        .replace(/<\/textarea>/gi, '&lt;/textarea&gt;') // Prevent textarea breakage
        .replace(/<script/gi, '&lt;script')            // Block script tags
        .replace(/<\/script>/gi, '&lt;/script&gt;');   // Close script tag
}

function escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, (char) => {
        switch (char) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return char;
        }
    });
}

export default {
    htmlMarkdownWrapper,
    htmlJsonWrapper
};
