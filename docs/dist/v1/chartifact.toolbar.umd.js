(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Chartifact = global.Chartifact || {}));
})(this, (function(exports2) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

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
    <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.1/dist/js-yaml.min.js"><\/script>
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
  const index$1 = {
    htmlMarkdownWrapper,
    htmlJsonWrapper
  };
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  function decamelize(str, separator = "-") {
    return str.replace(/([a-z\d])([A-Z])/g, "$1" + separator + "$2").replace(/([A-Z]+)([A-Z][a-z\d]+)/g, "$1" + separator + "$2").toLowerCase();
  }
  function createElement(tag, attrs, ...children) {
    if (typeof tag === "function") {
      const fn = tag;
      let props = attrs;
      if (props === null || props === void 0) {
        props = { children };
      } else {
        props.children = children;
      }
      return fn(props);
    } else {
      const ns = tag === "svg" ? SVG_NAMESPACE : null;
      const el = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
      const map = attrs;
      let ref;
      for (let name in map) {
        if (name && map.hasOwnProperty(name)) {
          let value = map[name];
          if (name === "className" && value !== void 0) {
            setAttribute(el, ns, "class", value.toString());
          } else if (name === "disabled" && !value) ;
          else if (value === null || value === void 0) {
            continue;
          } else if (value === true) {
            setAttribute(el, ns, name, name);
          } else if (typeof value === "function") {
            if (name === "ref") {
              ref = value;
            } else {
              el[name.toLowerCase()] = value;
            }
          } else if (typeof value === "object") {
            setAttribute(el, ns, name, flatten(value));
          } else {
            setAttribute(el, ns, name, value.toString());
          }
        }
      }
      if (children && children.length > 0) {
        appendChildren(el, children);
      }
      if (ref) {
        ref(el);
      }
      return el;
    }
  }
  function setAttribute(el, ns, name, value) {
    if (ns) {
      el.setAttributeNS(null, name, value);
    } else {
      el.setAttribute(name, value);
    }
  }
  function flatten(o) {
    const arr = [];
    for (let prop in o)
      arr.push(`${decamelize(prop, "-")}:${o[prop]}`);
    return arr.join(";");
  }
  function isInsideForeignObject(element) {
    let current = element;
    while (current) {
      if (current.tagName.toLowerCase() === "foreignobject") {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }
  function recreateWithSvgNamespace(element) {
    const svgElement = document.createElementNS(SVG_NAMESPACE, element.tagName.toLowerCase());
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      svgElement.setAttributeNS(null, attr.name, attr.value);
    }
    const eventProperties = [
      "onclick",
      "onmousedown",
      "onmouseup",
      "onmouseover",
      "onmouseout",
      "onmousemove",
      "onkeydown",
      "onkeyup",
      "onkeypress",
      "onfocus",
      "onblur"
    ];
    for (const prop of eventProperties) {
      if (element[prop]) {
        svgElement[prop] = element[prop];
      }
    }
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        svgElement.appendChild(recreateWithSvgNamespace(child));
      } else {
        svgElement.appendChild(child.cloneNode(true));
      }
    }
    return svgElement;
  }
  function addChild(parentElement, child) {
    if (child === null || child === void 0 || typeof child === "boolean") {
      return;
    } else if (Array.isArray(child)) {
      appendChildren(parentElement, child);
    } else if (isElement(child)) {
      const childEl = child;
      if (parentElement.namespaceURI === SVG_NAMESPACE && childEl.namespaceURI !== SVG_NAMESPACE && childEl.tagName.toLowerCase() !== "foreignobject" && !isInsideForeignObject(parentElement)) {
        const recreated = recreateWithSvgNamespace(childEl);
        parentElement.appendChild(recreated);
      } else {
        parentElement.appendChild(childEl);
      }
    } else {
      parentElement.appendChild(document.createTextNode(child.toString()));
    }
  }
  function appendChildren(parentElement, children) {
    children.forEach((child) => addChild(parentElement, child));
  }
  function isElement(el) {
    return !!el.nodeType;
  }
  function mount(element, container) {
    container.innerHTML = "";
    if (element) {
      addChild(container, element);
    }
  }
  const ToolbarElement = (props) => {
    const { mode, restartClick, tweakClick, downloadClick, restartDisplay, tweakDisplay, downloadDisplay, downloadSource, downloadHtml, children } = props;
    const { home, target } = window.location.hostname === "localhost" ? { home: "/", target: "_self" } : { home: "https://microsoft.github.io/", target: "_blank" };
    const displayMode = mode === "json" ? "json" : "markdown";
    return /* @__PURE__ */ createElement("div", { className: "toolbar-group", style: { backgroundColor: "inherit" } }, /* @__PURE__ */ createElement("div", { className: "toolbar-item" }, /* @__PURE__ */ createElement("a", { href: `${home}chartifact/`, target }, "Chartifact"), " viewer"), /* @__PURE__ */ createElement("div", { className: "toolbar-item", style: { display: children ? "" : "none" } }, children), /* @__PURE__ */ createElement("div", { className: "toolbar-item" }, /* @__PURE__ */ createElement("span", { className: "toolbar-mode" }, displayMode, " mode "), /* @__PURE__ */ createElement("button", { type: "button", style: { display: restartDisplay }, onClick: restartClick }, "start over"), /* @__PURE__ */ createElement("button", { type: "button", style: { display: tweakDisplay }, onClick: tweakClick }, "view source"), /* @__PURE__ */ createElement("button", { type: "button", style: { display: downloadDisplay }, onClick: downloadClick, id: "download" }, "download")), /* @__PURE__ */ createElement("div", { id: "downloadPopup", style: {
      position: "absolute",
      display: "none",
      padding: "12px 16px",
      zIndex: 1,
      backgroundColor: "inherit"
    } }, /* @__PURE__ */ createElement("div", { style: { marginBottom: "8px" } }, "Download as:"), /* @__PURE__ */ createElement("ul", null, /* @__PURE__ */ createElement("li", null, "Source (just the ", displayMode, " content)", /* @__PURE__ */ createElement("br", null), /* @__PURE__ */ createElement("button", { type: "button", id: "download-md", style: { marginRight: "8px" }, onClick: downloadSource }, "Source")), /* @__PURE__ */ createElement("li", null, "HTML wrapper (content plus a shareable viewer)", /* @__PURE__ */ createElement("br", null), /* @__PURE__ */ createElement("button", { type: "button", id: "download-html", onClick: downloadHtml }, "HTML wrapper")))));
  };
  class Toolbar {
    constructor(toolbarElementOrSelector, options = {}) {
      __publicField(this, "toolbarElement");
      __publicField(this, "downloadButton");
      __publicField(this, "downloadPopup");
      __publicField(this, "mode");
      __publicField(this, "filename");
      __publicField(this, "props");
      this.options = options;
      this.filename = options.filename || "sample";
      const allowedModes = ["markdown", "json"];
      this.mode = allowedModes.includes(options.mode) ? options.mode : "markdown";
      this.toolbarElement = typeof toolbarElementOrSelector === "string" ? document.querySelector(toolbarElementOrSelector) : toolbarElementOrSelector;
      if (!this.toolbarElement) {
        throw new Error("Toolbar element not found");
      }
      this.props = {
        mode: null,
        restartClick: () => window.location.reload(),
        tweakClick: () => {
          this.options.textarea.style.display = this.options.textarea.style.display === "none" ? "" : "none";
        },
        downloadClick: () => {
          const { downloadPopup, downloadButton } = this;
          const rect = downloadButton.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const buttonCenter = rect.left + rect.width / 2;
          const isLeftOfCenter = buttonCenter < viewportWidth / 2;
          if (isLeftOfCenter) {
            downloadPopup.style.left = `${rect.left + window.scrollX}px`;
            downloadPopup.style.right = "";
          } else {
            downloadPopup.offsetWidth;
            downloadPopup.style.right = `${viewportWidth - rect.right - window.scrollX}px`;
            downloadPopup.style.left = "";
          }
          downloadPopup.style.top = `${rect.bottom + window.scrollY + 4}px`;
          downloadPopup.style.display = "block";
          const hidePopup = (evt) => {
            if (!downloadPopup.contains(evt.target) && evt.target !== downloadButton) {
              downloadPopup.style.display = "none";
              document.removeEventListener("mousedown", hidePopup);
            }
          };
          setTimeout(() => document.addEventListener("mousedown", hidePopup), 0);
        },
        restartDisplay: this.options.restartButton ? "" : "none",
        tweakDisplay: this.options.tweakButton ? "" : "none",
        downloadDisplay: this.options.downloadButton ? "" : "none",
        downloadSource: () => {
          this.downloadPopup.style.display = "none";
          const textarea = this.options.textarea;
          if (!textarea) return;
          const content = textarea.value;
          const extension = this.mode === "json" ? ".idoc.json" : ".idoc.md";
          const mimeType = this.mode === "json" ? "application/json" : "text/markdown";
          const filename = `${filenameWithoutPathOrExtension(this.filename)}${extension}`;
          this.triggerDownload(content, filename, mimeType);
        },
        downloadHtml: () => {
          this.downloadPopup.style.display = "none";
          const textarea = this.options.textarea;
          if (!textarea) return;
          const html = this.htmlWrapper();
          const filename = `${filenameWithoutPathOrExtension(this.filename)}.idoc.html`;
          this.triggerDownload(html, filename, "text/html");
        }
      };
      this.render();
    }
    htmlWrapper() {
      if (this.mode === "markdown") {
        return index$1.htmlMarkdownWrapper(this.filename, this.options.textarea.value);
      } else if (this.mode === "json") {
        return index$1.htmlJsonWrapper(this.filename, this.options.textarea.value);
      }
    }
    addChildren(children) {
      this.props.children = children;
      this.render();
    }
    render() {
      mount(ToolbarElement({ ...this.props, mode: this.mode }), this.toolbarElement);
      this.downloadButton = this.toolbarElement.querySelector("#download");
      this.downloadPopup = this.toolbarElement.querySelector("#downloadPopup");
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
      this.props.tweakDisplay = "";
      this.render();
    }
    showRestartButton() {
      this.props.restartDisplay = "";
      this.render();
    }
    showDownloadButton() {
      this.props.downloadDisplay = "";
      this.render();
    }
    hideTweakButton() {
      this.props.tweakDisplay = "none";
      this.render();
    }
    hideRestartButton() {
      this.props.restartDisplay = "none";
      this.render();
    }
    hideDownloadButton() {
      this.props.downloadDisplay = "none";
      this.render();
    }
    setSourceVisibility(visible) {
      const { textarea } = this.options;
      if (!textarea) {
        return;
      }
      textarea.style.display = visible ? "" : "none";
    }
    setFilename(filename) {
      this.filename = filename;
      this.render();
    }
    showDownloadDialog() {
      if (this.props.downloadClick) {
        this.props.downloadClick();
      }
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
  exports2.toolbar = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
