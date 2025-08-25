(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("vega")) : typeof define === "function" && define.amd ? define(["exports", "vega"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Chartifact = global.Chartifact || {}, global.vega));
})(this, (function(exports2, vega) {
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
    const escape = (str2) => `'${str2.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
    return tokens.map((token) => token.type === "literal" ? escape(token.value) : `${funcName}(${token.name})`).join(" + ");
  }
  function encodeTemplateVariables(input) {
    const tokens = tokenizeTemplate(input);
    return renderVegaExpression(tokens);
  }
  const index$5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
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
      if (degree === 0)
        queue.push(name);
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
    const { dataSourceName } = dataSource;
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
        const data = vega.read(dataSource.content, {
          type: dataSource.format
        });
        if (Array.isArray(data)) {
          newData.values = data;
        } else {
          console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
        }
      } else {
        console.warn(`Unsupported inline data format: ${dataSource.format}, type is ${typeof dataSource.content}`);
      }
    } else if (dataSource.type === "file") {
      newData.format = {
        type: dataSource.format
      };
      newData.values = [dataSource.content];
    }
    spec.data.unshift(newData);
  }
  function addDynamicDataLoaderToSpec(vegaScope, dataSource) {
    const { spec } = vegaScope;
    const { dataSourceName } = dataSource;
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
    spec.data.unshift({
      name: dataSourceName,
      url,
      format: { type: dataSource.format || "json" },
      transform: dataSource.dataFrameTransformations || []
    });
  }
  class VegaScope {
    constructor(spec) {
      __publicField(this, "spec");
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
  /*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT */
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence)) return sequence;
    else if (isNothing(sequence)) return [];
    return [sequence];
  }
  function extend(target, source) {
    var index2, length, key, sourceKeys;
    if (source) {
      sourceKeys = Object.keys(source);
      for (index2 = 0, length = sourceKeys.length; index2 < length; index2 += 1) {
        key = sourceKeys[index2];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    var result = "", cycle;
    for (cycle = 0; cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  var isNothing_1 = isNothing;
  var isObject_1 = isObject;
  var toArray_1 = toArray;
  var repeat_1 = repeat;
  var isNegativeZero_1 = isNegativeZero;
  var extend_1 = extend;
  var common = {
    isNothing: isNothing_1,
    isObject: isObject_1,
    toArray: toArray_1,
    repeat: repeat_1,
    isNegativeZero: isNegativeZero_1,
    extend: extend_1
  };
  function formatError(exception2, compact) {
    var where = "", message = exception2.reason || "(unknown reason)";
    if (!exception2.mark) return message;
    if (exception2.mark.name) {
      where += 'in "' + exception2.mark.name + '" ';
    }
    where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
    if (!compact && exception2.mark.snippet) {
      where += "\n\n" + exception2.mark.snippet;
    }
    return message + " " + where;
  }
  function YAMLException$1(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException$1.prototype = Object.create(Error.prototype);
  YAMLException$1.prototype.constructor = YAMLException$1;
  YAMLException$1.prototype.toString = function toString(compact) {
    return this.name + ": " + formatError(this, compact);
  };
  var exception = YAMLException$1;
  var TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ];
  var YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map2) {
    var result = {};
    if (map2 !== null) {
      Object.keys(map2).forEach(function(style) {
        map2[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type$1(tag, options) {
    options = options || {};
    Object.keys(options).forEach(function(name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.options = options;
    this.tag = tag;
    this.kind = options["kind"] || null;
    this.resolve = options["resolve"] || function() {
      return true;
    };
    this.construct = options["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options["instanceOf"] || null;
    this.predicate = options["predicate"] || null;
    this.represent = options["represent"] || null;
    this.representName = options["representName"] || null;
    this.defaultStyle = options["defaultStyle"] || null;
    this.multi = options["multi"] || false;
    this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  var type = Type$1;
  function compileList(schema2, name) {
    var result = [];
    schema2[name].forEach(function(currentType) {
      var newIndex = result.length;
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
      result[newIndex] = currentType;
    });
    return result;
  }
  function compileMap() {
    var result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    }, index2, length;
    function collectType(type2) {
      if (type2.multi) {
        result.multi[type2.kind].push(type2);
        result.multi["fallback"].push(type2);
      } else {
        result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
      }
    }
    for (index2 = 0, length = arguments.length; index2 < length; index2 += 1) {
      arguments[index2].forEach(collectType);
    }
    return result;
  }
  function Schema$1(definition) {
    return this.extend(definition);
  }
  Schema$1.prototype.extend = function extend2(definition) {
    var implicit = [];
    var explicit = [];
    if (definition instanceof type) {
      explicit.push(definition);
    } else if (Array.isArray(definition)) {
      explicit = explicit.concat(definition);
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      if (definition.implicit) implicit = implicit.concat(definition.implicit);
      if (definition.explicit) explicit = explicit.concat(definition.explicit);
    } else {
      throw new exception("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    }
    implicit.forEach(function(type$1) {
      if (!(type$1 instanceof type)) {
        throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      if (type$1.loadKind && type$1.loadKind !== "scalar") {
        throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
      if (type$1.multi) {
        throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
      }
    });
    explicit.forEach(function(type$1) {
      if (!(type$1 instanceof type)) {
        throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
    });
    var result = Object.create(Schema$1.prototype);
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
    result.compiledImplicit = compileList(result, "implicit");
    result.compiledExplicit = compileList(result, "explicit");
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
    return result;
  };
  var schema = Schema$1;
  var str = new type("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
  var seq = new type("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
  var map = new type("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
  var failsafe = new schema({
    explicit: [
      str,
      seq,
      map
    ]
  });
  function resolveYamlNull(data) {
    if (data === null) return true;
    var max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  var _null = new type("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
  function resolveYamlBoolean(data) {
    if (data === null) return false;
    var max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  var bool = new type("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
  function isHexCode(c) {
    return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
  }
  function isOctCode(c) {
    return 48 <= c && c <= 55;
  }
  function isDecCode(c) {
    return 48 <= c && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null) return false;
    var max = data.length, index2 = 0, hasDigits = false, ch;
    if (!max) return false;
    ch = data[index2];
    if (ch === "-" || ch === "+") {
      ch = data[++index2];
    }
    if (ch === "0") {
      if (index2 + 1 === max) return true;
      ch = data[++index2];
      if (ch === "b") {
        index2++;
        for (; index2 < max; index2++) {
          ch = data[index2];
          if (ch === "_") continue;
          if (ch !== "0" && ch !== "1") return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
      if (ch === "x") {
        index2++;
        for (; index2 < max; index2++) {
          ch = data[index2];
          if (ch === "_") continue;
          if (!isHexCode(data.charCodeAt(index2))) return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
      if (ch === "o") {
        index2++;
        for (; index2 < max; index2++) {
          ch = data[index2];
          if (ch === "_") continue;
          if (!isOctCode(data.charCodeAt(index2))) return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
    }
    if (ch === "_") return false;
    for (; index2 < max; index2++) {
      ch = data[index2];
      if (ch === "_") continue;
      if (!isDecCode(data.charCodeAt(index2))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits || ch === "_") return false;
    return true;
  }
  function constructYamlInteger(data) {
    var value = data, sign = 1, ch;
    if (value.indexOf("_") !== -1) {
      value = value.replace(/_/g, "");
    }
    ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-") sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0") return 0;
    if (ch === "0") {
      if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
      if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
    }
    return sign * parseInt(value, 10);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
  }
  var int = new type("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      /* eslint-disable max-len */
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
  var YAML_FLOAT_PATTERN = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function resolveYamlFloat(data) {
    if (data === null) return false;
    if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
    // Probably should update regexp & check speed
    data[data.length - 1] === "_") {
      return false;
    }
    return true;
  }
  function constructYamlFloat(data) {
    var value, sign;
    value = data.replace(/_/g, "").toLowerCase();
    sign = value[0] === "-" ? -1 : 1;
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    }
    return sign * parseFloat(value, 10);
  }
  var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    var res;
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common.isNegativeZero(object)) {
      return "-0.0";
    }
    res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
  }
  var float = new type("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
  var json = failsafe.extend({
    implicit: [
      _null,
      bool,
      int,
      float
    ]
  });
  var core = json;
  var YAML_DATE_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  );
  var YAML_TIMESTAMP_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function resolveYamlTimestamp(data) {
    if (data === null) return false;
    if (YAML_DATE_REGEXP.exec(data) !== null) return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
    match = YAML_DATE_REGEXP.exec(data);
    if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null) throw new Error("Date resolve error");
    year = +match[1];
    month = +match[2] - 1;
    day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    hour = +match[4];
    minute = +match[5];
    second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      tz_hour = +match[10];
      tz_minute = +(match[11] || 0);
      delta = (tz_hour * 60 + tz_minute) * 6e4;
      if (match[9] === "-") delta = -delta;
    }
    date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta) date.setTime(date.getTime() - delta);
    return date;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  var timestamp = new type("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  var merge = new type("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
  var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
  function resolveYamlBinary(data) {
    if (data === null) return false;
    var code, idx, bitlen = 0, max = data.length, map2 = BASE64_MAP;
    for (idx = 0; idx < max; idx++) {
      code = map2.indexOf(data.charAt(idx));
      if (code > 64) continue;
      if (code < 0) return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map2 = BASE64_MAP, bits = 0, result = [];
    for (idx = 0; idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    return new Uint8Array(result);
  }
  function representYamlBinary(object) {
    var result = "", bits = 0, idx, tail, max = object.length, map2 = BASE64_MAP;
    for (idx = 0; idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map2[bits >> 18 & 63];
        result += map2[bits >> 12 & 63];
        result += map2[bits >> 6 & 63];
        result += map2[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    tail = max % 3;
    if (tail === 0) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    } else if (tail === 2) {
      result += map2[bits >> 10 & 63];
      result += map2[bits >> 4 & 63];
      result += map2[bits << 2 & 63];
      result += map2[64];
    } else if (tail === 1) {
      result += map2[bits >> 2 & 63];
      result += map2[bits << 4 & 63];
      result += map2[64];
      result += map2[64];
    }
    return result;
  }
  function isBinary(obj) {
    return Object.prototype.toString.call(obj) === "[object Uint8Array]";
  }
  var binary = new type("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
  var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
  var _toString$2 = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null) return true;
    var objectKeys = [], index2, length, pair, pairKey, pairHasKey, object = data;
    for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
      pair = object[index2];
      pairHasKey = false;
      if (_toString$2.call(pair) !== "[object Object]") return false;
      for (pairKey in pair) {
        if (_hasOwnProperty$3.call(pair, pairKey)) {
          if (!pairHasKey) pairHasKey = true;
          else return false;
        }
      }
      if (!pairHasKey) return false;
      if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
      else return false;
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  var omap = new type("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
  var _toString$1 = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null) return true;
    var index2, length, pair, keys, result, object = data;
    result = new Array(object.length);
    for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
      pair = object[index2];
      if (_toString$1.call(pair) !== "[object Object]") return false;
      keys = Object.keys(pair);
      if (keys.length !== 1) return false;
      result[index2] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null) return [];
    var index2, length, pair, keys, result, object = data;
    result = new Array(object.length);
    for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
      pair = object[index2];
      keys = Object.keys(pair);
      result[index2] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  var pairs = new type("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
  var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null) return true;
    var key, object = data;
    for (key in object) {
      if (_hasOwnProperty$2.call(object, key)) {
        if (object[key] !== null) return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  var set = new type("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
  var _default = core.extend({
    implicit: [
      timestamp,
      merge
    ],
    explicit: [
      binary,
      omap,
      pairs,
      set
    ]
  });
  function simpleEscapeSequence(c) {
    return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "" : c === 95 ? " " : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
  }
  var simpleEscapeCheck = new Array(256);
  var simpleEscapeMap = new Array(256);
  for (var i = 0; i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  var _toString = Object.prototype.toString;
  var _hasOwnProperty = Object.prototype.hasOwnProperty;
  var CHAR_BOM = 65279;
  var CHAR_TAB = 9;
  var CHAR_LINE_FEED = 10;
  var CHAR_CARRIAGE_RETURN = 13;
  var CHAR_SPACE = 32;
  var CHAR_EXCLAMATION = 33;
  var CHAR_DOUBLE_QUOTE = 34;
  var CHAR_SHARP = 35;
  var CHAR_PERCENT = 37;
  var CHAR_AMPERSAND = 38;
  var CHAR_SINGLE_QUOTE = 39;
  var CHAR_ASTERISK = 42;
  var CHAR_COMMA = 44;
  var CHAR_MINUS = 45;
  var CHAR_COLON = 58;
  var CHAR_EQUALS = 61;
  var CHAR_GREATER_THAN = 62;
  var CHAR_QUESTION = 63;
  var CHAR_COMMERCIAL_AT = 64;
  var CHAR_LEFT_SQUARE_BRACKET = 91;
  var CHAR_RIGHT_SQUARE_BRACKET = 93;
  var CHAR_GRAVE_ACCENT = 96;
  var CHAR_LEFT_CURLY_BRACKET = 123;
  var CHAR_VERTICAL_LINE = 124;
  var CHAR_RIGHT_CURLY_BRACKET = 125;
  var ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = '\\"';
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  var DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function compileStyleMap(schema2, map2) {
    var result, keys, index2, length, tag, style, type2;
    if (map2 === null) return {};
    result = {};
    keys = Object.keys(map2);
    for (index2 = 0, length = keys.length; index2 < length; index2 += 1) {
      tag = keys[index2];
      style = String(map2[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      type2 = schema2.compiledTypeMap["fallback"][tag];
      if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
        style = type2.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    var string, handle, length;
    string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle = "x";
      length = 2;
    } else if (character <= 65535) {
      handle = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle = "U";
      length = 8;
    } else {
      throw new exception("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle + common.repeat("0", length - string.length) + string;
  }
  var QUOTING_TYPE_SINGLE = 1, QUOTING_TYPE_DOUBLE = 2;
  function State(options) {
    this.schema = options["schema"] || _default;
    this.indent = Math.max(1, options["indent"] || 2);
    this.noArrayIndent = options["noArrayIndent"] || false;
    this.skipInvalid = options["skipInvalid"] || false;
    this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
    this.sortKeys = options["sortKeys"] || false;
    this.lineWidth = options["lineWidth"] || 80;
    this.noRefs = options["noRefs"] || false;
    this.noCompatMode = options["noCompatMode"] || false;
    this.condenseFlow = options["condenseFlow"] || false;
    this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
    this.forceQuotes = options["forceQuotes"] || false;
    this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
    while (position < length) {
      next = string.indexOf("\n", position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== "\n") result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return "\n" + common.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    var index2, length, type2;
    for (index2 = 0, length = state.implicitTypes.length; index2 < length; index2 += 1) {
      type2 = state.implicitTypes[index2];
      if (type2.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
  }
  function isNsCharOrWhitespace(c) {
    return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev, inblock) {
    var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
    var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
    return (
      // ns-plain-safe
      (inblock ? (
        // c = flow-in
        cIsNsCharOrWhitespace
      ) : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar
    );
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function isPlainSafeLast(c) {
    return !isWhitespace(c) && c !== CHAR_COLON;
  }
  function codePointAt(string, pos) {
    var first = string.charCodeAt(pos), second;
    if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
      second = string.charCodeAt(pos + 1);
      if (second >= 56320 && second <= 57343) {
        return (first - 55296) * 1024 + second - 56320 + 65536;
      }
    }
    return first;
  }
  function needIndentIndicator(string) {
    var leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  var STYLE_PLAIN = 1, STYLE_SINGLE = 2, STYLE_LITERAL = 3, STYLE_FOLDED = 4, STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
    var i2;
    var char = 0;
    var prevChar = null;
    var hasLineBreak = false;
    var hasFoldableLine = false;
    var shouldTrackWidth = lineWidth !== -1;
    var previousLineBreak = -1;
    var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
    if (singleLineOnly || forceQuotes) {
      for (i2 = 0; i2 < string.length; char >= 65536 ? i2 += 2 : i2++) {
        char = codePointAt(string, i2);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
    } else {
      for (i2 = 0; i2 < string.length; char >= 65536 ? i2 += 2 : i2++) {
        char = codePointAt(string, i2);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
            i2 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i2;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i2 - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      if (plain && !forceQuotes && !testAmbiguousType(string)) {
        return STYLE_PLAIN;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    if (!forceQuotes) {
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  function writeScalar(state, string, level, iskey, inblock) {
    state.dump = (function() {
      if (string.length === 0) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
      }
      if (!state.noCompatMode) {
        if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
        }
      }
      var indent = state.indent * Math.max(1, level);
      var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(
        string,
        singleLineOnly,
        state.indent,
        lineWidth,
        testAmbiguity,
        state.quotingType,
        state.forceQuotes && !iskey,
        inblock
      )) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string) + '"';
        default:
          throw new exception("impossible error: invalid scalar style");
      }
    })();
  }
  function blockHeader(string, indentPerLevel) {
    var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    var clip = string[string.length - 1] === "\n";
    var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
    var chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + "\n";
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    var lineRe = /(\n+)([^\n]*)/g;
    var result = (function() {
      var nextLF = string.indexOf("\n");
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    })();
    var prevMoreIndented = string[0] === "\n" || string[0] === " ";
    var moreIndented;
    var match;
    while (match = lineRe.exec(string)) {
      var prefix = match[1], line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ") return line;
    var breakRe = / [^ ]/g;
    var match;
    var start = 0, end, curr = 0, next = 0;
    var result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += "\n" + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += "\n";
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    var result = "";
    var char = 0;
    var escapeSeq;
    for (var i2 = 0; i2 < string.length; char >= 65536 ? i2 += 2 : i2++) {
      char = codePointAt(string, i2);
      escapeSeq = ESCAPE_SEQUENCES[char];
      if (!escapeSeq && isPrintable(char)) {
        result += string[i2];
        if (char >= 65536) result += string[i2 + 1];
      } else {
        result += escapeSeq || encodeHex(char);
      }
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    var _result = "", _tag = state.tag, index2, length, value;
    for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
      value = object[index2];
      if (state.replacer) {
        value = state.replacer.call(object, String(index2), value);
      }
      if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
        if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact) {
    var _result = "", _tag = state.tag, index2, length, value;
    for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
      value = object[index2];
      if (state.replacer) {
        value = state.replacer.call(object, String(index2), value);
      }
      if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
        if (!compact || _result !== "") {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index2, length, objectKey, objectValue, pairBuffer;
    for (index2 = 0, length = objectKeyList.length; index2 < length; index2 += 1) {
      pairBuffer = "";
      if (_result !== "") pairBuffer += ", ";
      if (state.condenseFlow) pairBuffer += '"';
      objectKey = objectKeyList[index2];
      objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024) pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact) {
    var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index2, length, objectKey, objectValue, explicitPair, pairBuffer;
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new exception("sortKeys must be a boolean or a function");
    }
    for (index2 = 0, length = objectKeyList.length; index2 < length; index2 += 1) {
      pairBuffer = "";
      if (!compact || _result !== "") {
        pairBuffer += generateNextLine(state, level);
      }
      objectKey = objectKeyList[index2];
      objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    var _result, typeList, index2, length, type2, style;
    typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (index2 = 0, length = typeList.length; index2 < length; index2 += 1) {
      type2 = typeList[index2];
      if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
        if (explicit) {
          if (type2.multi && type2.representName) {
            state.tag = type2.representName(object);
          } else {
            state.tag = type2.tag;
          }
        } else {
          state.tag = "?";
        }
        if (type2.represent) {
          style = state.styleMap[type2.tag] || type2.defaultStyle;
          if (_toString.call(type2.represent) === "[object Function]") {
            _result = type2.represent(object, style);
          } else if (_hasOwnProperty.call(type2.represent, style)) {
            _result = type2.represent[style](object, style);
          } else {
            throw new exception("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact, iskey, isblockseq) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    var type2 = _toString.call(state.dump);
    var inblock = block;
    var tagStr;
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    var objectOrArray = type2 === "[object Object]" || type2 === "[object Array]", duplicateIndex, duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type2 === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object Array]") {
        if (block && state.dump.length !== 0) {
          if (state.noArrayIndent && !isblockseq && level > 0) {
            writeBlockSequence(state, level - 1, state.dump, compact);
          } else {
            writeBlockSequence(state, level, state.dump, compact);
          }
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey, inblock);
        }
      } else if (type2 === "[object Undefined]") {
        return false;
      } else {
        if (state.skipInvalid) return false;
        throw new exception("unacceptable kind of an object to dump " + type2);
      }
      if (state.tag !== null && state.tag !== "?") {
        tagStr = encodeURI(
          state.tag[0] === "!" ? state.tag.slice(1) : state.tag
        ).replace(/!/g, "%21");
        if (state.tag[0] === "!") {
          tagStr = "!" + tagStr;
        } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
          tagStr = "!!" + tagStr.slice(18);
        } else {
          tagStr = "!<" + tagStr + ">";
        }
        state.dump = tagStr + " " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    var objects = [], duplicatesIndexes = [], index2, length;
    inspectNode(object, objects, duplicatesIndexes);
    for (index2 = 0, length = duplicatesIndexes.length; index2 < length; index2 += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index2]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    var objectKeyList, index2, length;
    if (object !== null && typeof object === "object") {
      index2 = objects.indexOf(object);
      if (index2 !== -1) {
        if (duplicatesIndexes.indexOf(index2) === -1) {
          duplicatesIndexes.push(index2);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (index2 = 0, length = object.length; index2 < length; index2 += 1) {
            inspectNode(object[index2], objects, duplicatesIndexes);
          }
        } else {
          objectKeyList = Object.keys(object);
          for (index2 = 0, length = objectKeyList.length; index2 < length; index2 += 1) {
            inspectNode(object[objectKeyList[index2]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump$1(input, options) {
    options = options || {};
    var state = new State(options);
    if (!state.noRefs) getDuplicateReferences(input, state);
    var value = input;
    if (state.replacer) {
      value = state.replacer.call({ "": value }, "", value);
    }
    if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
    return "";
  }
  var dump_1 = dump$1;
  var dumper = {
    dump: dump_1
  };
  var dump = dumper.dump;
  const defaultJsonIndent = 2;
  function tickWrap(plugin, content) {
    return `


\`\`\`${plugin}
${content}
\`\`\`


`;
  }
  function jsonWrap(type2, content) {
    return tickWrap("json " + type2, content);
  }
  function yamlWrap(type2, content) {
    return tickWrap("yaml " + type2, trimTrailingNewline(content));
  }
  function chartWrap(spec) {
    const chartType = getChartType(spec);
    return jsonWrap(chartType, JSON.stringify(spec, null, defaultJsonIndent));
  }
  function chartWrapYaml(spec) {
    const chartType = getChartType(spec);
    return yamlWrap(chartType, dump(spec, { indent: defaultJsonIndent }));
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
  const defaultOptions$1 = {
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
    const finalOptions = { ...defaultOptions$1, ...options };
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
    const vegaScope = dataLoaderMarkdown(dataLoaders.filter((dl) => dl.type !== "spec"), variables, tabulatorElements);
    for (const dataLoader of dataLoaders.filter((dl) => dl.type === "spec")) {
      const useYaml = getPluginFormat("vega", finalPluginFormat) === "yaml";
      mdSections.push(useYaml ? chartWrapYaml(dataLoader.spec) : chartWrap(dataLoader.spec));
    }
    for (const group of page.groups) {
      mdSections.push(mdContainerWrap(defaultCommonOptions.groupClassName, group.groupId, groupMarkdown(group, variables, vegaScope, page.resources, finalPluginFormat)));
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
    const markdown = mdSections.join("\n");
    return normalizeNewlines(markdown, finalOptions.extraNewlines).trim();
  }
  function dataLoaderMarkdown(dataSources, variables, tabulatorElements) {
    const spec = createSpecWithVariables(variables, tabulatorElements);
    const vegaScope = new VegaScope(spec);
    for (const dataSource of dataSources) {
      switch (dataSource.type) {
        case "inline": {
          addStaticDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
        case "file": {
          addStaticDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
        case "url": {
          addDynamicDataLoaderToSpec(vegaScope, dataSource);
          break;
        }
      }
    }
    return vegaScope;
  }
  function groupMarkdown(group, variables, vegaScope, resources, pluginFormat) {
    var _a, _b, _c, _d, _e;
    const mdElements = [];
    const addSpec = (pluginName, spec, indent = true) => {
      const format = getPluginFormat(pluginName, pluginFormat);
      if (format === "yaml") {
        const content = indent ? dump(spec, { indent: defaultJsonIndent }) : dump(spec);
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
  const index$4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    normalizeNewlines,
    targetMarkdown
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
      __publicField(this, "options");
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
  const index$3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Sandbox
  }, Symbol.toStringTag, { value: "Module" }));
  const guardedJs = `/**
* Copyright (c) Microsoft Corporation.
* Licensed under the MIT License.
*/
function sniffContent(content) {
    if (typeof content !== 'string') {
        console.warn('Blocked: content is not a string. Type:', typeof content);
        return false;
    }
    const len = content.length;
    if (len < 5) {
        console.warn('Blocked: content too short (length =', len + ')');
        return false;
    }
    if (len > 1_000_000) {
        console.warn('Blocked: content too large (length =', len + ')');
        return false;
    }
    const head = content.slice(0, 512);
    const lower = head.toLowerCase();
    for (let i = 0; i < head.length; i++) {
        const code = head.charCodeAt(i);
        if ((code < 32 && code !== 9 && code !== 10 && code !== 13) ||
            code > 126) {
            console.warn('Blocked: binary or control char at pos', i, '(charCode =', code + ')');
            return false;
        }
    }
    const badSignatures = [
        '<html', '<script', '<style', '<iframe', '<svg', '<link',
        '<meta', '<!doctype', '<?xml', '</',
        '%pdf', '{\\\\rtf', 'mz', 'gif89a', 'gif87a', '\\x7felf', 'pk\\x03\\x04'
    ];
    const sig = lower.slice(0, 64);
    for (const s of badSignatures) {
        if (sig.includes(s)) {
            console.warn('Blocked: matched dangerous signature:', s);
            return false;
        }
    }
    return true;
}
window.addEventListener('message', async (e) => {
    const { url, options } = (e.data || {});
    let responseMessage;
    try {
        const res = await fetch(url, options);
        const body = await res.text();
        if (!sniffContent(body)) {
            console.warn('Content blocked:', url);
            responseMessage = { status: 403, error: 'Blocked by content firewall' };
        }
        else {
            responseMessage = { status: res.status, body };
        }
    }
    catch (err) {
        console.error('Fetch error:', url, err);
        responseMessage = { status: 500, error: err.message || 'Fetch failed' };
    }
    e.source?.postMessage(responseMessage, '*');
});
`;
  function guardedFetch(request) {
    return new Promise((resolve, reject) => {
      const loaderHTML = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Security-Policy" content="
    base-uri 'none';
">
</head>
<body>
<script>
${guardedJs}
<\/script>
</body>
</html>
`;
      const blob = new Blob([loaderHTML], { type: "text/html" });
      const blobURL = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.sandbox = "allow-scripts";
      iframe.referrerPolicy = "no-referrer";
      iframe.style.display = "none";
      iframe.src = blobURL;
      const cleanup = () => {
        window.removeEventListener("message", onMessage);
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobURL);
      };
      const onMessage = (event) => {
        if (event.source !== iframe.contentWindow) return;
        const { status, body, error } = event.data || {};
        cleanup();
        if (error) return reject(new Error(error));
        if (typeof status !== "number" || typeof body !== "string") {
          return reject(new Error("Invalid response from loader"));
        }
        resolve({ status, body });
      };
      window.addEventListener("message", onMessage);
      document.body.appendChild(iframe);
      iframe.onload = () => {
        var _a;
        (_a = iframe.contentWindow) == null ? void 0 : _a.postMessage(request, "*");
      };
    });
  }
  function checkUrlForFile(host) {
    const urlParams = new URLSearchParams(window.location.search);
    const loadUrl = urlParams.get(host.options.urlParamName);
    if (!loadUrl) {
      return false;
    }
    loadViaUrl(loadUrl, host, true, false);
    return true;
  }
  async function loadViaUrl(loadUrl, host, handle, showRestart) {
    if (!isSameOrigin(loadUrl) && !isValidLoadUrl(loadUrl)) {
      return {
        error: "Invalid URL format",
        errorDetail: "The URL provided is not same-origin or has an invalid format, protocol, or contains suspicious characters."
      };
    }
    try {
      const url = new URL(loadUrl, window.location.href);
      const response = await guardedFetch({ url: url.href });
      if (!response.status) {
        return {
          error: "Error loading file",
          errorDetail: `Error loading file from the provided URL`
        };
      }
      return determineContent(url.href, response.body, host, handle, showRestart);
    } catch (error) {
      return {
        error: "Error loading file",
        errorDetail: `Error loading file from the provided URL`
      };
    }
  }
  function isSameOrigin(url) {
    try {
      if (!url.includes("://")) {
        return true;
      }
      const parsedUrl = new URL(url);
      return parsedUrl.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  function isValidLoadUrl(url) {
    try {
      const parsedUrl = new URL(url, window.location.href);
      if (parsedUrl.protocol !== "https:" && !(parsedUrl.protocol === "http:" && (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1"))) {
        return false;
      }
      if (["javascript:", "vbscript:", "data:"].includes(parsedUrl.protocol)) {
        return false;
      }
      const hostname = parsedUrl.hostname.toLowerCase();
      if (hostname.includes("<") || hostname.includes(">") || hostname.includes('"') || hostname.includes("'")) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
  function loadFolder(folderUrl, folder, host) {
    if (!folder || !folder.docs) {
      host.errorHandler(
        "Invalid folder format",
        "Please provide a valid folder JSON."
      );
      return;
    }
    if (folder.docs.length === 0) {
      host.errorHandler(
        "Empty folder",
        "The folder does not contain any documents."
      );
      return;
    }
    if (!host.toolbar) {
      host.errorHandler(
        "Toolbar not found",
        "The toolbar element is required to load folder content."
      );
      return;
    }
    let docIndex = 0;
    const { folderSpan } = host.toolbar;
    folderSpan.style.display = "";
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.disabled = docIndex === 0;
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = docIndex === folder.docs.length - 1;
    const pageSelect = document.createElement("select");
    for (let i2 = 0; i2 < folder.docs.length; i2++) {
      const option = document.createElement("option");
      option.value = (i2 + 1).toString();
      option.textContent = folder.docs[i2].title ? folder.docs[i2].title : `Page ${i2 + 1}`;
      pageSelect.appendChild(option);
    }
    pageSelect.value = (docIndex + 1).toString();
    const navDiv = document.createElement("div");
    navDiv.style.display = "inline-block";
    navDiv.appendChild(prevBtn);
    navDiv.appendChild(pageSelect);
    navDiv.appendChild(nextBtn);
    function getHashParam(key) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      return params.get(key) ?? void 0;
    }
    function setHashParam(key, value) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      params.set(key, value.toString());
      window.location.hash = params.toString();
    }
    function updateFolderTitle() {
      folderSpan.innerHTML = "";
      const label = document.createElement("span");
      label.textContent = `${folder.title} `;
      const docCountDiv = document.createElement("div");
      docCountDiv.style.display = "inline-block";
      docCountDiv.style.marginRight = "0.5em";
      docCountDiv.textContent = `(document ${docIndex + 1} of ${folder.docs.length}) `;
      folderSpan.appendChild(label);
      folderSpan.appendChild(docCountDiv);
      folderSpan.appendChild(navDiv);
    }
    updateFolderTitle();
    function updatePage(newDocIndex, setHash = false) {
      docIndex = newDocIndex;
      if (setHash) {
        setHashParam("page", docIndex + 1);
      }
      prevBtn.disabled = docIndex === 0;
      nextBtn.disabled = docIndex === folder.docs.length - 1;
      pageSelect.value = (docIndex + 1).toString();
      updateFolderTitle();
      const title = folder.docs[docIndex].title || `Page ${docIndex + 1}`;
      resolveUrl(title, folderUrl, folder.docs[docIndex].href, host);
    }
    pageSelect.onchange = () => {
      const selectedPage = parseInt(pageSelect.value, 10);
      if (selectedPage >= 1 && selectedPage <= folder.docs.length) {
        updatePage(selectedPage - 1, true);
      }
    };
    prevBtn.onclick = () => {
      if (docIndex > 0) {
        updatePage(docIndex - 1, true);
      }
    };
    nextBtn.onclick = () => {
      if (docIndex < folder.docs.length - 1) {
        updatePage(docIndex + 1, true);
      }
    };
    function goToPageFromHash() {
      const pageStr = getHashParam("page");
      let newIndex = 0;
      if (pageStr) {
        const page = parseInt(pageStr, 10);
        if (page >= 1 && page <= folder.docs.length) {
          newIndex = page - 1;
        }
      }
      updatePage(newIndex, false);
    }
    window.addEventListener("hashchange", goToPageFromHash);
    if (!getHashParam("page")) {
      setHashParam("page", docIndex + 1);
    }
    goToPageFromHash();
    folderSpan.appendChild(navDiv);
  }
  async function resolveUrl(title, base, relativeOrAbsolute, host) {
    let url;
    try {
      url = base ? new URL(relativeOrAbsolute, base).href : relativeOrAbsolute;
    } catch (error) {
      host.errorHandler(
        "Invalid URL",
        `Invalid URL: ${relativeOrAbsolute} relative to ${base}`
      );
      return;
    }
    const result = await loadViaUrl(url, host, false, false);
    if (result.error) {
      host.errorHandler(
        result.error,
        result.errorDetail
      );
      return;
    }
    if (result.idoc) {
      host.render(title, void 0, result.idoc, false);
    } else if (result.markdown) {
      host.render(title, result.markdown, void 0, false);
    } else if (result.folder) {
      host.render("Error", "Nested folders are not supported", void 0, false);
    } else {
      host.errorHandler(
        "Invalid document format",
        "The document could not be loaded from the folder."
      );
    }
  }
  function determineContent(urlOrTitle, content, host, handle, showRestart) {
    const result = _determineContent(content);
    if (handle) {
      if (result.error) {
        host.errorHandler(
          result.error,
          result.errorDetail
        );
        return;
      } else if (result.idoc) {
        host.render(urlOrTitle, void 0, result.idoc, showRestart);
      } else if (result.folder) {
        loadFolder(urlOrTitle, result.folder, host);
      } else if (result.markdown) {
        host.render(urlOrTitle, result.markdown, void 0, showRestart);
      }
    }
    return result;
  }
  function _determineContent(content) {
    if (!content) {
      return {
        error: "Content is empty",
        errorDetail: "The content was empty. Please use valid markdown content or JSON."
      };
    }
    if (typeof content !== "string") {
      return {
        error: "Invalid content type",
        errorDetail: "The content is not a string. Please use valid markdown content or JSON."
      };
    }
    content = content.trim();
    if (!content) {
      return {
        error: "Content is empty",
        errorDetail: "The content was only whitespace. Please use valid markdown content or JSON."
      };
    }
    if (content.startsWith("{") && content.endsWith("}")) {
      try {
        const idoc_or_folder = JSON.parse(content);
        if (typeof idoc_or_folder !== "object") {
          return {
            error: "Invalid JSON format",
            errorDetail: "Please provide a valid Interactive Document or Folder JSON."
          };
        } else if (idoc_or_folder.$schema.endsWith("idoc_v1.json")) {
          const idoc = idoc_or_folder;
          return {
            idoc
          };
        } else if (idoc_or_folder.$schema.endsWith("folder_v1.json")) {
          const folder = idoc_or_folder;
          return {
            folder
          };
        } else {
          return {
            error: "Unsupported schema",
            errorDetail: "The provided JSON does not match any known schema."
          };
        }
      } catch (jsonError) {
        return {
          error: "Invalid JSON content in clipboard",
          errorDetail: "The pasted content is not valid JSON. Please copy a valid interactive document JSON file."
        };
      }
    } else {
      return {
        markdown: content
      };
    }
  }
  function readFile(file, host) {
    if (file.name.endsWith(".json") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        var _a;
        let content = (_a = e.target) == null ? void 0 : _a.result;
        if (!content) {
          host.errorHandler(
            "File content is empty",
            "The file is empty. Please use a valid markdown or JSON file."
          );
          return;
        }
        content = content.trim();
        if (!content) {
          host.errorHandler(
            "File content is empty",
            "The file is empty or contains only whitespace. Please use a valid markdown or JSON file."
          );
          return;
        }
        determineContent(file.name, content, host, true, true);
      };
      reader.onerror = (e) => {
        host.errorHandler(
          "Failed to read file",
          "Error reading file"
        );
      };
      reader.readAsText(file);
    } else {
      host.errorHandler(
        "Invalid file type",
        "Only markdown (.md) or JSON (.json) files are supported."
      );
    }
  }
  function setupClipboardHandling(host) {
    const pasteHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const clipboardData = e.clipboardData;
      if (clipboardData && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        readFile(file, host);
      } else if (clipboardData && clipboardData.items) {
        let handled = false;
        for (let i2 = 0; i2 < clipboardData.items.length; i2++) {
          const item = clipboardData.items[i2];
          if (item.kind === "string" && item.type === "text/plain") {
            item.getAsString((content) => {
              if (!content) {
                host.errorHandler(
                  "Pasted content is empty",
                  "The pasted content was empty. Please paste valid markdown content or JSON."
                );
                return;
              }
              content = content.trim();
              if (!content) {
                host.errorHandler(
                  "Pasted content is empty",
                  "The pasted content was only whitespace. Please paste valid markdown content or JSON."
                );
                return;
              }
              determineContent("clipboard-content", content, host, true, true);
            });
            handled = true;
            break;
          }
        }
        if (!handled) {
          host.errorHandler(
            "Unsupported clipboard content",
            "Please paste a markdown file, JSON file, or valid text content."
          );
        }
      } else {
        host.errorHandler(
          "Unsupported clipboard content",
          "Please paste a markdown file, JSON file, or valid text content."
        );
      }
    };
    document.addEventListener("paste", pasteHandler);
    return () => {
      document.removeEventListener("paste", pasteHandler);
    };
  }
  function setupDragDropHandling(host) {
    const dragHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const dropHandler = (e) => {
      var _a, _b;
      e.preventDefault();
      e.stopPropagation();
      const files = (_a = e.dataTransfer) == null ? void 0 : _a.files;
      if (files && files.length > 0) {
        const file = files[0];
        readFile(file, host);
      } else if ((_b = e.dataTransfer) == null ? void 0 : _b.types.includes("text/plain")) {
        let content = e.dataTransfer.getData("text/plain");
        if (!content) {
          host.errorHandler(
            "Dropped content is empty",
            "The dropped content was empty. Please drop valid markdown content or JSON."
          );
          return;
        }
        content = content.trim();
        if (!content) {
          host.errorHandler(
            "Dropped content is empty",
            "The dropped content was only whitespace. Please drop valid markdown content or JSON."
          );
          return;
        }
        determineContent("dropped-content", content, host, true, true);
      } else {
        host.errorHandler(
          "Unsupported drop content",
          "Please drop a markdown file, JSON file, or valid text content."
        );
      }
    };
    document.addEventListener("drop", dropHandler);
    document.addEventListener("dragover", dragHandler);
    return () => {
      document.removeEventListener("drop", dropHandler);
      document.removeEventListener("dragover", dragHandler);
    };
  }
  function setupFileUpload(host) {
    const { uploadButton, fileInput } = host;
    if (!uploadButton || !fileInput) {
      host.errorHandler(
        "Upload button or file input not found",
        "Please ensure the upload button and file input elements are present in the HTML."
      );
      return;
    }
    uploadButton == null ? void 0 : uploadButton.addEventListener("click", () => {
      fileInput == null ? void 0 : fileInput.click();
    });
    fileInput == null ? void 0 : fileInput.addEventListener("change", (event) => {
      var _a;
      const file = (_a = event.target.files) == null ? void 0 : _a[0];
      if (file) {
        readFile(file, host);
      } else {
        host.errorHandler(
          "No file selected",
          "Please select a markdown or JSON file to upload."
        );
      }
    });
  }
  function setupPostMessageHandling(host) {
    window.addEventListener("message", (event) => {
      try {
        if (!event.data || typeof event.data !== "object") {
          host.errorHandler(
            "Invalid message format",
            "Received message is not an object or is undefined."
          );
          return;
        }
        const message = event.data;
        if (message.type == "hostRenderRequest") {
          if (message.markdown) {
            host.render(message.title, message.markdown, void 0, false);
          } else if (message.interactiveDocument) {
            host.render(message.title, void 0, message.interactiveDocument, false);
          } else {
          }
        }
      } catch (error) {
        host.errorHandler(
          error,
          "Error processing postMessage event"
        );
      }
    });
  }
  function postStatus(target, message) {
    if (target) {
      target.postMessage(message, "*");
    }
  }
  function getElement(elementOrSelector) {
    if (typeof elementOrSelector === "string") {
      return document.querySelector(elementOrSelector);
    }
    return elementOrSelector;
  }
  function show(element, shown) {
    if (!element) {
      return;
    }
    element.style.display = shown ? "" : "none";
  }
  const defaultOptions = {
    clipboard: true,
    dragDrop: true,
    fileUpload: true,
    postMessage: true,
    postMessageTarget: window.opener || window.parent || window,
    url: true,
    urlParamName: "load"
  };
  class Listener {
    constructor(options) {
      __publicField(this, "options");
      __publicField(this, "previewDiv");
      __publicField(this, "loadingDiv");
      __publicField(this, "helpDiv");
      __publicField(this, "uploadButton");
      __publicField(this, "fileInput");
      __publicField(this, "toolbar");
      __publicField(this, "sandbox");
      __publicField(this, "sandboxReady", false);
      __publicField(this, "onApprove");
      __publicField(this, "onSetMode");
      __publicField(this, "removeInteractionHandlers");
      __publicField(this, "sandboxConstructor");
      this.sandboxConstructor = options.sandboxConstructor || Sandbox;
      this.options = { ...defaultOptions, ...options == null ? void 0 : options.options };
      this.onApprove = options.onApprove;
      this.onSetMode = options.onSetMode || (() => {
      });
      this.removeInteractionHandlers = [];
      this.previewDiv = getElement(options.preview);
      this.loadingDiv = getElement(options.loading);
      this.helpDiv = getElement(options.help);
      this.uploadButton = getElement(options.uploadButton);
      this.fileInput = getElement(options.fileInput);
      if (options.toolbar) {
        this.toolbar = options.toolbar;
      }
      if (!this.previewDiv) {
        throw new Error("App container not found");
      }
      show(this.loadingDiv, true);
      show(this.helpDiv, false);
      this.createSandbox("");
      if (this.options.clipboard) {
        this.removeInteractionHandlers.push(setupClipboardHandling(this));
      }
      if (this.options.dragDrop) {
        this.removeInteractionHandlers.push(setupDragDropHandling(this));
      }
      if (this.options.fileUpload) {
        setupFileUpload(this);
      }
      if (this.options.postMessage) {
        setupPostMessageHandling(this);
      }
      if (!this.options.url || this.options.url && !checkUrlForFile(this)) {
        show(this.loadingDiv, false);
        show(this.helpDiv, true);
      }
    }
    createSandbox(markdown) {
      if (this.sandbox) {
        this.sandbox.destroy();
      }
      this.sandboxReady = false;
      this.sandbox = new this.sandboxConstructor(this.previewDiv, markdown, {
        onReady: () => {
          this.sandboxReady = true;
          postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "ready" });
        },
        onError: () => {
          this.errorHandler(
            "Sandbox initialization failed",
            "Sandbox could not be initialized"
          );
        },
        onApprove: this.onApprove
      });
      if (!markdown) {
        show(this.sandbox.element, false);
      }
    }
    errorHandler(error, details) {
      show(this.loadingDiv, false);
      show(this.helpDiv, false);
      show(this.previewDiv, true);
      let message;
      if (typeof error === "string") {
        message = error;
      } else if (typeof error.message === "string") {
        message = error.message;
      } else {
        try {
          message = error.toString();
        } catch {
          message = "Unknown error";
        }
      }
      if (this.sandboxReady) {
        const markdown = `# Error:
${message}

${details}`;
        this.renderMarkdown(markdown);
      } else {
        this.previewDiv.innerHTML = "";
        const h1 = document.createElement("h1");
        h1.textContent = "Error";
        const pMessage = document.createElement("p");
        pMessage.textContent = message;
        const pDetails = document.createElement("p");
        pDetails.textContent = details;
        this.previewDiv.appendChild(h1);
        this.previewDiv.appendChild(pMessage);
        this.previewDiv.appendChild(pDetails);
      }
    }
    render(title, markdown, interactiveDocument, showRestart) {
      if (this.toolbar) {
        this.toolbar.filename = title;
      }
      let didError = false;
      if (interactiveDocument) {
        this.onSetMode("json", null, interactiveDocument);
        this.renderInteractiveDocument(interactiveDocument);
      } else if (markdown) {
        this.onSetMode("markdown", markdown, null);
        this.renderMarkdown(markdown);
      } else {
        this.errorHandler(
          "No content provided",
          "Please provide either markdown or an interactive document to render."
        );
        didError = true;
      }
      if (this.toolbar && showRestart) {
        this.toolbar.showRestartButton();
      }
      if (!didError) {
        if (this.toolbar) {
          this.toolbar.showTweakButton();
          this.toolbar.showDownloadButton();
        }
      }
      this.removeInteractionHandlers.forEach((removeHandler) => removeHandler());
      this.removeInteractionHandlers = [];
    }
    renderInteractiveDocument(content) {
      postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "compiling", details: "Starting interactive document compilation" });
      const markdown = targetMarkdown(content);
      this.renderMarkdown(markdown);
    }
    hideLoadingAndHelp() {
      show(this.loadingDiv, false);
      show(this.helpDiv, false);
    }
    renderMarkdown(markdown) {
      this.hideLoadingAndHelp();
      try {
        postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "rendering", details: "Starting markdown rendering" });
        if (!this.sandbox || !this.sandboxReady) {
          this.createSandbox(markdown);
        } else {
          this.sandbox.send(markdown);
        }
        show(this.sandbox.element, true);
        postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "rendered", details: "Markdown rendering completed successfully" });
      } catch (error) {
        this.errorHandler(
          error,
          "Error rendering markdown content"
        );
        postStatus(this.options.postMessageTarget, { type: "hostStatus", hostStatus: "error", details: `Rendering failed: ${error.message}` });
      }
    }
  }
  const index$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Listener
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
  function htmlJsonWrapper(title, json2) {
    const template = htmlJson;
    const result = template.replace("{{TITLE}}", () => escapeHtml(title)).replace("{{HTML_JSON_JS}}", () => `<script>
${htmlJsonJs}
<\/script>`).replace("{{TEXTAREA_CONTENT}}", () => escapeTextareaContent(json2));
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
  exports2.common = index$5;
  exports2.compiler = index$4;
  exports2.host = index$2;
  exports2.sandbox = index$3;
  exports2.toolbar = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
