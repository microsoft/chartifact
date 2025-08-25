(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Chartifact = global.Chartifact || {}));
})(this, (function(exports2) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  const defaultCommonOptions = {
    dataSignalPrefix: "data_signal:",
    groupClassName: "group"
  };
  function collectIdentifiers(ast) {
    const identifiers = /* @__PURE__ */ new Set();
    function walk(node) {
      if (!node || typeof node !== "object")
        return;
      switch (node.type) {
        case "Identifier":
          if (!VEGA_BUILTIN_FUNCTIONS.includes(node.name)) {
            identifiers.add(node.name);
          }
          break;
        case "CallExpression":
          walk(node.callee);
          (node.arguments || []).forEach(walk);
          break;
        case "MemberExpression":
          walk(node.object);
          break;
        case "BinaryExpression":
        case "LogicalExpression":
          walk(node.left);
          walk(node.right);
          break;
        case "ConditionalExpression":
          walk(node.test);
          walk(node.consequent);
          walk(node.alternate);
          break;
        case "ArrayExpression":
          (node.elements || []).forEach(walk);
          break;
        default:
          for (const key in node) {
            if (node.hasOwnProperty(key)) {
              const value = node[key];
              if (Array.isArray(value))
                value.forEach(walk);
              else if (typeof value === "object")
                walk(value);
            }
          }
      }
    }
    walk(ast);
    return identifiers;
  }
  const VEGA_BUILTIN_FUNCTIONS = Object.freeze([
    // Built-ins from Vega Expression docs
    "abs",
    "acos",
    "asin",
    "atan",
    "atan2",
    "ceil",
    "clamp",
    "cos",
    "exp",
    "expm1",
    "floor",
    "hypot",
    "log",
    "log1p",
    "max",
    "min",
    "pow",
    "random",
    "round",
    "sign",
    "sin",
    "sqrt",
    "tan",
    "trunc",
    "length",
    "isNaN",
    "isFinite",
    "parseFloat",
    "parseInt",
    "Date",
    "now",
    "time",
    "utc",
    "timezoneOffset",
    "quarter",
    "month",
    "day",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
    "year"
  ]);
  function tokenizeTemplate(input) {
    const allVars = /{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}/g;
    const tokens = [];
    let lastIndex = 0;
    input.replace(allVars, (match, varName, offset) => {
      const staticPart = input.slice(lastIndex, offset);
      if (staticPart) {
        tokens.push({ type: "literal", value: staticPart });
      }
      tokens.push({ type: "variable", name: varName });
      lastIndex = offset + match.length;
      return match;
    });
    const tail = input.slice(lastIndex);
    if (tail) {
      tokens.push({ type: "literal", value: tail });
    }
    return tokens;
  }
  function renderVegaExpression(tokens, funcName = "encodeURIComponent") {
    if (tokens.length === 1 && tokens[0].type === "variable") {
      return tokens[0].name;
    }
    const escape = (str) => `'${str.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
    return tokens.map((token) => token.type === "literal" ? escape(token.value) : `${funcName}(${token.name})`).join(" + ");
  }
  function encodeTemplateVariables(input) {
    const tokens = tokenizeTemplate(input);
    return renderVegaExpression(tokens);
  }
  const index$3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    VEGA_BUILTIN_FUNCTIONS,
    collectIdentifiers,
    defaultCommonOptions,
    encodeTemplateVariables,
    renderVegaExpression,
    tokenizeTemplate
  }, Symbol.toStringTag, { value: "Module" }));
  const rendererHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>{{TITLE}}</title>

    {{DEPENDENCIES}}

    {{RENDER_OPTIONS}}

    {{RENDER_REQUEST}}

    {{SANDBOX_JS}}

</head>

<body></body>

</html>`;
  const sandboxedJs = `let renderer;
document.addEventListener('DOMContentLoaded', () => {
    let transactionIndex = 0;
    const transactions = {};
    renderer = new Chartifact.markdown.Renderer(document.body, {
        ...rendererOptions,
        errorHandler: (error, pluginName, instanceIndex, phase, container, detail) => {
            console.error(\`Error in plugin \${pluginName} at instance \${instanceIndex} during \${phase}:\`, error);
            if (detail) {
                console.error('Detail:', detail);
            }
            container.innerHTML = \`<div style="color: red;">Error: \${error.message}</div>\`;
        }
    });
    function render(request) {
        if (request.markdown) {
            renderer.reset();
            //debugger;
            const html = renderer.renderHtml(request.markdown);
            renderer.element.innerHTML = html;
            const specs = renderer.hydrateSpecs();
            const transactionId = transactionIndex++;
            transactions[transactionId] = specs;
            //send message to parent to ask for whitelist
            const sandboxedPreRenderMessage = {
                type: 'sandboxedPreHydrate',
                transactionId,
                specs,
            };
            window.parent.postMessage(sandboxedPreRenderMessage, '*');
        }
    }
    render(renderRequest);
    //add listener for postMessage
    window.addEventListener('message', (event) => {
        if (!event.data)
            return;
        const message = event.data;
        switch (message.type) {
            case 'sandboxRender': {
                render(message);
                break;
            }
            case 'sandboxApproval': {
                //debugger;
                //only handle if the transactionId is the latest
                if (message.transactionId === transactionIndex - 1) {
                    //todo: console.warn of unapproved
                    //hydrate the renderer
                    const flags = transactions[message.transactionId];
                    if (flags) {
                        renderer.hydrate(flags);
                    }
                }
                else {
                    console.debug('Received sandbox approval for an outdated transaction:', message.transactionId, transactionIndex);
                }
                break;
            }
        }
    });
});
`;
  class Sandbox {
    constructor(elementOrSelector, markdown, options) {
      __publicField(this, "element");
      __publicField(this, "iframe");
      this.options = options;
      if (typeof elementOrSelector === "string") {
        this.element = document.querySelector(elementOrSelector);
        if (!this.element) {
          throw new Error(`Element not found: ${elementOrSelector}`);
        }
      } else if (elementOrSelector instanceof HTMLElement) {
        this.element = elementOrSelector;
      } else {
        throw new Error("Invalid element type, must be a string selector or HTMLElement");
      }
      const renderRequest = {
        type: "sandboxRender",
        markdown
      };
      const { iframe } = this.createIframe(renderRequest);
      this.iframe = iframe;
      this.element.appendChild(this.iframe);
      this.iframe.addEventListener("load", () => {
        var _a;
        (_a = options == null ? void 0 : options.onReady) == null ? void 0 : _a.call(options);
      });
      this.iframe.addEventListener("error", (error) => {
        var _a;
        console.error("Error loading iframe:", error);
        (_a = options == null ? void 0 : options.onError) == null ? void 0 : _a.call(options, new Error("Failed to load iframe"));
      });
      window.addEventListener("message", (event) => {
        var _a;
        if (event.source === this.iframe.contentWindow) {
          const message = event.data;
          if (message.type == "sandboxedPreHydrate") {
            const specs = this.options.onApprove(message);
            const sandboxedApprovalMessage = {
              type: "sandboxApproval",
              transactionId: message.transactionId,
              specs
            };
            (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(sandboxedApprovalMessage, "*");
          }
        }
      });
    }
    createIframe(renderRequest, rendererOptions = {}) {
      const title = "Chartifact Interactive Document Sandbox";
      const html = rendererHtml.replace("{{TITLE}}", () => title).replace("{{DEPENDENCIES}}", () => this.getDependencies()).replace("{{RENDER_REQUEST}}", () => `<script>const renderRequest = ${JSON.stringify(renderRequest)};<\/script>`).replace("{{RENDER_OPTIONS}}", () => `<script>const rendererOptions = ${JSON.stringify(rendererOptions)};<\/script>`).replace("{{SANDBOX_JS}}", () => `<script>${sandboxedJs}<\/script>`);
      const htmlBlob = new Blob([html], { type: "text/html" });
      const blobUrl = URL.createObjectURL(htmlBlob);
      const iframe = document.createElement("iframe");
      iframe.sandbox = "allow-scripts allow-popups";
      iframe.src = blobUrl;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.title = title;
      return { iframe, blobUrl };
    }
    destroy() {
      var _a;
      this.iframe.removeEventListener("load", () => {
      });
      this.iframe.removeEventListener("error", () => {
      });
      (_a = this.iframe) == null ? void 0 : _a.remove();
    }
    send(markdown) {
      var _a;
      const message = {
        type: "sandboxRender",
        markdown
      };
      (_a = this.iframe.contentWindow) == null ? void 0 : _a.postMessage(message, "*");
    }
    getDependencies() {
      const { hostname, origin } = window.location;
      const url = hostname === "localhost" ? origin : "https://microsoft.github.io/chartifact";
      return `
<link href="https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css" rel="stylesheet" />
<link href="${url}/dist/v1/chartifact-reset.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"><\/script>
<script src="https://unpkg.com/css-tree/dist/csstree.js"><\/script>
<script src="https://unpkg.com/js-yaml/dist/js-yaml.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/vega@5.29.0"><\/script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5.20.1"><\/script>
<script src="https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js"><\/script>
<script src="${url}/dist/v1/chartifact.markdown.umd.js"><\/script>
`;
    }
  }
  const index$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Sandbox
  }, Symbol.toStringTag, { value: "Module" }));
  const htmlMarkdown = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <link rel="stylesheet" href="https://microsoft.github.io/chartifact/dist/v1/chartifact-toolbar.css" />
    <script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.sandbox.umd.js"><\/script>
</head>

<body class="chartifact-body">

    <header class="chartifact-toolbar"></header>

    <main class="chartifact-main">
        <textarea class="chartifact-source" id="source"
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
    <script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.sandbox.umd.js"><\/script>
    <script src="https://microsoft.github.io/chartifact/dist/v1/chartifact.compiler.umd.js"><\/script>
</head>

<body class="chartifact-body">

    <header class="chartifact-toolbar"></header>

    <main class="chartifact-main">
        <textarea class="chartifact-source" id="source"
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
    const toolbar = Chartifact.toolbar.create('.chartifact-toolbar', { tweakButton: true, textarea });
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
  const index$1 = {
    htmlMarkdownWrapper,
    htmlJsonWrapper
  };
  class Toolbar {
    constructor(toolbarElementOrSelector, options = {}) {
      __publicField(this, "options");
      __publicField(this, "toolbarElement");
      __publicField(this, "folderSpan");
      __publicField(this, "tweakButton");
      __publicField(this, "restartButton");
      __publicField(this, "downloadButton");
      __publicField(this, "mode");
      __publicField(this, "filename");
      __publicField(this, "downloadPopup");
      var _a, _b, _c, _d, _e;
      this.options = options;
      this.filename = options.filename || "sample";
      this.mode = options.mode || "markdown";
      this.toolbarElement = typeof toolbarElementOrSelector === "string" ? document.querySelector(toolbarElementOrSelector) : toolbarElementOrSelector;
      if (!this.toolbarElement) {
        throw new Error("Toolbar element not found");
      }
      const { home, target } = window.location.hostname === "localhost" ? { home: "/", target: "_self" } : { home: "https://microsoft.github.io/chartifact", target: "_blank" };
      const html = `
<div>
    <a href="${home}" target="${target}">Chartifact</a> viewer
</div>
<div id="folderSpan" style="display: none;"></div>
<div>
    <button type="button" id="restart" style="display: none;">start over</button>
    <button type="button" id="tweak" style="display: none;">view source</button>
    <button type="button" id="download" style="display: none;">download</button>
</div>
<div id="downloadPopup" style="position: absolute; display: none; padding: 12px 16px; z-index: 1; background-color: inherit;">
    <div style="margin-bottom: 8px;">Download as:</div>
    <ul>
        <li>
            Source markdown (just the content)<br/>
            <button type="button" id="download-md" style="margin-right: 8px;">Source markdown</button>
        </li>
        <li>
            HTML wrapper (content plus a shareable viewer)<br/>
            <button type="button" id="download-html">HTML wrapper</button>
        </li>
    </ul>
</div>
        `;
      this.toolbarElement.innerHTML = html;
      this.folderSpan = this.toolbarElement.querySelector("#folderSpan");
      this.tweakButton = this.toolbarElement.querySelector("#tweak");
      this.restartButton = this.toolbarElement.querySelector("#restart");
      this.downloadButton = this.toolbarElement.querySelector("#download");
      this.downloadPopup = this.toolbarElement.querySelector("#downloadPopup");
      if (this.options.tweakButton) {
        this.showTweakButton();
      }
      if (this.options.restartButton) {
        this.showRestartButton();
      }
      if (this.options.downloadButton) {
        this.showDownloadButton();
      }
      (_a = this.tweakButton) == null ? void 0 : _a.addEventListener("click", () => {
        this.options.textarea.style.display = this.options.textarea.style.display === "none" ? "" : "none";
      });
      (_b = this.restartButton) == null ? void 0 : _b.addEventListener("click", () => {
        window.location.reload();
      });
      (_c = this.downloadButton) == null ? void 0 : _c.addEventListener("click", (e) => {
        const rect = this.downloadButton.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const buttonCenter = rect.left + rect.width / 2;
        const isLeftOfCenter = buttonCenter < viewportWidth / 2;
        if (isLeftOfCenter) {
          this.downloadPopup.style.left = `${rect.left + window.scrollX}px`;
          this.downloadPopup.style.right = "";
        } else {
          this.downloadPopup.offsetWidth;
          this.downloadPopup.style.right = `${viewportWidth - rect.right - window.scrollX}px`;
          this.downloadPopup.style.left = "";
        }
        this.downloadPopup.style.top = `${rect.bottom + window.scrollY + 4}px`;
        this.downloadPopup.style.display = "block";
        const hidePopup = (evt) => {
          if (!this.downloadPopup.contains(evt.target) && evt.target !== this.downloadButton) {
            this.downloadPopup.style.display = "none";
            document.removeEventListener("mousedown", hidePopup);
          }
        };
        setTimeout(() => document.addEventListener("mousedown", hidePopup), 0);
      });
      (_d = this.downloadPopup.querySelector("#download-md")) == null ? void 0 : _d.addEventListener("click", () => {
        this.downloadPopup.style.display = "none";
        const textarea = this.options.textarea;
        if (!textarea)
          return;
        const content = textarea.value;
        const filename = `${filenameWithoutPathOrExtension(this.filename)}.idoc.md`;
        this.triggerDownload(content, filename, "text/markdown");
      });
      (_e = this.downloadPopup.querySelector("#download-html")) == null ? void 0 : _e.addEventListener("click", () => {
        this.downloadPopup.style.display = "none";
        const textarea = this.options.textarea;
        if (!textarea)
          return;
        const filename = `${filenameWithoutPathOrExtension(this.filename)}.idoc.html`;
        const html2 = this.htmlWrapper();
        this.triggerDownload(html2, filename, "text/html");
      });
    }
    htmlWrapper() {
      if (this.mode === "markdown") {
        return index$1.htmlMarkdownWrapper(this.filename, this.options.textarea.value);
      } else if (this.mode === "json") {
        return index$1.htmlJsonWrapper(this.filename, this.options.textarea.value);
      }
    }
    // Helper method to trigger a download
    triggerDownload(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }
    showTweakButton() {
      this.tweakButton.style.display = "";
    }
    showRestartButton() {
      this.restartButton.style.display = "";
    }
    showDownloadButton() {
      this.downloadButton.style.display = "";
    }
    manageTextareaVisibilityForAgents() {
      const { textarea } = this.options;
      if (!textarea) {
        throw new Error("Textarea element not found");
      }
      textarea.style.flex = "0";
      textarea.style.padding = "0";
      textarea.style.border = "0";
      setTimeout(() => {
        textarea.style.flex = "";
        textarea.style.padding = "";
        textarea.style.border = "";
        textarea.style.display = "none";
      }, 300);
    }
  }
  function filenameWithoutPathOrExtension(filename) {
    const base = filename.split(/[\\/]/).pop() || filename;
    const idocIdx = base.indexOf(".idoc");
    if (idocIdx !== -1) {
      return base.substring(0, idocIdx);
    }
    const lastDot = base.lastIndexOf(".");
    if (lastDot > 0) {
      return base.substring(0, lastDot);
    }
    return base;
  }
  function create(toolbarElementOrSelector, options = {}) {
    const toolbar = new Toolbar(toolbarElementOrSelector, options);
    toolbar.manageTextareaVisibilityForAgents();
    return toolbar;
  }
  const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Toolbar,
    create
  }, Symbol.toStringTag, { value: "Module" }));
  exports2.common = index$3;
  exports2.sandbox = index$2;
  exports2.toolbar = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
