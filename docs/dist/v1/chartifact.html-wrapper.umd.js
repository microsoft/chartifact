(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Chartifact = global.Chartifact || {}));
})(this, (function(exports2) {
  "use strict";
  const htmlMarkdown = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <link rel="stylesheet" href="https://microsoft.github.io/chartifact/dist/v1/chartifact-toolbar.css" />
    <script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.toolbar.umd.js"><\/script>
    <script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.sandbox.umd.js"><\/script>
</head>

<body class="chartifact-body">

    <header class="chartifact-toolbar"></header>

    <main class="chartifact-main">
        <textarea class="chartifact-source" id="source" spellcheck="false"
            placeholder="Type your Chartifact markdown here...">{{TEXTAREA_CONTENT}}</textarea>

        <div class="chartifact-preview" id="preview"></div>

    </main>

    {{HTML_MARKDOWN_JS}}

</body>

</html>`;
  const htmlMarkdownJs = `/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
window.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('#source');
    const sandbox = new Chartifact.sandbox.Sandbox('#preview', textarea.value, {
        onApprove: (message) => {
            //Here you can approve unapproved specs per your own policy
            const { specs } = message;
            return specs;
        },
        onError: (error) => {
            console.error('Sandbox error:', error);
        },
    });
    textarea.addEventListener('input', () => {
        sandbox.send(textarea.value);
    });
    const toolbar = Chartifact.toolbar.create('.chartifact-toolbar', { tweakButton: true, textarea });
    toolbar.manageTextareaVisibilityForAgents();
});
`;
  const htmlJson = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <link rel="stylesheet" href="https://microsoft.github.io/chartifact/dist/v1/chartifact-toolbar.css" />
    <script src="https://unpkg.com/js-yaml@4.1.1/dist/js-yaml.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/vega@6.2.0"><\/script>
    <script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.toolbar.umd.js"><\/script>
    <script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.compiler.umd.js"><\/script>
    <script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.sandbox.umd.js"><\/script>
</head>

<body class="chartifact-body">

    <header class="chartifact-toolbar"></header>

    <main class="chartifact-main">
        <textarea class="chartifact-source" id="source" spellcheck="false"
            placeholder="Type your Chartifact json here...">{{TEXTAREA_CONTENT}}</textarea>

        <div class="chartifact-preview" id="preview"></div>

    </main>

    {{HTML_JSON_JS}}

</body>

</html>`;
  const htmlJsonJs = `/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
window.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('#source');
    let sandbox;
    const render = () => {
        const json = textarea.value;
        let markdown;
        try {
            const interactiveDocument = JSON.parse(json);
            if (typeof interactiveDocument !== 'object') {
                markdown = 'Invalid Interactive Document JSON';
            }
            else {
                markdown = Chartifact.compiler.targetMarkdown(interactiveDocument);
            }
        }
        catch (error) {
            markdown = 'Failed to parse Interactive Document JSON';
        }
        if (!sandbox) {
            sandbox = new Chartifact.sandbox.Sandbox('#preview', markdown, {
                onApprove: (message) => {
                    //Here you can approve unapproved specs per your own policy
                    const { specs } = message;
                    return specs;
                },
                onError: (error) => {
                    console.error('Sandbox error:', error);
                },
            });
        }
        else {
            sandbox.send(markdown);
        }
    };
    textarea.addEventListener('input', render);
    render();
    const toolbar = Chartifact.toolbar.create('.chartifact-toolbar', { tweakButton: true, textarea, mode: 'json' });
    toolbar.manageTextareaVisibilityForAgents();
});
`;
  function htmlMarkdownWrapper(title, markdown) {
    const template = htmlMarkdown;
    const result = template.replace("{{TITLE}}", () => escapeHtml(title)).replace("{{HTML_MARKDOWN_JS}}", () => `<script>
${htmlMarkdownJs}
<\/script>`).replace("{{TEXTAREA_CONTENT}}", () => escapeTextareaContent(markdown));
    return result;
  }
  function htmlJsonWrapper(title, json) {
    const template = htmlJson;
    const result = template.replace("{{TITLE}}", () => escapeHtml(title)).replace("{{HTML_JSON_JS}}", () => `<script>
${htmlJsonJs}
<\/script>`).replace("{{TEXTAREA_CONTENT}}", () => escapeTextareaContent(json));
    return result;
  }
  function escapeTextareaContent(text) {
    return text.replace(/<\/textarea>/gi, "&lt;/textarea&gt;").replace(/<script/gi, "&lt;script").replace(/<\/script>/gi, "&lt;/script&gt;");
  }
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return char;
      }
    });
  }
  const index = {
    htmlMarkdownWrapper,
    htmlJsonWrapper
  };
  exports2.htmlWrapper = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
