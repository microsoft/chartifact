(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Chartifact = global.Chartifact || {}));
})(this, (function(exports2) {
  "use strict";
  function initMarkdownViewer(textareaSelector = "#source", previewSelector = "#preview", toolbarSelector = ".chartifact-toolbar") {
    const textarea = document.querySelector(textareaSelector);
    if (!textarea) {
      throw new Error(`Textarea not found: ${textareaSelector}`);
    }
    const sandbox = new window.Chartifact.sandbox.Sandbox(previewSelector, textarea.value, {
      onApprove: (message) => {
        const { specs } = message;
        return specs;
      },
      onError: (error) => {
        console.error("Sandbox error:", error);
      }
    });
    textarea.addEventListener("input", () => {
      sandbox.send(textarea.value);
    });
    const toolbar = window.Chartifact.toolbar.create(toolbarSelector, { tweakButton: true, textarea });
    toolbar.manageTextareaVisibilityForAgents();
    return { sandbox, toolbar };
  }
  function initJsonViewer(textareaSelector = "#source", previewSelector = "#preview", toolbarSelector = ".chartifact-toolbar") {
    const textarea = document.querySelector(textareaSelector);
    if (!textarea) {
      throw new Error(`Textarea not found: ${textareaSelector}`);
    }
    let sandbox;
    const render = () => {
      const json = textarea.value;
      let markdown;
      try {
        const interactiveDocument = JSON.parse(json);
        if (typeof interactiveDocument !== "object") {
          markdown = "Invalid Interactive Document JSON";
        } else {
          markdown = window.Chartifact.compiler.targetMarkdown(interactiveDocument);
        }
      } catch (error) {
        markdown = "Failed to parse Interactive Document JSON";
      }
      if (!sandbox) {
        sandbox = new window.Chartifact.sandbox.Sandbox(previewSelector, markdown, {
          onApprove: (message) => {
            const { specs } = message;
            return specs;
          },
          onError: (error) => {
            console.error("Sandbox error:", error);
          }
        });
      } else {
        sandbox.send(markdown);
      }
    };
    textarea.addEventListener("input", render);
    render();
    const toolbar = window.Chartifact.toolbar.create(toolbarSelector, { tweakButton: true, textarea, mode: "json" });
    toolbar.manageTextareaVisibilityForAgents();
    return { sandbox, toolbar, render };
  }
  function autoInit() {
    window.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("[data-chartifact-markdown-viewer]").forEach((element) => {
        const textareaSelector = element.getAttribute("data-textarea") || "#source";
        const previewSelector = element.getAttribute("data-preview") || "#preview";
        const toolbarSelector = element.getAttribute("data-toolbar") || ".chartifact-toolbar";
        initMarkdownViewer(textareaSelector, previewSelector, toolbarSelector);
      });
      document.querySelectorAll("[data-chartifact-json-viewer]").forEach((element) => {
        const textareaSelector = element.getAttribute("data-textarea") || "#source";
        const previewSelector = element.getAttribute("data-preview") || "#preview";
        const toolbarSelector = element.getAttribute("data-toolbar") || ".chartifact-toolbar";
        initJsonViewer(textareaSelector, previewSelector, toolbarSelector);
      });
    });
  }
  const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    autoInit,
    initJsonViewer,
    initMarkdownViewer
  }, Symbol.toStringTag, { value: "Module" }));
  exports2.htmlWrapper = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
