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
  const index$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    VEGA_BUILTIN_FUNCTIONS,
    collectIdentifiers,
    defaultCommonOptions,
    encodeTemplateVariables,
    renderVegaExpression,
    tokenizeTemplate
  }, Symbol.toStringTag, { value: "Module" }));
  function validateVegaChart(_spec) {
    const errors = [];
    return errors;
  }
  function validateVegaLite(_spec) {
    const errors = [];
    const spec = _spec;
    if (!spec.data) {
      errors.push(`Vega-Lite chart is missing data`);
    }
    return errors;
  }
  function validateVegaLiteByComparison(specTemplate, spec) {
    const noLayerOrConcatMsg = "You may NOT use layer, hconcat, or vconcat in this chart, please use the template and only make minimal changes.";
    const errors = [];
    if (spec.hconcat && !specTemplate.hconcat) {
      errors.push(noLayerOrConcatMsg);
    } else if (!spec.hconcat && specTemplate.hconcat) {
      errors.push("You must use hconcat in this chart.");
    }
    if (spec.vconcat && !specTemplate.vconcat) {
      errors.push(noLayerOrConcatMsg);
    } else if (!spec.vconcat && specTemplate.vconcat) {
      errors.push("You must use vconcat in this chart.");
    }
    if (spec.layer && !specTemplate.layer) {
      errors.push(noLayerOrConcatMsg);
    } else if (!spec.layer && specTemplate.layer) {
      errors.push("You must use layer in this chart.");
    }
    return errors;
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
    if (stubDataLoaders) {
      stubDataLoaders.filter((dl) => dl.type !== "spec").forEach((dl) => {
        spec.signals.push(dataAsSignal(dl.dataSourceName));
        spec.data.push({
          name: dl.dataSourceName,
          values: []
        });
      });
    }
    topologicalSort(variables).forEach((v) => {
      if (v.loader) {
        spec.signals.push(dataAsSignal(v.variableId));
        spec.data.push({
          name: v.variableId,
          values: []
        });
        return;
      }
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
  function validateTransforms(dataFrameTransformations, variables, tabulatorElements, dataLoaders) {
    const errors = [];
    if (dataFrameTransformations) {
      if (!Array.isArray(dataFrameTransformations)) {
        errors.push("Data source dataFrameTransformations must be an array");
      } else {
        dataFrameTransformations.forEach((t, index2) => {
          const transformErrors = validateTransform(t, variables, tabulatorElements, dataLoaders);
          if (transformErrors.length > 0) {
            errors.push(`Transform ${index2} has the following errors: ${transformErrors.join(", ")}`);
          }
        });
      }
    }
    return errors;
  }
  function validateTransform(transform, variables, tabulatorElements, dataLoaders) {
    const errors = [];
    if (transform) {
      if (typeof transform !== "object") {
        errors.push("Transform must be an object");
      } else {
        if (!transform.type) {
          errors.push("Transform must have a type");
        } else {
          switch (transform.type) {
            case "aggregate": {
              break;
            }
            case "bin": {
              break;
            }
            case "collect": {
              break;
            }
            case "contour": {
              break;
            }
            case "countpattern": {
              break;
            }
            case "cross": {
              break;
            }
            case "crossfilter": {
              break;
            }
            case "density": {
              break;
            }
            case "dotbin": {
              break;
            }
            case "extent": {
              break;
            }
            case "filter": {
              const t = transform;
              if (!t.expr) {
                errors.push("Filter transform must have an expr property");
              }
              break;
            }
            case "flatten": {
              break;
            }
            case "fold": {
              break;
            }
            case "force": {
              break;
            }
            case "formula": {
              const t = transform;
              if (!t.as) {
                errors.push("Formula transform must have an as property");
              }
              if (!t.expr) {
                errors.push("Formula transform must have an expr property");
              }
              errors.push(...validateVegaExpression(t.expr, variables, tabulatorElements, dataLoaders));
              break;
            }
            case "geojson": {
              break;
            }
            case "geopath": {
              break;
            }
            case "geopoint": {
              break;
            }
            case "geoshape": {
              break;
            }
            case "graticule": {
              break;
            }
            case "heatmap": {
              break;
            }
            case "identifier": {
              break;
            }
            case "impute": {
              break;
            }
            case "isocontour": {
              break;
            }
            case "joinaggregate": {
              break;
            }
            case "kde": {
              break;
            }
            case "kde2d": {
              break;
            }
            case "label": {
              break;
            }
            case "linkpath": {
              break;
            }
            case "loess": {
              break;
            }
            case "lookup": {
              break;
            }
            case "nest": {
              break;
            }
            case "pack": {
              break;
            }
            case "partition": {
              break;
            }
            case "pie": {
              break;
            }
            case "pivot": {
              break;
            }
            case "project": {
              break;
            }
            case "quantile": {
              break;
            }
            case "regression": {
              break;
            }
            case "resolvefilter": {
              break;
            }
            case "sample": {
              break;
            }
            case "sequence": {
              break;
            }
            case "stack": {
              break;
            }
            case "stratify": {
              break;
            }
            case "timeunit": {
              break;
            }
            case "tree": {
              break;
            }
            case "treelinks": {
              break;
            }
            case "treemap": {
              break;
            }
            case "voronoi": {
              break;
            }
            case "window": {
              break;
            }
            case "wordcloud": {
              break;
            }
            default: {
              const t = transform;
              errors.push(`Unknown transform type: ${t.type}`);
            }
          }
        }
      }
    }
    return errors;
  }
  function validateDataSourceBase(ds) {
    const errors = [];
    if (!ds.dataSourceName) {
      errors.push("Data source must have a dataSourceName");
    }
    return errors;
  }
  function validateDataSource(dataSource, variables, tabulatorElements, otherDataSources) {
    const errors = validateDataSourceBase(dataSource);
    if (!dataSource.dataSourceName) {
      errors.push("Data source must have a dataSourceName");
      return errors;
    }
    const idErrors = validateVariableID(dataSource.dataSourceName);
    if (idErrors.length > 0) {
      errors.push(...idErrors);
    }
    if (dataSource.dataSourceName.endsWith("-selected")) {
      errors.push('Data source name may not end with "-selected"');
    }
    const existingVariable = (variables == null ? void 0 : variables.find((v) => v.variableId === dataSource.dataSourceName)) || (tabulatorElements == null ? void 0 : tabulatorElements.find((t) => t.variableId === dataSource.dataSourceName));
    if (existingVariable) {
      errors.push(`Data source with dataSourceName ${dataSource.dataSourceName} collides with variable name.`);
    }
    const existingDataSource = otherDataSources.find((ds) => dataSource.dataSourceName === ds.dataSourceName);
    if (existingDataSource) {
      errors.push(`Data source with dataSourceName ${dataSource.dataSourceName} already exists.`);
    }
    const dataLoaders = [];
    errors.push(...validateTransforms(dataSource.dataFrameTransformations, variables, tabulatorElements, dataLoaders));
    return errors;
  }
  function validateLoaderContent(loader, context) {
    const errors = [];
    if (!loader.type) {
      errors.push(`${context} must have a type property`);
      return errors;
    }
    switch (loader.type) {
      case "inline":
        if (!loader.content) {
          errors.push(`${context} of type "inline" must have content`);
        }
        if (loader.format) {
          switch (loader.format) {
            case "json":
            case "csv":
            case "tsv":
            case "dsv":
              break;
            default:
              errors.push(`${context} format "${loader.format}" is not supported`);
          }
        }
        break;
      case "file":
        if (!loader.filename) {
          errors.push(`${context} of type "file" must have filename`);
        }
        if (!loader.content) {
          errors.push(`${context} of type "file" must have content`);
        }
        break;
      case "url":
        if (!loader.url) {
          errors.push(`${context} of type "url" must have url`);
        }
        break;
      case "spec":
        if (!loader.spec) {
          errors.push(`${context} of type "spec" must have spec`);
        }
        if (typeof loader.spec !== "object") {
          errors.push(`${context} spec must be an object`);
        }
        break;
      default:
        errors.push(`${context} has unsupported type: ${loader.type}`);
    }
    return errors;
  }
  async function validateDataLoader(dataLoader, variables, tabulatorElements, otherDataLoaders) {
    const errors = [];
    if (typeof dataLoader !== "object") {
      errors.push("DataLoader must be an object");
      return errors;
    }
    errors.push(...validateLoaderContent(dataLoader, "DataLoader"));
    if (dataLoader.type !== "spec" && dataLoader.type) {
      errors.push(...validateDataSource(dataLoader, variables, tabulatorElements, otherDataLoaders.filter((dl) => dl.type !== "spec")));
    }
    return errors;
  }
  const illegalChars = "/|\\'\"`,.;:~-=+?!@#$%^&*()[]{}<>";
  const ignoredSignals = ["width", "height", "padding", "autosize", "background", "style", "parent", "datum", "item", "event", "cursor", "origins"];
  function validateRequiredString(value, propertyName, elementType) {
    const errors = [];
    if (!value) {
      errors.push(`${elementType} element must have a ${propertyName} property`);
    } else if (typeof value !== "string") {
      errors.push(`${elementType} element ${propertyName} must be a string`);
    } else if (value.trim() === "") {
      errors.push(`${elementType} element ${propertyName} cannot be empty`);
    }
    return errors;
  }
  function validateOptionalString(value, propertyName, elementType) {
    const errors = [];
    if (value !== void 0 && typeof value !== "string") {
      errors.push(`${elementType} element ${propertyName} must be a string`);
    }
    return errors;
  }
  function validateOptionalPositiveNumber(value, propertyName, elementType) {
    const errors = [];
    if (value !== void 0) {
      if (typeof value !== "number") {
        errors.push(`${elementType} element ${propertyName} must be a number`);
      } else if (value <= 0) {
        errors.push(`${elementType} element ${propertyName} must be a positive number`);
      }
    }
    return errors;
  }
  function validateOptionalBoolean(value, propertyName, elementType) {
    const errors = [];
    if (value !== void 0 && typeof value !== "boolean") {
      errors.push(`${elementType} element ${propertyName} must be a boolean`);
    }
    return errors;
  }
  function validateOptionalObject(value, propertyName, elementType) {
    const errors = [];
    if (value !== void 0) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(`${elementType} element ${propertyName} must be an object`);
      }
    }
    return errors;
  }
  function validateInputElementWithVariableId(element) {
    const errors = [];
    errors.push(...validateVariableID(element.variableId));
    if (element.variableId.includes(element.type)) {
      errors.push(`VariableID must not contain the element type: ${element.type}`);
    }
    return errors;
  }
  function validateVariableID(id) {
    if (!id) {
      return ["VariableID must not be null"];
    }
    const errors = [];
    if (ignoredSignals.includes(id)) {
      errors.push(`VariableID must not be one of the following reserved words: ${ignoredSignals.join(", ")}`);
    }
    for (let i = 0; i < illegalChars.length; i++) {
      if (id.includes(illegalChars[i])) {
        errors.push(`VariableID must not contain the following characters: ${illegalChars}`);
        break;
      }
    }
    return errors;
  }
  const variableTypes = ["number", "string", "boolean"];
  const HTML_TAG_REGEX = /<![^<>]*>|<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?>/g;
  function validateMarkdownString(value, propertyName, elementType) {
    const errors = [];
    if (value && typeof value === "string") {
      const htmlMatches = value.match(HTML_TAG_REGEX);
      if (htmlMatches && htmlMatches.length > 0) {
        errors.push(`${elementType} ${propertyName} must not contain HTML elements. Found: ${htmlMatches.slice(0, 3).join(", ")}${htmlMatches.length > 3 ? "..." : ""}`);
      }
    }
    return errors;
  }
  function validateVariable(variable, otherVariables, tabulatorElements, dataLoaders) {
    const errors = [];
    if (typeof variable !== "object" || variable === null) {
      errors.push("Variable must be an object.");
      return errors;
    }
    if (!variable.variableId) {
      errors.push("Variable must have a variableId property.");
    } else if (typeof variable.variableId !== "string") {
      errors.push("Variable variableId must be a string.");
    } else {
      const idErrors = validateVariableID(variable.variableId);
      if (idErrors.length > 0) {
        errors.push(...idErrors);
      }
    }
    if (variable.isArray) {
      if (!Array.isArray(variable.initialValue)) {
        errors.push("Variable isArray is true, but initialValue is not an array.");
      } else {
        for (let i = 0; i < variable.initialValue.length; i++) {
          if (typeof variable.initialValue[i] !== variable.type) {
            errors.push(`Variable initialValue[${i}] must be of type ${variable.type}.`);
          }
          if (Array.isArray(variable.initialValue[i])) {
            errors.push(`Variable initialValue[${i}] must not be an array.`);
          }
        }
      }
    } else {
      if (Array.isArray(variable.initialValue)) {
        errors.push("Variable isArray is false, but initialValue is an array.");
      } else {
        if (typeof variable.initialValue !== variable.type) {
          errors.push(`Variable initialValue must be of type ${variable.type}.`);
        }
      }
    }
    if (variable.calculation) {
      const calculationErrors = validateCalculation(variable.calculation, otherVariables, tabulatorElements, dataLoaders);
      if (calculationErrors.length > 0) {
        errors.push(...calculationErrors.map((error) => `Calculation error: ${error}`));
      }
    }
    if (variable.loader) {
      const loader = variable.loader;
      if (variable.type !== "object" || !variable.isArray) {
        errors.push('Variable with loader must have type "object" and isArray set to true.');
      }
      errors.push(...validateLoaderContent(loader, "Variable loader"));
      if (loader.dataFrameTransformations) {
        errors.push("Variable loader should not have dataFrameTransformations. Use Variable.calculation instead.");
      }
    }
    const existingVariable = otherVariables.find((v) => v.variableId === variable.variableId);
    if (existingVariable) {
      errors.push(`Variable with variableId ${variable.variableId} already exists.`);
    }
    const existingDataLoader = dataLoaders.filter((ds) => ds.type !== "spec").find((dl) => dl.dataSourceName === variable.variableId);
    if (existingDataLoader) {
      errors.push(`Variable with variableId ${variable.variableId} collides with data loader name ${existingDataLoader.dataSourceName}.`);
    }
    return errors;
  }
  function validateCalculation(calculation, variables, tabulatorElements, dataLoaders) {
    const errors = [];
    if (typeof calculation !== "object" || calculation === null) {
      errors.push("Calculation must be an object.");
      return errors;
    }
    if ("dataSourceNames" in calculation || "dataFrameTransformations" in calculation) {
      const dfCalc = calculation;
      if (dfCalc.dataSourceNames) {
        if (!Array.isArray(dfCalc.dataSourceNames)) {
          errors.push("DataFrameCalculation dataSourceNames must be an array.");
        } else {
          dfCalc.dataSourceNames.forEach((dsName, index2) => {
            if (typeof dsName !== "string") {
              errors.push(`DataFrameCalculation dataSourceNames[${index2}] must be a string.`);
            } else {
              const existsInVariables = variables.some((v) => v.variableId === dsName);
              const existsInDataLoaders = dataLoaders.filter((dl) => {
                return dl.type !== "spec";
              }).some((dl) => dl.dataSourceName === dsName);
              if (!existsInVariables && !existsInDataLoaders) {
                errors.push(`DataFrameCalculation references unknown data source: ${dsName}`);
              }
            }
          });
        }
      }
      if (dfCalc.dataFrameTransformations) {
        errors.push(...validateTransforms(dfCalc.dataFrameTransformations, variables, tabulatorElements, dataLoaders));
      }
    } else if ("vegaExpression" in calculation) {
      const scalarCalc = calculation;
      if (typeof scalarCalc.vegaExpression !== "string") {
        errors.push("ScalarCalculation vegaExpression must be a string.");
      } else if (scalarCalc.vegaExpression.indexOf("\n") !== -1) {
        errors.push("ScalarCalculation vegaExpression must not contain newlines.");
      }
      errors.push(...validateVegaExpression(scalarCalc.vegaExpression, variables, tabulatorElements, dataLoaders));
    } else {
      errors.push("Calculation must be either a DataFrameCalculation (with dataSourceNames/dataFrameTransformations) or ScalarCalculation (with vegaExpression).");
    }
    return errors;
  }
  function validateVegaExpression(vegaExpression, variables, tabulatorElements, dataLoaders) {
    const errors = [];
    const spec = createSpecWithVariables(variables, tabulatorElements, dataLoaders);
    spec.signals.push({
      name: "calculation",
      update: vegaExpression
    });
    try {
      vega.parse(spec);
    } catch (e) {
      errors.push(`Calculation vegaExpression is invalid: ${e.message}`);
    }
    return errors;
  }
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
  function flattenMarkdownElements(elements) {
    return elements.reduce((acc, e) => {
      if (typeof e === "string") {
        if (acc.length > 0 && typeof acc[acc.length - 1] === "string") {
          acc[acc.length - 1] += "\n" + e;
        } else {
          acc.push(e);
        }
      } else {
        acc.push(e);
      }
      return acc;
    }, []);
  }
  async function validateElement(element, groupIndex, elementIndex, variables, dataLoaders, charts) {
    const errors = [];
    if (element == null) {
      errors.push("Element must not be null or undefined.");
    } else {
      if (typeof element === "object") {
        switch (element.type) {
          case "chart": {
            const chartElement = element;
            if (!chartElement.chartKey) {
              errors.push("Chart element must have a chartKey");
            } else if (!charts) {
              errors.push("Document must have a resources.charts section to use chart elements");
            } else if (!charts[chartElement.chartKey]) {
              errors.push(`Chart key '${chartElement.chartKey}' not found in resources.charts`);
            } else {
              const chartSpec = charts[chartElement.chartKey];
              const chartType = getChartType(chartSpec);
              if (chartType === "vega-lite") {
                errors.push(...validateVegaLite(chartSpec));
              } else if (chartType === "vega") {
                errors.push(...validateVegaChart());
              } else {
                errors.push(`Chart '${chartElement.chartKey}' has unrecognized chart type`);
              }
            }
            break;
          }
          case "checkbox": {
            errors.push(...validateInputElementWithVariableId(element));
            break;
          }
          case "dropdown": {
            errors.push(...validateInputElementWithVariableId(element));
            if (element.options && element.dynamicOptions) {
              errors.push("Dropdown cannot have both static and dynamic options");
              break;
            }
            if (element.dynamicOptions) {
              if (!element.dynamicOptions.dataSourceName) {
                errors.push("Dynamic dropdown must have a data source name");
              }
              if (!element.dynamicOptions.fieldName) {
                errors.push("Dynamic dropdown must have a field name");
              }
            }
            if (element.options) {
              if (!Array.isArray(element.options)) {
                errors.push("Dropdown options must be an array of strings");
              }
              element.options.forEach((option, index2) => {
                if (typeof option !== "string") {
                  errors.push(`Dropdown option at index ${index2} must be a string`);
                }
              });
            }
            break;
          }
          case "image": {
            const imageElement = element;
            errors.push(...validateRequiredString(imageElement.url, "url", "Image"));
            errors.push(...validateOptionalString(imageElement.alt, "alt", "Image"));
            errors.push(...validateOptionalPositiveNumber(imageElement.height, "height", "Image"));
            errors.push(...validateOptionalPositiveNumber(imageElement.width, "width", "Image"));
            break;
          }
          case "mermaid": {
            const mermaidElement = element;
            if (!mermaidElement.diagramText && !mermaidElement.template && !mermaidElement.variableId) {
              errors.push("Mermaid element must have at least one of: diagramText, template, or variableId");
            }
            errors.push(...validateOptionalString(mermaidElement.diagramText, "diagramText", "Mermaid"));
            if (mermaidElement.diagramText && mermaidElement.diagramText.trim() === "") {
              errors.push("Mermaid element diagramText cannot be empty");
            }
            if (mermaidElement.diagramText) {
              errors.push(...validateMarkdownString(mermaidElement.diagramText, "diagramText", "Mermaid"));
            }
            if (mermaidElement.template) {
              errors.push(...validateOptionalObject(mermaidElement.template, "template", "Mermaid"));
              if (typeof mermaidElement.template === "object" && mermaidElement.template !== null) {
                errors.push(...validateRequiredString(mermaidElement.template.header, "template.header", "Mermaid"));
                if (!mermaidElement.template.lineTemplates) {
                  errors.push("Mermaid element template must have a lineTemplates property");
                } else if (typeof mermaidElement.template.lineTemplates !== "object" || mermaidElement.template.lineTemplates === null || Array.isArray(mermaidElement.template.lineTemplates)) {
                  errors.push("Mermaid element template.lineTemplates must be an object");
                }
                errors.push(...validateOptionalString(mermaidElement.template.dataSourceName, "template.dataSourceName", "Mermaid"));
              }
            }
            if (mermaidElement.variableId) {
              errors.push(...validateVariableID(mermaidElement.variableId));
            }
            break;
          }
          case "treebark": {
            const treebarkElement = element;
            if (!treebarkElement.template) {
              errors.push("Treebark element must have a template property");
            } else {
              errors.push(...validateOptionalObject(treebarkElement.template, "template", "Treebark"));
            }
            if (treebarkElement.data !== void 0) {
              errors.push(...validateOptionalObject(treebarkElement.data, "data", "Treebark"));
            }
            if (treebarkElement.variableId) {
              errors.push(...validateVariableID(treebarkElement.variableId));
            }
            break;
          }
          case "number": {
            errors.push(...validateInputElementWithVariableId(element));
            break;
          }
          case "presets": {
            break;
          }
          case "slider": {
            errors.push(...validateInputElementWithVariableId(element));
            break;
          }
          case "tabulator": {
            errors.push(...validateRequiredString(element.dataSourceName, "dataSourceName", "Tabulator"));
            errors.push(...validateOptionalBoolean(element.editable, "editable", "Tabulator"));
            errors.push(...validateOptionalObject(element.tabulatorOptions, "tabulatorOptions", "Tabulator"));
            if (element.variableId) {
              errors.push(...validateVariableID(element.variableId));
              const existingVariable = variables == null ? void 0 : variables.find((v) => v.variableId === element.variableId);
              if (existingVariable) {
                errors.push(`Tabulator variableId ${element.variableId} collides with existing variable name, the variable should be renamed or removed.`);
              }
            }
            break;
          }
          case "textbox": {
            errors.push(...validateInputElementWithVariableId(element));
            break;
          }
          default: {
            errors.push(`Unknown element type ${element.type} at group ${groupIndex}, element index ${elementIndex}: ${JSON.stringify(element)}`);
            break;
          }
        }
      } else if (typeof element !== "string") {
        errors.push("Element must be an array or a string.");
      } else {
        errors.push(...validateMarkdownString(element, "content", "Markdown"));
      }
    }
    return errors.filter(Boolean);
  }
  async function validateGroup(group, groupIndex, variables, dataLoaders, charts) {
    const errors = [];
    group.elements = flattenMarkdownElements(group.elements);
    for (const [index2, e] of group.elements.entries()) {
      const elementValidationErrors = await validateElement(e, groupIndex, index2, variables, dataLoaders, charts);
      if (elementValidationErrors.length > 0) {
        errors.push(...elementValidationErrors);
      }
    }
    return errors;
  }
  async function validateDocument(page) {
    var _a;
    const errors = [];
    if (!page.title) {
      errors.push("Page title is required.");
    }
    const dataLoaders = page.dataLoaders || [];
    const variables = page.variables || [];
    const tabulatorElements = page.groups.flatMap((group) => group.elements.filter((e) => typeof e !== "string" && e.type === "tabulator"));
    for (const dataLoader of dataLoaders) {
      const otherDataLoaders = dataLoaders.filter((dl) => dl !== dataLoader);
      errors.push(...await validateDataLoader(dataLoader, variables, tabulatorElements, otherDataLoaders));
    }
    for (const [groupIndex, group] of page.groups.entries()) {
      errors.push(...await validateGroup(group, groupIndex, variables, dataLoaders, (_a = page.resources) == null ? void 0 : _a.charts));
    }
    return errors;
  }
  const index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    flattenMarkdownElements,
    ignoredSignals,
    validateCalculation,
    validateDataLoader,
    validateDataSource,
    validateDataSourceBase,
    validateDocument,
    validateElement,
    validateGroup,
    validateInputElementWithVariableId,
    validateLoaderContent,
    validateMarkdownString,
    validateOptionalBoolean,
    validateOptionalObject,
    validateOptionalPositiveNumber,
    validateOptionalString,
    validateRequiredString,
    validateTransform,
    validateTransforms,
    validateVariable,
    validateVariableID,
    validateVegaChart,
    validateVegaExpression,
    validateVegaLite,
    validateVegaLiteByComparison,
    variableTypes
  }, Symbol.toStringTag, { value: "Module" }));
  function addStaticDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName, delimiter } = dataSource;
    let inlineDataMd;
    ensureDataAndSignalsArray(spec);
    if (dataSource.type === "inline" && dataSource.format === "json") {
      const newData = {
        name: dataSourceName,
        values: dataSource.content,
        transform: dataSource.dataFrameTransformations || []
      };
      spec.signals.push(dataAsSignal(dataSourceName));
      spec.data.unshift(newData);
    } else if (typeof dataSource.content === "string" || Array.isArray(dataSource.content) && typeof dataSource.content[0] === "string") {
      const content = dataSource.type === "file" ? dataSource.content : dsvContent(dataSource.content);
      let ds_raw = dataSourceName;
      if (dataSource.dataFrameTransformations) {
        ds_raw += "_raw";
        const newData = {
          name: dataSourceName,
          source: ds_raw,
          transform: dataSource.dataFrameTransformations || []
        };
        spec.signals.push(dataAsSignal(dataSourceName));
        spec.data.unshift(newData);
        spec.data.unshift({
          name: ds_raw
        });
      }
      switch (dataSource.format) {
        case "csv": {
          inlineDataMd = tickWrap(`csv ${ds_raw}`, content);
          break;
        }
        case "tsv": {
          inlineDataMd = tickWrap(`tsv ${ds_raw}`, content);
          break;
        }
        case "dsv": {
          inlineDataMd = tickWrap(`dsv delimiter:${delimiter} variableId:${ds_raw}`, content);
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
    return inlineDataMd;
  }
  function dsvContent(content) {
    if (Array.isArray(content)) {
      return content.join("\n");
    }
    return content;
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
    const variableLoaders = variables.filter((v) => v.loader).map((v) => {
      const loader = v.loader;
      return {
        ...loader,
        dataSourceName: v.variableId
      };
    });
    const allDataSources = [...dataSources, ...variableLoaders];
    const spec = createSpecWithVariables(variables, tabulatorElements);
    const vegaScope = new VegaScope(spec);
    let inlineDataMd = [];
    for (const dataSource of allDataSources) {
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
    vegaScope.spec.data.forEach((d) => {
      if (d.source) {
        const sources = Array.isArray(d.source) ? d.source : [d.source];
        sources.forEach((s) => {
          if (!vegaScope.spec.data.find((dd) => dd.name === s)) {
            vegaScope.spec.data.unshift({ name: s });
          }
        });
      }
    });
    return { vegaScope, inlineDataMd };
  }
  function groupMarkdown(group, variables, vegaScope, resources, pluginFormat) {
    var _a, _b, _c, _d, _e, _f;
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
          case "treebark": {
            const { template, data, variableId } = element;
            const treebarkSpec = {
              template
            };
            if (data) {
              treebarkSpec.data = data;
            }
            if (variableId) {
              treebarkSpec.variableId = variableId;
            }
            addSpec("treebark", treebarkSpec);
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
            const { dataSourceName, variableId, tabulatorOptions, editable, enableDownload } = element;
            const tabulatorSpec = { dataSourceName, tabulatorOptions, editable, enableDownload };
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
          case "number": {
            const { variableId, label, min, max, step, placeholder } = element;
            const numberSpec = {
              variableId,
              value: (_f = variables.find((v) => v.variableId === variableId)) == null ? void 0 : _f.initialValue,
              label,
              min,
              max,
              step,
              placeholder
            };
            addSpec("number", numberSpec, false);
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
    targetMarkdown,
    validation: index$1
  }, Symbol.toStringTag, { value: "Module" }));
  exports2.common = index$2;
  exports2.compiler = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
