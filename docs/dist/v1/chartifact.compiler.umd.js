(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vega"), require("js-yaml")) : typeof define === "function" && define.amd ? define(["exports", "vega", "js-yaml"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Chartifact = global.Chartifact || {}, global.vega, global.jsyaml));
})(this, (function(exports2, vega, yaml) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  function _interopNamespaceDefault(e) {
    const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
    if (e) {
      for (const k in e) {
        if (k !== "default") {
          const d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: () => e[k]
          });
        }
      }
    }
    n.default = e;
    return Object.freeze(n);
  }
  const yaml__namespace = /* @__PURE__ */ _interopNamespaceDefault(yaml);
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
  const index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    VEGA_BUILTIN_FUNCTIONS,
    collectIdentifiers,
    defaultCommonOptions,
    encodeTemplateVariables,
    renderVegaExpression,
    tokenizeTemplate
  }, Symbol.toStringTag, { value: "Module" }));
  function safeVariableName(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, "_");
  }
  function getChartType(spec) {
    const $schema = spec == null ? void 0 : spec.$schema;
    if (!$schema) {
      return "vega-lite";
    }
    return $schema.includes("vega-lite") ? "vega-lite" : "vega";
  }
  function topologicalSort(list) {
    const nameToObject = /* @__PURE__ */ new Map();
    const inDegree = /* @__PURE__ */ new Map();
    const graph = /* @__PURE__ */ new Map();
    for (const obj of list) {
      nameToObject.set(obj.variableId, obj);
      inDegree.set(obj.variableId, 0);
      graph.set(obj.variableId, []);
    }
    for (const obj of list) {
      let sources = [];
      const calculation = calculationType(obj);
      if (calculation == null ? void 0 : calculation.dfCalc) {
        sources = calculation.dfCalc.dataSourceNames || [];
      } else if (calculation == null ? void 0 : calculation.scalarCalc) {
        const ast = vega.parseExpression(calculation.scalarCalc.vegaExpression);
        sources = [...collectIdentifiers(ast)];
      }
      for (const dep of sources) {
        if (!graph.has(dep)) {
          continue;
        }
        graph.get(dep).push(obj.variableId);
        inDegree.set(obj.variableId, inDegree.get(obj.variableId) + 1);
      }
    }
    const queue = [];
    for (const [name, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(name);
    }
    const sorted = [];
    while (queue.length) {
      const current = queue.shift();
      sorted.push(nameToObject.get(current));
      for (const neighbor of graph.get(current)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
    if (sorted.length !== list.length) {
      throw new Error("Cycle or missing dependency detected");
    }
    return sorted;
  }
  function createSpecWithVariables(variables, tabulatorElements, stubDataLoaders) {
    const spec = {
      $schema: "https://vega.github.io/schema/vega/v5.json",
      description: "This is the central brain of the page",
      signals: [],
      data: []
    };
    tabulatorElements.forEach((tabulator) => {
      const { variableId } = tabulator;
      if (!variableId) {
        return;
      }
      spec.signals.push(dataAsSignal(variableId));
      spec.data.unshift({
        name: variableId,
        values: []
      });
    });
    topologicalSort(variables).forEach((v) => {
      const calculation = calculationType(v);
      if (calculation == null ? void 0 : calculation.dfCalc) {
        const { dataFrameTransformations } = calculation.dfCalc;
        const data = {
          name: v.variableId,
          source: calculation.dfCalc.dataSourceNames || [],
          transform: dataFrameTransformations
        };
        spec.data.push(data);
        spec.signals.push(dataAsSignal(v.variableId));
      } else {
        const signal = { name: v.variableId, value: v.initialValue };
        if (calculation == null ? void 0 : calculation.scalarCalc) {
          signal.update = calculation.scalarCalc.vegaExpression;
        }
        spec.signals.push(signal);
      }
    });
    return spec;
  }
  function calculationType(variable) {
    const dfCalc = variable.calculation;
    if (dfCalc && variable.type === "object" && !!variable.isArray && (dfCalc.dataSourceNames !== void 0 && dfCalc.dataSourceNames.length > 0 || dfCalc.dataFrameTransformations !== void 0 && dfCalc.dataFrameTransformations.length > 0)) {
      return { dfCalc };
    }
    const scalarCalc = variable.calculation;
    if (scalarCalc && !(variable.type === "object" && variable.isArray) && (scalarCalc.vegaExpression !== void 0 && scalarCalc.vegaExpression.length > 0)) {
      return { scalarCalc };
    }
  }
  function ensureDataAndSignalsArray(spec) {
    if (!spec.data) {
      spec.data = [];
    }
    if (!spec.signals) {
      spec.signals = [];
    }
  }
  function dataAsSignal(name) {
    return {
      name,
      update: `data('${name}')`
    };
  }
  function addStaticDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName, delimiter } = dataSource;
    let inlineDataMd;
    ensureDataAndSignalsArray(spec);
    spec.signals.push(dataAsSignal(dataSourceName));
    const newData = {
      name: dataSourceName,
      values: [],
      transform: dataSource.dataFrameTransformations || []
    };
    if (dataSource.type === "inline") {
      if (dataSource.format === "json") {
        newData.values = dataSource.content;
      } else if (typeof dataSource.content === "string") {
        switch (dataSource.format) {
          case "csv": {
            inlineDataMd = tickWrap(`csv ${dataSourceName}`, dataSource.content);
            break;
          }
          case "tsv": {
            inlineDataMd = tickWrap(`tsv ${dataSourceName}`, dataSource.content);
            break;
          }
          case "dsv": {
            inlineDataMd = tickWrap(`dsv delimiter:${delimiter} variableId:${dataSourceName}`, dataSource.content);
            break;
          }
          default: {
            console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
            break;
          }
        }
      } else {
        console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
      }
    } else if (dataSource.type === "file") {
      if (dataSource.format === "dsv") {
        newData.format = {
          type: dataSource.format,
          delimiter: dataSource.delimiter
        };
      } else {
        newData.format = {
          type: dataSource.format
        };
      }
      newData.values = [dataSource.content];
    }
    spec.data.unshift(newData);
    return inlineDataMd;
  }
  function addDynamicDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName, delimiter } = dataSource;
    const tokens = tokenizeTemplate(dataSource.url);
    const variableCount = tokens.filter((token) => token.type === "variable").length;
    let url;
    if (variableCount) {
      const urlSignal = vegaScope.createUrlSignal(dataSource.url, tokens);
      url = { signal: urlSignal.name };
    } else {
      url = dataSource.url;
    }
    ensureDataAndSignalsArray(spec);
    spec.signals.push(dataAsSignal(dataSourceName));
    const data = {
      name: dataSourceName,
      url,
      transform: dataSource.dataFrameTransformations || []
    };
    if (dataSource.format === "dsv") {
      data.format = { type: dataSource.format, delimiter };
    } else {
      data.format = { type: dataSource.format || "json" };
    }
    spec.data.unshift(data);
  }
  class VegaScope {
    constructor(spec) {
      __publicField(this, "urlCount", 0);
      this.spec = spec;
    }
    createUrlSignal(url, tokens) {
      const name = `url:${this.urlCount++}:${safeVariableName(url)}`;
      const signal = { name };
      signal.update = renderVegaExpression(tokens);
      if (!this.spec.signals) {
        this.spec.signals = [];
      }
      this.spec.signals.push(signal);
      return signal;
    }
  }
  const defaultJsonIndent = 2;
  function tickWrap(plugin, content) {
    return `


\`\`\`${plugin}
${content}
\`\`\`


`;
  }
  function jsonWrap(type, content) {
    return tickWrap("json " + type, content);
  }
  function yamlWrap(type, content) {
    return tickWrap("yaml " + type, trimTrailingNewline(content));
  }
  function chartWrap(spec) {
    const chartType = getChartType(spec);
    return jsonWrap(chartType, JSON.stringify(spec, null, defaultJsonIndent));
  }
  function chartWrapYaml(spec) {
    const chartType = getChartType(spec);
    return yamlWrap(chartType, yaml__namespace.dump(spec, { indent: defaultJsonIndent }));
  }
  function mdContainerWrap(classname, id, content) {
    return `::: ${classname} {#${id}}

${content}
:::`;
  }
  const defaultPluginFormat = {
    "*": "yaml",
    "tabulator": "json",
    "vega": "json",
    "vega-lite": "json"
  };
  const defaultOptions = {
    extraNewlines: 2,
    pluginFormat: defaultPluginFormat
  };
  function getPluginFormat(pluginName, pluginFormat) {
    if (pluginFormat[pluginName]) {
      return pluginFormat[pluginName];
    }
    if (pluginFormat["*"]) {
      return pluginFormat["*"];
    }
    return "json";
  }
  function targetMarkdown(page, options) {
    const finalOptions = { ...defaultOptions, ...options };
    const finalPluginFormat = { ...defaultPluginFormat, ...options == null ? void 0 : options.pluginFormat };
    const mdSections = [];
    const dataLoaders = page.dataLoaders || [];
    const variables = page.variables || [];
    if (page.style) {
      const { style } = page;
      if (style.css) {
        let css;
        if (typeof style.css === "string") {
          css = style.css;
        } else if (Array.isArray(style.css)) {
          css = style.css.join("\n");
        }
        mdSections.push(tickWrap("css", css));
      }
      if (style.googleFonts) {
        mdSections.push(jsonWrap("google-fonts", JSON.stringify(style.googleFonts, null, defaultJsonIndent)));
      }
    }
    const tabulatorElements = page.groups.flatMap((group) => group.elements.filter((e) => typeof e !== "string" && e.type === "tabulator"));
    const { vegaScope, inlineDataMd } = dataLoaderMarkdown(dataLoaders.filter((dl) => dl.type !== "spec"), variables, tabulatorElements);
    for (const dataLoader of dataLoaders.filter((dl) => dl.type === "spec")) {
      const useYaml = getPluginFormat("vega", finalPluginFormat) === "yaml";
      mdSections.push(useYaml ? chartWrapYaml(dataLoader.spec) : chartWrap(dataLoader.spec));
    }
    for (const group of page.groups) {
      mdSections.push(mdContainerWrap(
        defaultCommonOptions.groupClassName,
        group.groupId,
        groupMarkdown(group, variables, vegaScope, page.resources, finalPluginFormat)
      ));
    }
    const { data, signals } = vegaScope.spec;
    if ((data == null ? void 0 : data.length) === 0) {
      delete vegaScope.spec.data;
    } else {
      data.forEach((d) => {
        var _a;
        if (((_a = d.transform) == null ? void 0 : _a.length) === 0) {
          delete d.transform;
        }
      });
    }
    if ((signals == null ? void 0 : signals.length) === 0) {
      delete vegaScope.spec.signals;
    }
    if (vegaScope.spec.data || vegaScope.spec.signals) {
      const useYaml = getPluginFormat("vega", finalPluginFormat) === "yaml";
      mdSections.unshift(useYaml ? chartWrapYaml(vegaScope.spec) : chartWrap(vegaScope.spec));
    }
    if (page.notes) {
      if (Array.isArray(page.notes)) {
        mdSections.unshift(tickWrap("#", page.notes.map((n) => {
          if (typeof n === "object") {
            return JSON.stringify(n, null, defaultJsonIndent);
          } else if (typeof n === "string") {
            return n;
          } else {
            return JSON.stringify(n);
          }
        }).join("\n")));
      } else {
        mdSections.unshift(tickWrap("#", JSON.stringify(page.notes, null, defaultJsonIndent)));
      }
    }
    const markdown = mdSections.concat(inlineDataMd).join("\n");
    return normalizeNewlines(markdown, finalOptions.extraNewlines).trim();
  }
  function dataLoaderMarkdown(dataSources, variables, tabulatorElements) {
    const spec = createSpecWithVariables(variables, tabulatorElements);
    const vegaScope = new VegaScope(spec);
    let inlineDataMd = [];
    for (const dataSource of dataSources) {
      switch (dataSource.type) {
        case "inline": {
          inlineDataMd.push(addStaticDataLoaderToSpec(vegaScope, dataSource));
          break;
        }
        case "file": {
          inlineDataMd.push(addStaticDataLoaderToSpec(vegaScope, dataSource));
          break;
        }
        case "url": {
          addDynamicDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
      }
    }
    return { vegaScope, inlineDataMd };
  }
  function groupMarkdown(group, variables, vegaScope, resources, pluginFormat) {
    var _a, _b, _c, _d, _e;
    const mdElements = [];
    const addSpec = (pluginName, spec, indent = true) => {
      const format = getPluginFormat(pluginName, pluginFormat);
      if (format === "yaml") {
        const content = indent ? yaml__namespace.dump(spec, { indent: defaultJsonIndent }) : yaml__namespace.dump(spec);
        mdElements.push(yamlWrap(pluginName, content));
      } else {
        const content = indent ? JSON.stringify(spec, null, defaultJsonIndent) : JSON.stringify(spec);
        mdElements.push(jsonWrap(pluginName, content));
      }
    };
    for (const element of group.elements) {
      if (typeof element === "string") {
        mdElements.push(element);
      } else if (typeof element === "object") {
        switch (element.type) {
          case "chart": {
            const { chartKey } = element;
            const spec = (_a = resources == null ? void 0 : resources.charts) == null ? void 0 : _a[chartKey];
            if (!spec) {
              mdElements.push("![Chart Spinner](/img/chart-spinner.gif)");
            } else {
              const chartType = getChartType(spec);
              const useYaml = getPluginFormat(chartType, pluginFormat) === "yaml";
              mdElements.push(useYaml ? chartWrapYaml(spec) : chartWrap(spec));
            }
            break;
          }
          case "checkbox": {
            const { label, variableId } = element;
            const cbSpec = {
              variableId,
              value: (_b = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _b.initialValue,
              label
            };
            addSpec("checkbox", cbSpec, false);
            break;
          }
          case "dropdown": {
            const { label, variableId, options, dynamicOptions, multiple, size } = element;
            const ddSpec = {
              variableId,
              value: (_c = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _c.initialValue,
              label
            };
            if (dynamicOptions) {
              const { dataSourceName, fieldName } = dynamicOptions;
              ddSpec.dynamicOptions = {
                dataSourceName,
                fieldName
              };
            } else {
              ddSpec.options = options;
            }
            if (multiple) {
              ddSpec.multiple = multiple;
              ddSpec.size = size || 1;
            }
            addSpec("dropdown", ddSpec);
            break;
          }
          case "image": {
            const { url, alt, width, height } = element;
            const imageSpec = {
              url,
              alt,
              width,
              height
            };
            addSpec("image", imageSpec);
            break;
          }
          case "mermaid": {
            const { diagramText, template, variableId } = element;
            if (diagramText) {
              mdElements.push(tickWrap("mermaid", diagramText));
            } else if (template) {
              const mermaidSpec = {
                template
              };
              if (variableId) {
                mermaidSpec.variableId = variableId;
              }
              addSpec("mermaid", mermaidSpec);
            } else if (variableId) {
              const mermaidSpec = {
                variableId
              };
              addSpec("mermaid", mermaidSpec, false);
            }
            break;
          }
          case "presets": {
            const { presets } = element;
            const presetsSpec = presets;
            addSpec("presets", presetsSpec);
            break;
          }
          case "slider": {
            const { label, min, max, step, variableId } = element;
            const sliderSpec = {
              variableId,
              value: (_d = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _d.initialValue,
              label,
              min,
              max,
              step
            };
            addSpec("slider", sliderSpec, false);
            break;
          }
          case "tabulator": {
            const { dataSourceName, variableId, tabulatorOptions, editable } = element;
            const tabulatorSpec = { dataSourceName, tabulatorOptions, editable };
            if (variableId) {
              tabulatorSpec.variableId = variableId;
            }
            addSpec("tabulator", tabulatorSpec);
            break;
          }
          case "textbox": {
            const { variableId, label, multiline, placeholder } = element;
            const textboxSpec = {
              variableId,
              value: (_e = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _e.initialValue,
              label,
              multiline,
              placeholder
            };
            addSpec("textbox", textboxSpec, false);
            break;
          }
          default: {
            mdElements.push(tickWrap("#", JSON.stringify(element)));
          }
        }
      } else {
        mdElements.push(tickWrap("#", JSON.stringify(element)));
      }
    }
    const markdown = mdElements.join("\n");
    return trimTrailingNewline(markdown);
  }
  function trimTrailingNewline(s) {
    if (s.endsWith("\n")) {
      return s.slice(0, -1);
    }
    return s;
  }
  function normalizeNewlines(text, extra) {
    return text.replace(/(\n\s*){4,}/g, "\n".repeat(1 + extra)) + "\n";
  }
  const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    normalizeNewlines,
    targetMarkdown
  }, Symbol.toStringTag, { value: "Module" }));
  exports2.common = index$1;
  exports2.compiler = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
