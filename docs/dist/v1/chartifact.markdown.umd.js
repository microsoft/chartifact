(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined" ? factory(exports, require("js-yaml"), require("vega"), require("vega-lite")) : typeof define === "function" && define.amd ? define(["exports", "js-yaml", "vega", "vega-lite"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.Chartifact = global.Chartifact || {}, global.jsyaml, global.vega, global.vegaLite));
})(this, (function(exports2, yaml, vega, vegaLite) {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  function _interopNamespaceDefault(e) {
    const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
    if (e) {
      for (const k2 in e) {
        if (k2 !== "default") {
          const d2 = Object.getOwnPropertyDescriptor(e, k2);
          Object.defineProperty(n, k2, d2.get ? d2 : {
            enumerable: true,
            get: () => e[k2]
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
  const u = (e, t) => {
    t && e.forEach(([s, n]) => {
      switch (s) {
        case "class":
          t.attrJoin("class", n);
          break;
        case "css-module":
          t.attrJoin("css-module", n);
          break;
        default:
          t.attrPush([s, n]);
      }
    });
  }, _ = ".", x = "#", v = /[^\t\n\f />"'=]/, O = " ", E = "=", d = (e, t, { left: s, right: n, allowed: o }) => {
    let i = "", l = "", r = true, c = false;
    const f = [];
    for (let h = t + s.length; h < e.length; h++) {
      if (e.slice(h, h + n.length) === n) {
        i !== "" && f.push([i, l]);
        break;
      }
      const a = e.charAt(h);
      if (a === E && r) {
        r = false;
        continue;
      }
      if (a === _ && i === "") {
        e.charAt(h + 1) === _ ? (i = "css-module", h++) : i = "class", r = false;
        continue;
      }
      if (a === x && i === "") {
        i = "id", r = false;
        continue;
      }
      if (a === '"' && l === "" && !c) {
        c = true;
        continue;
      }
      if (a === '"' && c) {
        c = false;
        continue;
      }
      if (a === O && !c) {
        if (i === "") continue;
        f.push([i, l]), i = "", l = "", r = true;
        continue;
      }
      if (!(r && a.search(v) === -1)) {
        if (r) {
          i += a;
          continue;
        }
        l += a;
      }
    }
    return o.length ? f.filter(([h]) => o.some((a) => a instanceof RegExp ? a.test(h) : a === h)) : f;
  }, y = ({ left: e, right: t }, s) => {
    if (!["start", "end", "only"].includes(s)) throw new Error(`Invalid 'where' parameter: ${s}. Expected 'start', 'end', or 'only'.`);
    return (n) => {
      const o = e.length, i = t.length, l = o + 1 + i, r = o + 1;
      if (!n || typeof n != "string" || n.length < l) return false;
      const c = (p) => [_, x].includes(p.charAt(o)) ? p.length >= l + 1 : p.length >= l;
      let f, h, a, m;
      return s === "start" ? (a = n.slice(0, o), f = a === e ? 0 : -1, h = f === -1 ? -1 : n.indexOf(t, r), m = n.charAt(h + i), m && t.includes(m) && (h = -1)) : s === "end" ? (f = n.lastIndexOf(e), h = f === -1 ? -1 : n.indexOf(t, f + r), h = h === n.length - i ? h : -1) : (a = n.slice(0, o), f = a === e ? 0 : -1, a = n.slice(n.length - i), h = a === t ? n.length - i : -1), f !== -1 && h !== -1 && c(n.substring(f, h + i));
    };
  }, g = (e, t) => {
    const s = e[t];
    if (s.type === "softbreak") return null;
    if (s.nesting === 0) return s;
    const n = s.level, o = s.type.replace("_close", "_open");
    for (; t >= 0; ) {
      const i = e[t];
      if (i.type === o && i.level === n) return i;
      t--;
    }
    /* istanbul ignore next -- @preserve */
    return null;
  }, b = (e) => e.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), w = (e, t, s) => {
    const n = b(t), o = b(s), i = e.search(new RegExp(`[ \\n]?${n}[^${n}${o}]+${o}$`));
    return i !== -1 ? e.slice(0, i) : e;
  }, $ = (e, t) => t >= 0 ? e[t] : e[e.length + t], C = (e) => Array.isArray(e) && !!e.length && e.every((t) => typeof t == "function"), I = (e) => Array.isArray(e) && !!e.length && e.every((t) => typeof t == "object"), k = (e, t, s) => {
    var _a, _b;
    const n = { match: false, position: null }, o = s.shift !== void 0 ? t + s.shift : s.position;
    if (s.shift !== void 0 && o < 0) return n;
    const i = $(e, o);
    if (!i) return n;
    for (const l of Object.keys(s)) {
      if (l === "shift" || l === "position") continue;
      if (i[l] === void 0) return n;
      if (l === "children" && I(s.children)) {
        if (((_a = i.children) == null ? void 0 : _a.length) === 0) return n;
        let c;
        const f = s.children, h = i.children;
        if (f.every((a) => a.position !== void 0)) {
          if (c = f.every((a) => k(h, a.position, a).match), c) {
            const a = ((_b = f[f.length - 1]) == null ? void 0 : _b.position) ?? 0;
            n.position = a >= 0 ? a : h.length + a;
          }
        } else for (let a = 0; a < h.length; a++) if (c = f.every((m) => k(h, a, m).match), c) {
          n.position = a;
          break;
        }
        if (c === false) return n;
        continue;
      }
      const r = s[l];
      switch (typeof r) {
        case "boolean":
        case "number":
        case "string": {
          if (i[l] !== r) return n;
          break;
        }
        case "function": {
          if (!r(i[l])) return n;
          break;
        }
        default: {
          if (C(r)) {
            if (!r.every((c) => c(i[l]))) return n;
            break;
          }
          throw new Error(`Unknown type of pattern test (key: ${l}). Test should be of type boolean, number, string, function or array of functions.`);
        }
      }
    }
    return n.match = true, n;
  }, S = (e) => ({ name: "end of block", tests: [{ shift: 0, type: "inline", children: [{ position: -1, content: y(e, "end"), type: (t) => t !== "code_inline" && t !== "math_inline" }] }], transform: (t, s, n) => {
    const o = t[s].children[n], { content: i } = o, l = i.lastIndexOf(e.left), r = d(i, l, e);
    let c = s + 1;
    for (; t[c + 1] && t[c + 1].nesting === -1; ) c++;
    const f = g(t, c);
    u(r, f);
    const h = i.slice(0, l), a = h[h.length - 1] === " ";
    o.content = a ? h.slice(0, -1) : h;
  } }), T = (e) => ({ name: "code-block", tests: [{ shift: 0, block: true, info: y(e, "end") }], transform: (t, s) => {
    const n = t[s];
    let o = "";
    const i = /{(?:[\d,-]+)}/.exec(n.info);
    i && (n.info = n.info.replace(i[0], ""), o = i[0]);
    const l = n.info.lastIndexOf(e.left), r = d(n.info, l, e);
    u(r, n);
    const c = w(n.info, e.left, e.right);
    n.info = `${c} ${o}`.trim();
  } }), D = (e) => [{ name: "inline nesting self-close", tests: [{ shift: 0, type: "inline", children: [{ shift: -1, type: (t) => t === "image" || t === "code_inline" }, { shift: 0, type: "text", content: y(e, "start") }] }], transform: (t, s, n) => {
    const o = e.right.length, i = t[s].children[n], l = i.content.indexOf(e.right), r = t[s].children[n - 1], c = d(i.content, 0, e);
    u(c, r), i.content.length === l + o ? t[s].children.splice(n, 1) : i.content = i.content.slice(l + o);
  } }, { name: "inline attributes", tests: [{ shift: 0, type: "inline", children: [{ shift: -1, nesting: -1 }, { shift: 0, type: "text", content: y(e, "start") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], { content: i } = o, l = d(i, 0, e), r = g(t[s].children, n - 1);
    u(l, r);
    const c = i.indexOf(e.right) + e.right.length;
    o.content = i.slice(c);
  } }], K = (e) => [{ name: "list softbreak", tests: [{ shift: -2, type: "list_item_open" }, { shift: 0, type: "inline", children: [{ position: -2, type: "softbreak" }, { position: -1, type: "text", content: y(e, "only") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], i = d(o.content, 0, e);
    let l = s - 2;
    for (; t[l - 1] && t[l - 1].type !== "ordered_list_open" && t[l - 1].type !== "bullet_list_open"; ) l--;
    u(i, t[l - 1]), t[s].children = t[s].children.slice(0, -2);
  } }, { name: "list double softbreak", tests: [{ shift: 0, type: (t) => t === "bullet_list_close" || t === "ordered_list_close" }, { shift: 1, type: "paragraph_open" }, { shift: 2, type: "inline", content: y(e, "only"), children: (t) => t.length === 1 }, { shift: 3, type: "paragraph_close" }], transform: (t, s) => {
    const n = t[s + 2], o = d(n.content, 0, e), i = g(t, s);
    u(o, i), t.splice(s + 1, 3);
  } }, { name: "list item end", tests: [{ shift: -2, type: "list_item_open" }, { shift: 0, type: "inline", children: [{ position: -1, type: "text", content: y(e, "end") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], { content: i } = o, l = i.lastIndexOf(e.left), r = d(i, l, e);
    u(r, t[s - 2]);
    const c = i.slice(0, l), f = c[c.length - 1] === " ";
    o.content = f ? c.slice(0, -1) : c;
  } }], L = (e) => ({ name: `
{.a} softbreak then curly in start`, tests: [{ shift: 0, type: "inline", children: [{ position: -2, type: "softbreak" }, { position: -1, type: "text", content: y(e, "only") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], i = d(o.content, 0, e);
    let l = s + 1;
    for (; t[l + 1] && t[l + 1].nesting === -1; ) l++;
    const r = g(t, l);
    u(i, r), t[s].children = t[s].children.slice(0, -2);
  } }), M = (e) => ({ name: "horizontal rule", tests: [{ shift: 0, type: "paragraph_open" }, { shift: 1, type: "inline", children: (t) => t.length === 1, content: (t) => new RegExp(`^ {0,3}[-*_]{3,} ?${b(e.left)}[^${b(e.right)}]`).test(t) }, { shift: 2, type: "paragraph_close" }], transform: (t, s) => {
    const n = t[s];
    n.type = "hr", n.tag = "hr", n.nesting = 0;
    const o = t[s + 1], { content: i } = o, l = i.lastIndexOf(e.left), r = d(i, l, e);
    u(r, n), n.markup = i, t.splice(s + 1, 2);
  } }), A = (e) => {
    var _a;
    e.hidden = true, (_a = e.children) == null ? void 0 : _a.forEach((t) => {
      t.content = "", A(t);
    });
  }, P = (e, t, s, n, o, i) => {
    let l = n - (o > 0 ? o : 1);
    for (let r = t, c = i; r < s && c > 1; r++) if (e[r].type === "tr_open") {
      const f = e[r];
      f.meta ?? (f.meta = {}), f.meta.columnCount && (l -= 1), f.meta.columnCount = l, c--;
    }
  }, j = (e, t, s) => {
    var _a;
    const n = (_a = e[t].meta) == null ? void 0 : _a.columnCount;
    if (n) for (let o = t, i = 0; o < s; o++) {
      const l = e[o];
      if (l.type === "td_open") i += 1;
      else if (l.type === "tr_close") break;
      i > n && !l.hidden && A(l);
    }
  }, N = (e, t, s, n, o, i) => {
    var _a;
    const l = [], r = e[t];
    let c = t + 3, f = n;
    for (let p = t; p > i; p--) if (e[p].type === "tr_open") {
      f = ((_a = e[p].meta) == null ? void 0 : _a.columnCount) ?? f;
      break;
    } else e[p].type === "td_open" && l.unshift(p);
    for (let p = t + 2; p < s; p++) if (e[p].type === "tr_close") {
      c = p;
      break;
    } else e[p].type === "td_open" && l.push(p);
    const h = l.indexOf(t), a = Math.min(o, f - h);
    o > a && r.attrSet("colspan", a.toString());
    const m = l.slice(f + 1 - n - a)[0];
    for (let p = m; p < c; p++) e[p].hidden || A(e[p]);
  }, B = (e) => [{ name: "table", tests: [{ shift: 0, type: "table_close" }, { shift: 1, type: "paragraph_open" }, { shift: 2, type: "inline", content: y(e, "only") }], transform: (t, s) => {
    const n = t[s + 2], o = g(t, s), i = d(n.content, 0, e);
    u(i, o), t.splice(s + 1, 3);
  } }, { name: "table cell attributes", tests: [{ shift: -1, type: (t) => t === "td_open" || t === "th_open" }, { shift: 0, type: "inline", children: [{ shift: 0, type: "text", content: y(e, "end") }] }], transform: (t, s, n) => {
    const o = t[s].children[n], i = t[s - 1], { content: l } = o, r = l.lastIndexOf(e.left), c = d(l, r, e);
    u(c, i), o.content = l.substring(0, r).trim();
  } }, { name: "table thead metadata", tests: [{ shift: 0, type: "tr_close" }, { shift: 1, type: "thead_close" }, { shift: 2, type: "tbody_open" }], transform: (t, s) => {
    const n = g(t, s), o = t[s - 1];
    let i = 0, l = s - 1;
    for (; l > 0; ) {
      const c = t[l];
      if (c === n) {
        const f = t[l - 1];
        f.meta = { ...f.meta, columnCount: i };
        break;
      }
      c.level === o.level && c.type === o.type && i++, l--;
    }
    const r = t[s + 2];
    r.meta = { ...r.meta, columnCount: i };
  } }, { name: "table tbody calculate", tests: [{ shift: 0, type: "tbody_close", hidden: false }], transform: (t, s) => {
    var _a;
    let n = s - 2;
    for (; n > 0 && (n--, t[n].type !== "tbody_open"); ) ;
    const o = Number(((_a = t[n].meta) == null ? void 0 : _a.columnCount) ?? 0);
    if (o < 2) return;
    const i = t[s].level + 2;
    for (let l = n; l < s; l++) {
      if (t[l].level > i) continue;
      const r = t[l], c = r.hidden ? 0 : Number(r.attrGet("rowspan")), f = r.hidden ? 0 : Number(r.attrGet("colspan"));
      c > 1 && P(t, l, s, o, f, c), r.type === "tr_open" && j(t, l, s), f > 1 && N(t, l, s, o, f, n);
    }
  } }], R$1 = ["fence", "inline", "table", "list", "hr", "softbreak", "block"], F = (e) => {
    const t = e.rule === false ? [] : Array.isArray(e.rule) ? e.rule.filter((n) => R$1.includes(n)) : R$1, s = [];
    return t.includes("fence") && s.push(T(e)), t.includes("inline") && s.push(...D(e)), t.includes("table") && s.push(...B(e)), t.includes("list") && s.push(...K(e)), t.includes("softbreak") && s.push(L(e)), t.includes("hr") && s.push(M(e)), t.includes("block") && s.push(S(e)), s;
  }, G = (e, { left: t = "{", right: s = "}", allowed: n = [], rule: o = "all" } = {}) => {
    const i = F({ left: t, right: s, allowed: n, rule: o }), l = ({ tokens: r }) => {
      for (let c = 0; c < r.length; c++) for (let f = 0; f < i.length; f++) {
        const h = i[f];
        let a = null;
        h.tests.every((m) => {
          const p = k(r, c, m);
          return p.position !== null && ({ position: a } = p), p.match;
        }) && (h.transform(r, c, a), (h.name === "inline attributes" || h.name === "inline nesting self-close") && f--);
      }
    };
    e.core.ruler.before("linkify", "attrs", l);
  };
  const R = (p, u2) => {
    if (typeof u2 != "object" || !u2.name) throw new Error("[@mdit/plugin-container]: 'name' option is required.");
    const { name: n, marker: c = ":", validate: $2 = (e) => e.trim().split(" ", 2)[0] === n, openRender: g2 = (e, t, l, k2, a) => (e[t].attrJoin("class", n), a.renderToken(e, t, l)), closeRender: C2 = (e, t, l, k2, a) => a.renderToken(e, t, l) } = u2, M2 = c[0], i = c.length, I2 = (e, t, l, k2) => {
      const a = e.bMarks[t] + e.tShift[t], _2 = e.eMarks[t], d2 = e.sCount[t];
      if (M2 !== e.src[a]) return false;
      let r = a + 1;
      for (; r <= _2 && c[(r - a) % i] === e.src[r]; ) r++;
      const b2 = Math.floor((r - a) / i);
      if (b2 < 3) return false;
      r -= (r - a) % i;
      const m = c.repeat(b2), T2 = e.src.slice(r, _2);
      if (!$2(T2, m)) return false;
      if (k2) return true;
      let o = t + 1, x2 = false;
      for (; o < l; o++) {
        const s = e.bMarks[o] + e.tShift[o], h = e.eMarks[o];
        if (s < h && e.sCount[o] < d2) break;
        if (e.sCount[o] === d2 && M2 === e.src[s]) {
          for (r = s + 1; r <= h && c[(r - s) % i] === e.src[r]; r++) ;
          if (Math.floor((r - s) / i) >= b2 && (r -= (r - s) % i, r = e.skipSpaces(r), r >= h)) {
            x2 = true;
            break;
          }
        }
      }
      const S2 = e.parentType, v2 = e.lineMax, w2 = e.blkIndent;
      e.parentType = "container", e.lineMax = o, e.blkIndent = d2;
      const f = e.push(`container_${n}_open`, "div", 1);
      f.markup = m, f.block = true, f.info = T2, f.map = [t, o], e.md.block.tokenize(e, t + 1, o);
      const y2 = e.push(`container_${n}_close`, "div", -1);
      return y2.markup = m, y2.block = true, e.parentType = S2, e.lineMax = v2, e.blkIndent = w2, e.line = o + (x2 ? 1 : 0), true;
    };
    p.block.ruler.before("fence", `container_${n}`, I2, { alt: ["paragraph", "reference", "blockquote", "list"] }), p.renderer.rules[`container_${n}_open`] = g2, p.renderer.rules[`container_${n}_close`] = C2;
  };
  class DynamicUrl {
    constructor(templateUrl, onChange) {
      __publicField(this, "signals");
      __publicField(this, "tokens");
      __publicField(this, "lastUrl");
      this.templateUrl = templateUrl;
      this.onChange = onChange;
      this.signals = {};
      this.tokens = tokenizeTemplate(templateUrl);
      const signalNames = this.tokens.filter((token) => token.type === "variable").map((token) => token.name);
      if (signalNames.length === 0) {
        onChange(templateUrl);
        this.lastUrl = templateUrl;
        return;
      }
      signalNames.forEach((signalName) => {
        this.signals[signalName] = void 0;
      });
    }
    makeUrl() {
      const signalNames = Object.keys(this.signals);
      if (signalNames.length === 0) {
        return this.templateUrl;
      }
      if (this.tokens.length === 1 && this.tokens[0].type === "variable") {
        return this.signals[this.tokens[0].name] || "";
      }
      const urlParts = [];
      this.tokens.forEach((token) => {
        if (token.type === "literal") {
          urlParts.push(token.value);
        } else if (token.type === "variable") {
          const signalValue = this.signals[token.name];
          if (signalValue !== void 0) {
            urlParts.push(encodeURIComponent(signalValue));
          }
        }
      });
      return urlParts.join("");
    }
    receiveBatch(batch) {
      for (const [signalName, batchItem] of Object.entries(batch)) {
        if (signalName in this.signals) {
          if (batchItem.isData || batchItem.value === void 0) {
            continue;
          }
          this.signals[signalName] = batchItem.value.toString();
        }
      }
      const newUrl = this.makeUrl();
      if (newUrl !== this.lastUrl) {
        this.onChange(newUrl);
        this.lastUrl = newUrl;
      }
    }
  }
  function getJsonScriptTag(container, errorHandler) {
    const scriptTag = container.previousElementSibling;
    if ((scriptTag == null ? void 0 : scriptTag.tagName) !== "SCRIPT" || scriptTag.getAttribute("type") !== "application/json") {
      errorHandler(new Error("Invalid JSON script tag"));
      return null;
    }
    if (!scriptTag.textContent) {
      errorHandler(new Error("Empty JSON script tag"));
      return null;
    }
    try {
      return JSON.parse(scriptTag.textContent);
    } catch (error) {
      errorHandler(error);
      return null;
    }
  }
  function pluginClassName(pluginName2) {
    return `chartifact-plugin-${pluginName2}`;
  }
  const newId = () => [...Date.now().toString(36) + Math.random().toString(36).slice(2)].sort(() => 0.5 - Math.random()).join("");
  let domDocument = typeof document !== "undefined" ? document : void 0;
  function setDomDocument(doc) {
    domDocument = doc;
  }
  function sanitizedHTML(tagName, attributes, content, precedeWithScriptTag) {
    if (!domDocument) {
      throw new Error("No DOM Document available. Please set domDocument using setDomDocument.");
    }
    const element = domDocument.createElement(tagName);
    Object.keys(attributes).forEach((key) => {
      element.setAttribute(key, attributes[key]);
    });
    if (precedeWithScriptTag) {
      const scriptElement = domDocument.createElement("script");
      scriptElement.setAttribute("type", "application/json");
      const safeContent = content.replace(/<\/script>/gi, "<\\/script>");
      scriptElement.innerHTML = safeContent;
      return scriptElement.outerHTML + element.outerHTML;
    } else {
      element.textContent = content;
    }
    return element.outerHTML;
  }
  function sanitizeHtmlComment(content) {
    const tempElement = document.createElement("div");
    tempElement.textContent = content;
    const safeContent = tempElement.innerHTML;
    const comment = document.createComment(safeContent);
    const container = document.createElement("div");
    container.appendChild(comment);
    return container.innerHTML;
  }
  function flaggablePlugin(pluginName2, className2, flagger, attrs) {
    const plugin = {
      name: pluginName2,
      fence: (token, index2) => {
        let content = token.content.trim();
        let spec;
        let flaggableSpec;
        const info = token.info.trim();
        const isYaml = info.startsWith("yaml ");
        const formatName = isYaml ? "YAML" : "JSON";
        try {
          if (isYaml) {
            spec = yaml__namespace.load(content);
          } else {
            spec = JSON.parse(content);
          }
        } catch (e) {
          flaggableSpec = {
            spec: null,
            hasFlags: true,
            reasons: [`malformed ${formatName}`]
          };
        }
        if (spec) {
          if (flagger) {
            flaggableSpec = flagger(spec);
          } else {
            flaggableSpec = { spec };
          }
        }
        if (flaggableSpec) {
          content = JSON.stringify(flaggableSpec);
        }
        return sanitizedHTML("div", { class: className2, id: `${pluginName2}-${index2}`, ...attrs }, content, true);
      },
      hydrateSpecs: (renderer, errorHandler) => {
        var _a;
        const flagged = [];
        const containers = renderer.element.querySelectorAll(`.${className2}`);
        for (const [index2, container] of Array.from(containers).entries()) {
          const flaggableSpec = getJsonScriptTag(container, (e) => errorHandler(e, pluginName2, index2, "parse", container));
          if (!flaggableSpec) continue;
          const f = { approvedSpec: null, pluginName: pluginName2, containerId: container.id };
          if (flaggableSpec.hasFlags) {
            f.blockedSpec = flaggableSpec.spec;
            f.reason = ((_a = flaggableSpec.reasons) == null ? void 0 : _a.join(", ")) || "Unknown reason";
          } else {
            f.approvedSpec = flaggableSpec.spec;
          }
          flagged.push(f);
        }
        return flagged;
      }
    };
    return plugin;
  }
  const ImageOpacity = {
    full: "1",
    loading: "0.1",
    error: "0.5"
  };
  const pluginName$d = "image";
  const className$b = pluginClassName(pluginName$d);
  const imagePlugin = {
    ...flaggablePlugin(pluginName$d, className$b),
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const imageInstances = [];
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        const spec = specReview.approvedSpec;
        container.innerHTML = createImageContainerTemplate("", spec.alt, spec.url, index2, errorHandler);
        const { img, spinner, retryBtn, dynamicUrl } = createImageLoadingLogic(
          container,
          null,
          (error) => {
            errorHandler(error, pluginName$d, index2, "load", container, img.src);
          }
        );
        const imageInstance = {
          id: `${pluginName$d}-${index2}`,
          spec,
          img: null,
          // Will be set below
          spinner: null,
          // Will be set below
          dynamicUrl
        };
        imageInstance.img = img;
        imageInstance.spinner = spinner;
        if (spec.alt) img.alt = spec.alt;
        if (spec.width) img.width = spec.width;
        if (spec.height) img.height = spec.height;
        imageInstances.push(imageInstance);
      }
      const instances = imageInstances.map((imageInstance, index2) => {
        const { img, spinner, id, dynamicUrl } = imageInstance;
        const signalNames = Object.keys((dynamicUrl == null ? void 0 : dynamicUrl.signals) || {});
        return {
          id,
          initialSignals: Array.from(signalNames).map((name) => ({
            name,
            value: null,
            priority: -1,
            isData: false
          })),
          destroy: () => {
            if (img) {
              img.remove();
            }
            if (spinner) {
              spinner.remove();
            }
          },
          receiveBatch: async (batch, from) => {
            dynamicUrl == null ? void 0 : dynamicUrl.receiveBatch(batch);
          }
        };
      });
      return instances;
    }
  };
  const imgSpinner = `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="gray" stroke-width="2" fill="none" stroke-dasharray="31.4" stroke-dashoffset="0">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
    </circle>
</svg>
`;
  function createImageContainerTemplate(clasName, alt, src, instanceIndex, errorHandler) {
    const tempImg = document.createElement("img");
    if (src.includes("{{")) {
      tempImg.setAttribute("src", "data:,");
      tempImg.setAttribute("data-dynamic-url", src);
    } else {
      if (isSafeImageUrl(src)) {
        tempImg.setAttribute("src", src);
      } else {
        errorHandler(new Error(`Unsafe image URL: ${src}`), pluginName$d, instanceIndex, "load", null, src);
      }
    }
    tempImg.setAttribute("alt", alt);
    const imgHtml = tempImg.outerHTML;
    return `<span class="${clasName}" style="position: relative;display:inline-block;min-width:24px;min-height:10px;">
        <span class="image-spinner" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none;">
            ${imgSpinner}
        </span>
        ${imgHtml}
        <button type="button" class="image-retry" style="display: none;">Retry</button>
    </span>`;
  }
  function createImageLoadingLogic(container, onSuccess, onError) {
    container.style.position = "relative";
    const img = container.querySelector("img");
    const spinner = container.querySelector(".image-spinner");
    const retryBtn = container.querySelector(".image-retry");
    const dataDynamicUrl = img.getAttribute("data-dynamic-url");
    img.onload = () => {
      spinner.style.display = "none";
      img.style.opacity = ImageOpacity.full;
      img.style.display = "";
      retryBtn.style.display = "none";
      img.setAttribute("hasImage", "true");
    };
    img.onerror = () => {
      spinner.style.display = "none";
      img.style.opacity = ImageOpacity.error;
      img.style.display = "none";
      retryBtn.style.display = "";
      retryBtn.disabled = false;
      img.setAttribute("hasImage", "false");
      onError == null ? void 0 : onError(new Error("Image failed to load"));
    };
    retryBtn.onclick = () => {
      retryBtn.disabled = true;
      spinner.style.display = "";
      img.style.opacity = ImageOpacity.loading;
      img.style.display = img.getAttribute("hasImage") ? "" : "none";
      const src = img.src;
      const onload = img.onload;
      const onerror = img.onerror;
      img.src = "data:,";
      img.onload = null;
      img.onerror = null;
      setTimeout(() => {
        img.onload = onload;
        img.onerror = onerror;
        img.src = src;
      }, 100);
    };
    const result = { img, spinner, retryBtn };
    if (dataDynamicUrl) {
      const dynamicUrl = new DynamicUrl(dataDynamicUrl, (src) => {
        if (isSafeImageUrl(src)) {
          spinner.style.display = "";
          img.src = src;
          img.style.opacity = ImageOpacity.loading;
        } else {
          img.src = "";
          spinner.style.display = "none";
          img.style.opacity = ImageOpacity.full;
        }
      });
      result.dynamicUrl = dynamicUrl;
    }
    return result;
  }
  function isSafeImageUrl(url) {
    try {
      if (url.startsWith("data:image/")) {
        const safeMimeTypes = [
          "data:image/png",
          "data:image/jpeg",
          "data:image/gif",
          "data:image/webp",
          "data:image/bmp",
          "data:image/x-icon"
        ];
        for (const mime of safeMimeTypes) {
          if (url.startsWith(mime)) {
            return true;
          }
        }
        return false;
      }
      const parsed = new URL(url, window.location.origin);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }
  function decorateDynamicUrl(tokens, idx, attrName, elementType) {
    const token = tokens[idx];
    const attrValue = token.attrGet(attrName);
    if (attrValue && attrValue.includes("%7B%7B")) {
      if (!token.attrs) {
        token.attrs = [];
      }
      token.attrSet("dynamic-url", decodeURIComponent(attrValue));
      token.attrSet(attrName, "");
    }
    return token;
  }
  function decorateFenceWithPlaceholders(tokens, idx) {
    const token = tokens[idx];
    const content = token.content;
    if (content && content.includes("{{")) {
      const templateTokens = tokenizeTemplate(content);
      const variableTokens = templateTokens.filter((t) => t.type === "variable");
      if (variableTokens.length > 0) {
        const templateContent = encodeURIComponent(content);
        const placeholderData = variableTokens.map((t) => `data-placeholder-${t.name.toLowerCase()}="true"`).join(" ");
        return `<pre class="has-placeholders" data-template-content="${templateContent}" ${placeholderData}><code></code></pre>`;
      }
    }
    return null;
  }
  const pluginName$c = "placeholders";
  const imageClassName = pluginClassName(pluginName$c + "_image");
  const placeholdersPlugin = {
    name: pluginName$c,
    initializePlugin: async (md) => {
      md.use(function(md2) {
        md2.inline.ruler.after("emphasis", "dynamic_placeholder", function(state, silent) {
          let token;
          const max = state.posMax;
          const start = state.pos;
          if (state.src.charCodeAt(start) !== 123 || state.src.charCodeAt(start + 1) !== 123) {
            return false;
          }
          for (let pos = start + 2; pos < max; pos++) {
            if (state.src.charCodeAt(pos) === 125 && state.src.charCodeAt(pos + 1) === 125) {
              if (!silent) {
                state.pos = start + 2;
                state.posMax = pos;
                token = state.push("dynamic_placeholder", "", 0);
                token.markup = state.src.slice(start, pos + 2);
                token.content = state.src.slice(state.pos, state.posMax);
                state.pos = pos + 2;
                state.posMax = max;
              }
              return true;
            }
          }
          return false;
        });
        md2.renderer.rules["dynamic_placeholder"] = function(tokens, idx) {
          const key = tokens[idx].content.trim();
          return `<span class="dynamic-placeholder" data-key="${key}">{${key}}</span>`;
        };
      });
      md.renderer.rules["link_open"] = function(tokens, idx, options, env, slf) {
        decorateDynamicUrl(tokens, idx, "href");
        return slf.renderToken(tokens, idx, options);
      };
      md.renderer.rules["image"] = function(tokens, idx, options, env, slf) {
        const alt = tokens[idx].attrGet("alt");
        const src = tokens[idx].attrGet("src");
        let error;
        const html = createImageContainerTemplate(imageClassName, alt, decodeURIComponent(src), idx, (e, pluginName2, instanceIndex, phase, container, detail) => {
          error = sanitizeHtmlComment(`Error in plugin ${pluginName2} instance ${instanceIndex} phase ${phase}: ${e.message} ${detail}`);
        });
        return error || html;
      };
    },
    hydrateComponent: async (renderer, errorHandler) => {
      const dynamicUrlMap = /* @__PURE__ */ new WeakMap();
      const templateHandlerMap = /* @__PURE__ */ new WeakMap();
      const placeholders = renderer.element.querySelectorAll(".dynamic-placeholder");
      const dynamicUrls = renderer.element.querySelectorAll("[dynamic-url]");
      const dynamicImages = renderer.element.querySelectorAll(`.${imageClassName}`);
      const codeBlocksWithPlaceholders = renderer.element.querySelectorAll(".has-placeholders[data-template-content]");
      const elementsByKeys = /* @__PURE__ */ new Map();
      for (const placeholder of Array.from(placeholders)) {
        const key = placeholder.getAttribute("data-key");
        if (!key) {
          continue;
        }
        if (elementsByKeys.has(key)) {
          elementsByKeys.get(key).push(placeholder);
        } else {
          elementsByKeys.set(key, [placeholder]);
        }
      }
      for (const element of Array.from(codeBlocksWithPlaceholders)) {
        const templateContent = element.getAttribute("data-template-content");
        if (!templateContent) {
          continue;
        }
        const templateText = decodeURIComponent(templateContent);
        const tokens = tokenizeTemplate(templateText);
        const variableTokens = tokens.filter((token) => token.type === "variable");
        const templateHandler = {
          signals: {},
          update: () => {
            let content = "";
            for (const token of tokens) {
              if (token.type === "literal") {
                content += token.value;
              } else if (token.type === "variable") {
                content += templateHandler.signals[token.name] || "";
              }
            }
            element.innerHTML = `<code>${content}</code>`;
          }
        };
        variableTokens.forEach((token) => {
          templateHandler.signals[token.name] = "";
        });
        templateHandlerMap.set(element, templateHandler);
        variableTokens.forEach((token) => {
          const key = token.name;
          if (elementsByKeys.has(key)) {
            elementsByKeys.get(key).push(element);
          } else {
            elementsByKeys.set(key, [element]);
          }
        });
      }
      for (const element of Array.from(dynamicUrls)) {
        const templateUrl = element.getAttribute("dynamic-url");
        if (!templateUrl) {
          continue;
        }
        if (element.tagName === "A") {
          const dynamicUrl = new DynamicUrl(templateUrl, (url) => {
            element.setAttribute("href", url);
          });
          dynamicUrlMap.set(element, dynamicUrl);
          for (const key of Object.keys(dynamicUrl.signals)) {
            if (elementsByKeys.has(key)) {
              elementsByKeys.get(key).push(element);
            } else {
              elementsByKeys.set(key, [element]);
            }
          }
        }
      }
      for (const element of Array.from(dynamicImages)) {
        const { dynamicUrl, img } = createImageLoadingLogic(element, null, (error) => {
          const index2 = -1;
          errorHandler(error, pluginName$c, index2, "load", element, img.src);
        });
        if (!dynamicUrl) {
          continue;
        }
        dynamicUrlMap.set(element, dynamicUrl);
        for (const key of Object.keys(dynamicUrl.signals)) {
          if (elementsByKeys.has(key)) {
            elementsByKeys.get(key).push(element);
          } else {
            elementsByKeys.set(key, [element]);
          }
        }
      }
      const initialSignals = Array.from(elementsByKeys.keys()).map((name) => {
        const prioritizedSignal = {
          name,
          value: null,
          priority: -1,
          isData: false
        };
        return prioritizedSignal;
      });
      const instances = [
        {
          id: pluginName$c,
          initialSignals,
          receiveBatch: async (batch) => {
            var _a, _b;
            for (const key of Object.keys(batch)) {
              const elements = elementsByKeys.get(key) || [];
              for (const element of elements) {
                if (element.classList.contains("dynamic-placeholder")) {
                  const markdownContent = ((_a = batch[key].value) == null ? void 0 : _a.toString()) || "";
                  const parsedMarkdown = isMarkdownInline(markdownContent) ? renderer.md.renderInline(markdownContent) : renderer.md.render(markdownContent);
                  element.innerHTML = parsedMarkdown;
                } else if (element.hasAttribute("dynamic-url")) {
                  const dynamicUrl = dynamicUrlMap.get(element);
                  if (dynamicUrl) {
                    dynamicUrl.receiveBatch(batch);
                  }
                } else if (element.classList.contains(imageClassName)) {
                  const dynamicUrl = dynamicUrlMap.get(element);
                  if (dynamicUrl) {
                    dynamicUrl.receiveBatch(batch);
                  }
                } else if (element.hasAttribute("data-template-content")) {
                  const templateHandler = templateHandlerMap.get(element);
                  if (templateHandler && templateHandler.signals) {
                    templateHandler.signals[key] = ((_b = batch[key].value) == null ? void 0 : _b.toString()) || "";
                    templateHandler.update();
                  }
                }
              }
            }
          }
        }
      ];
      return instances;
    }
  };
  function isMarkdownInline(markdown) {
    if (!markdown.includes("\n")) {
      return true;
    }
    const blockElements = ["#", "-", "*", ">", "```", "~~~"];
    for (const element of blockElements) {
      if (markdown.trim().startsWith(element)) {
        return false;
      }
    }
    return true;
  }
  let markdownit;
  if (typeof globalThis.markdownit === "function") {
    markdownit = globalThis.markdownit;
  }
  function setMarkdownIt(md) {
    markdownit = md;
  }
  let csstree;
  if (typeof globalThis.csstree === "object") {
    csstree = globalThis.csstree;
  }
  function setCssTree(tree) {
    csstree = tree;
  }
  const plugins = [];
  function registerMarkdownPlugin(plugin) {
    let insertIndex = plugins.length;
    let minIndex = 0;
    for (let i = 0; i < plugins.length; i++) {
      if (plugins[i].hydratesBefore === plugin.name) {
        minIndex = Math.max(minIndex, i + 1);
      }
    }
    if (plugin.hydratesBefore) {
      const targetIndex = plugins.findIndex((p) => p.name === plugin.hydratesBefore);
      if (targetIndex !== -1) {
        insertIndex = targetIndex;
      }
    }
    insertIndex = Math.max(insertIndex, minIndex);
    plugins.splice(insertIndex, 0, plugin);
    return "register";
  }
  function create() {
    var _a;
    const md = new markdownit();
    for (const plugin of plugins) {
      (_a = plugin.initializePlugin) == null ? void 0 : _a.call(plugin, md);
    }
    md.use(G);
    const containerOptions = { name: defaultCommonOptions.groupClassName };
    md.use(R, containerOptions);
    const originalFence = md.renderer.rules.fence;
    md.renderer.rules.fence = function(tokens, idx, options, env, slf) {
      const token = tokens[idx];
      const info = token.info.trim();
      const findPlugin = (pluginName2) => {
        const plugin = plugins.find((p) => p.name === pluginName2);
        if (plugin && plugin.fence) {
          return plugin.fence(token, idx);
        }
      };
      if (info.startsWith("#")) {
        return findPlugin("#");
      } else {
        const directPlugin = findPlugin(info);
        if (directPlugin) {
          return directPlugin;
        } else if (info.startsWith("json ")) {
          const jsonPluginName = info.slice(5).trim();
          const jsonPlugin = findPlugin(jsonPluginName);
          if (jsonPlugin) {
            return jsonPlugin;
          }
        } else if (info.startsWith("yaml ")) {
          const yamlPluginName = info.slice(5).trim();
          const yamlPlugin = findPlugin(yamlPluginName);
          if (yamlPlugin) {
            return yamlPlugin;
          }
        }
      }
      if (originalFence) {
        const originalResult = originalFence(tokens, idx, options, env, slf);
        if (token.content && token.content.includes("{{")) {
          return decorateFenceWithPlaceholders([token], 0);
        }
        return originalResult;
      } else {
        return "";
      }
    };
    return md;
  }
  const pluginName$b = "checkbox";
  const className$a = pluginClassName(pluginName$b);
  const checkboxPlugin = {
    ...flaggablePlugin(pluginName$b, className$a),
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const { signalBus } = renderer;
      const checkboxInstances = [];
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        const spec = specReview.approvedSpec;
        const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            <input type="checkbox" class="vega-bind-checkbox" id="${spec.variableId}" name="${spec.variableId}" ${spec.value ? "checked" : ""}/>
                        </label>
                    </div>
                </form>`;
        container.innerHTML = html;
        const element = container.querySelector('input[type="checkbox"]');
        const checkboxInstance = { id: `${pluginName$b}-${index2}`, spec, element };
        checkboxInstances.push(checkboxInstance);
      }
      const instances = checkboxInstances.map((checkboxInstance) => {
        const { element, spec } = checkboxInstance;
        const initialSignals = [{
          name: spec.variableId,
          value: spec.value || false,
          priority: 1,
          isData: false
        }];
        return {
          ...checkboxInstance,
          initialSignals,
          receiveBatch: async (batch) => {
            if (batch[spec.variableId]) {
              const value = batch[spec.variableId].value;
              element.checked = value;
            }
          },
          beginListening() {
            element.addEventListener("change", (e) => {
              const value = e.target.checked;
              const batch = {
                [spec.variableId]: {
                  value,
                  isData: false
                }
              };
              signalBus.broadcast(checkboxInstance.id, batch);
            });
          },
          getCurrentSignalValue: () => {
            return element.checked;
          },
          destroy: () => {
            element.removeEventListener("change", checkboxInstance.element.onchange);
          }
        };
      });
      return instances;
    }
  };
  const pluginName$a = "#";
  const commentPlugin = {
    name: pluginName$a,
    fence: (token) => {
      const content = token.content.trim();
      return sanitizeHtmlComment(content);
    }
  };
  function reconstituteAtRule(atRule) {
    if (atRule.css) {
      return atRule.flag ? `/* ${atRule.css} - BLOCKED: ${atRule.reason} */` : atRule.css;
    }
    if (!atRule.rules || atRule.rules.length === 0) return "";
    const reconstitutedRules = [];
    for (const rule of atRule.rules) {
      const validDeclarations = rule.declarations.map((decl) => decl.css).filter((css) => css.trim() !== "");
      if (validDeclarations.length > 0) {
        reconstitutedRules.push(`${rule.selector} {
  ${validDeclarations.join(";\n  ")};
}`);
      }
    }
    if (reconstitutedRules.length === 0) return "";
    if (atRule.signature === "") {
      return reconstitutedRules.join("\n\n");
    } else {
      return `${atRule.signature} {
${reconstitutedRules.join("\n\n")}
}`;
    }
  }
  function reconstituteCss(atRules) {
    const cssBlocks = [];
    for (const atRule of Object.values(atRules)) {
      const reconstructed = reconstituteAtRule(atRule);
      if (reconstructed.trim()) {
        cssBlocks.push(reconstructed);
      }
    }
    return cssBlocks.join("\n\n");
  }
  function categorizeCss(cssContent) {
    const spec = {
      atRules: {}
    };
    const result = {
      spec,
      hasFlags: false,
      reasons: []
    };
    const completeBlockAtRules = [
      // Keyframes and variants
      "keyframes",
      "-webkit-keyframes",
      "-moz-keyframes",
      "-o-keyframes",
      // Font-related at-rules
      "font-face",
      "font-feature-values",
      "font-palette-values",
      // Page and counter styling
      "page",
      "counter-style",
      // CSS Houdini and newer features
      "property",
      "layer",
      "container",
      "scope",
      "starting-style",
      "position-try"
    ];
    function checkSecurityIssues(node) {
      if (node.type === "Function" && node.name === "expression") {
        return { flag: "scriptExec", reason: "CSS expression() function detected" };
      }
      if (node.type === "Url") {
        const urlValue = node.value;
        if (!urlValue) return null;
        const url = urlValue.value || urlValue;
        const urlStr = url.toLowerCase();
        if (urlStr.startsWith("javascript:") || urlStr.startsWith("vbscript:")) {
          return { flag: "scriptExec", reason: `${urlStr.split(":")[0]} URL detected` };
        }
        if (urlStr.startsWith("data:")) {
          if (urlStr.includes("data:image/svg+xml")) {
            if (urlStr.includes("<script")) {
              return { flag: "svgDataUrl", reason: "SVG data URL with script detected" };
            }
            return { flag: "svgDataUrl", reason: "SVG data URL detected - requires approval" };
          }
          return { flag: "externalResource", reason: "Data URL detected" };
        }
        if (urlStr.startsWith("http://")) {
          return { flag: "insecureExternalResource", reason: "Insecure external URL (http) detected" };
        } else if (urlStr.startsWith("https://")) {
          return { flag: "externalResource", reason: "External URL detected" };
        }
      }
      if (node.type === "String" || node.type === "Identifier") {
        const value = node.value || node.name || "";
        if (typeof value === "string") {
          const valueStr = value.toLowerCase();
          if (valueStr.includes("\\") && (valueStr.includes("3c") || valueStr.includes("3e") || valueStr.includes("22") || valueStr.includes("27"))) {
            return { flag: "xss", reason: "Potential CSS-encoded XSS detected" };
          }
        }
      }
      return null;
    }
    try {
      let addCurrentRule = function() {
        if (currentRule && currentRule.declarations.length > 0) {
          const targetAtRule = currentAtRuleSignature;
          if (!spec.atRules[targetAtRule]) {
            spec.atRules[targetAtRule] = {
              signature: targetAtRule,
              rules: []
            };
          }
          if (spec.atRules[targetAtRule].rules) {
            spec.atRules[targetAtRule].rules.push(currentRule);
          } else {
            spec.atRules[targetAtRule].rules = [currentRule];
          }
        }
      };
      const ast = csstree.parse(cssContent);
      let currentRule = null;
      let currentAtRuleSignature = "";
      csstree.walk(ast, (node) => {
        if (node.type === "Atrule") {
          const atRuleSignature = `@${node.name}${node.prelude ? ` ${csstree.generate(node.prelude)}` : ""}`;
          if (node.name === "import") {
            const ruleContent = csstree.generate(node);
            const reason = "@import rule detected - requires approval";
            spec.atRules[atRuleSignature] = {
              signature: atRuleSignature,
              css: ruleContent,
              flag: "importRule",
              reason
            };
            result.hasFlags = true;
            result.reasons.push(reason);
            return;
          }
          if (completeBlockAtRules.includes(node.name)) {
            const ruleContent = csstree.generate(node);
            spec.atRules[atRuleSignature] = {
              signature: atRuleSignature,
              css: ruleContent
            };
            return;
          }
          if (node.block) {
            if (!spec.atRules[atRuleSignature]) {
              spec.atRules[atRuleSignature] = {
                signature: atRuleSignature,
                rules: []
              };
            }
            currentAtRuleSignature = atRuleSignature;
          } else {
            const ruleContent = csstree.generate(node);
            spec.atRules[atRuleSignature] = {
              signature: atRuleSignature,
              css: ruleContent
            };
          }
        } else if (node.type === "Rule") {
          addCurrentRule();
          const selector = csstree.generate(node.prelude);
          currentRule = {
            selector,
            declarations: []
          };
        } else if (node.type === "Declaration" && currentRule) {
          const declCss = csstree.generate(node);
          const declaration = { css: declCss };
          const securityCheck = checkSecurityIssues(node);
          if (securityCheck) {
            declaration.css = `/* omitted (${securityCheck.reason}) */`;
            declaration.unsafeCss = declCss;
            declaration.flag = securityCheck.flag;
            declaration.reason = securityCheck.reason;
            result.hasFlags = true;
            result.reasons.push(securityCheck.reason);
          }
          currentRule.declarations.push(declaration);
        } else if (currentRule && (node.type === "Function" || node.type === "Url" || node.type === "String" || node.type === "Identifier")) {
          const securityCheck = checkSecurityIssues(node);
          if (securityCheck && currentRule.declarations.length > 0) {
            const lastDecl = currentRule.declarations[currentRule.declarations.length - 1];
            if (!lastDecl.flag) {
              lastDecl.unsafeCss = lastDecl.css;
              lastDecl.css = `/* omitted (${securityCheck.reason}) */`;
              lastDecl.flag = securityCheck.flag;
              lastDecl.reason = securityCheck.reason;
              result.hasFlags = true;
              result.reasons.push(securityCheck.reason);
            }
          }
        }
      });
      addCurrentRule();
    } catch (parseError) {
      throw new Error(`CSS parsing failed: ${parseError.message}`);
    }
    return result;
  }
  const pluginName$9 = "css";
  const className$9 = pluginClassName(pluginName$9);
  const cssPlugin = {
    ...flaggablePlugin(pluginName$9, className$9),
    fence: (token, index2) => {
      const cssContent = token.content.trim();
      const categorizedCss = categorizeCss(cssContent);
      return sanitizedHTML("div", { id: `${pluginName$9}-${index2}`, class: className$9 }, JSON.stringify(categorizedCss), true);
    },
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const cssInstances = [];
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        const categorizedCss = specReview.approvedSpec;
        const comments = [];
        const safeCss = reconstituteCss(categorizedCss.atRules);
        if (safeCss.trim().length > 0) {
          const styleElement = document.createElement("style");
          styleElement.type = "text/css";
          styleElement.id = `chartifact-css-${index2}`;
          styleElement.textContent = safeCss;
          const target = renderer.shadowRoot || document.head;
          target.appendChild(styleElement);
          comments.push(`<!-- CSS styles applied to ${renderer.shadowRoot ? "shadow DOM" : "document"} -->`);
          cssInstances.push({
            id: `${pluginName$9}-${index2}`,
            element: styleElement
          });
        } else {
          comments.push(`<!-- No safe CSS styles to apply -->`);
        }
        container.innerHTML = comments.join("\n");
      }
      const instances = cssInstances.map((cssInstance) => {
        return {
          id: cssInstance.id,
          initialSignals: [],
          // CSS doesn't need signals
          destroy: () => {
            if (cssInstance.element && cssInstance.element.parentNode) {
              cssInstance.element.parentNode.removeChild(cssInstance.element);
            }
          }
        };
      });
      return instances;
    }
  };
  function isValidGoogleFontsUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && parsed.hostname === "fonts.googleapis.com" && parsed.pathname === "/css2";
    } catch {
      return false;
    }
  }
  function sanitizeFontFamily(fontName) {
    return fontName.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();
  }
  function sanitizeSizing(sizeValue) {
    if (typeof sizeValue !== "number" || isNaN(sizeValue) || !isFinite(sizeValue)) {
      console.warn("Invalid sizing value - must be a finite number:", sizeValue);
      return null;
    }
    if (sizeValue < 0.1 || sizeValue >= 10) {
      console.warn("Sizing value out of safe range (0.1 to 9.999):", sizeValue);
      return null;
    }
    return Math.round(sizeValue * 1e3) / 1e3;
  }
  function extractFontFamilies(googleFontsUrl) {
    const families = [];
    try {
      const url = new URL(googleFontsUrl);
      const params = url.searchParams;
      const familyParams = params.getAll("family");
      for (const value of familyParams) {
        const rawFamilyName = value.split(":")[0].replace(/\+/g, " ");
        const familyName = sanitizeFontFamily(rawFamilyName);
        if (!familyName) {
          console.warn("Skipped invalid font family name:", rawFamilyName);
          continue;
        }
        families.push(familyName);
      }
    } catch (error) {
      console.error("Failed to parse Google Fonts URL:", error);
    }
    return families;
  }
  function generateSemanticCSS(spec, families, scopeId) {
    const cssRules = [];
    const generateRule = (elementType, selectors) => {
      var _a, _b;
      const fontFamily = (_a = spec.mapping) == null ? void 0 : _a[elementType];
      const sizeValue = (_b = spec.sizing) == null ? void 0 : _b[elementType];
      if (!fontFamily && !sizeValue) return;
      let css = `${selectors} {`;
      if (fontFamily) {
        const sanitizedName = sanitizeFontFamily(fontFamily);
        const family = families.find((f) => f === sanitizedName);
        if (family) {
          css += `
  font-family: '${family}';`;
        }
      }
      if (sizeValue) {
        const sanitizedSize = sanitizeSizing(sizeValue);
        if (sanitizedSize !== null) {
          css += `
  font-size: ${sanitizedSize}em;`;
        }
      }
      css += "\n}";
      cssRules.push(css);
    };
    generateRule("body", "body");
    generateRule("headings", "h1, h2, h3, h4, h5, h6");
    generateRule("code", "code, pre, kbd, samp, tt, .hljs");
    generateRule("table", "table, .tabulator");
    generateRule("hero", "h1");
    return cssRules.join("\n\n");
  }
  const pluginName$8 = "google-fonts";
  const className$8 = pluginClassName(pluginName$8);
  function inspectGoogleFontsSpec(spec) {
    var _a, _b;
    const reasons = [];
    let hasFlags = false;
    if (!spec.googleFontsUrl) {
      reasons.push("googleFontsUrl is required");
      hasFlags = true;
    } else if (!isValidGoogleFontsUrl(spec.googleFontsUrl)) {
      reasons.push("Invalid googleFontsUrl - must be HTTPS and point to fonts.googleapis.com/css2");
      hasFlags = true;
    }
    for (const key of ["body", "hero", "headings", "code", "table"]) {
      if (((_a = spec.mapping) == null ? void 0 : _a[key]) && typeof spec.mapping[key] !== "string") {
        reasons.push(`Invalid mapping for ${key} - must be a string`);
        hasFlags = true;
      }
      if (((_b = spec.sizing) == null ? void 0 : _b[key]) && typeof spec.sizing[key] !== "number") {
        reasons.push(`Invalid sizing for ${key} - must be a number`);
        hasFlags = true;
      }
    }
    return {
      spec,
      hasFlags,
      reasons
    };
  }
  const googleFontsPlugin = {
    ...flaggablePlugin(pluginName$8, className$8, inspectGoogleFontsSpec),
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const googleFontsInstances = [];
      let emitted = false;
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        if (emitted) {
          container.innerHTML = "<!-- Additional Google Fonts blocks ignored - only one per page allowed -->";
          continue;
        }
        try {
          const spec = specReview.approvedSpec;
          if (!spec.googleFontsUrl) {
            container.innerHTML = "<!-- Google Fonts Error: googleFontsUrl is required -->";
            continue;
          }
          if (!isValidGoogleFontsUrl(spec.googleFontsUrl)) {
            container.innerHTML = "<!-- Google Fonts Error: Only HTTPS Google Fonts URLs (https://fonts.googleapis.com/css2) are allowed -->";
            continue;
          }
          const families = extractFontFamilies(spec.googleFontsUrl);
          if (families.length === 0) {
            container.innerHTML = "<!-- Google Fonts Error: No font families found in URL -->";
            return [];
          }
          const instanceId = `gf-${Date.now()}-0`;
          const importCSS = `@import url('${spec.googleFontsUrl}');`;
          const semanticCSS = generateSemanticCSS(spec, families, instanceId);
          const fullCSS = importCSS + "\n\n" + semanticCSS;
          const styleElement = document.createElement("style");
          styleElement.type = "text/css";
          styleElement.id = `idocs-google-fonts-${container.id}`;
          styleElement.textContent = fullCSS;
          const target = renderer.shadowRoot || document.head;
          target.appendChild(styleElement);
          const googleFontsInstance = {
            id: container.id,
            spec,
            styleElement
          };
          googleFontsInstances.push(googleFontsInstance);
          emitted = true;
          const fontsList = families.join(", ");
          container.innerHTML = `<!-- Google Fonts loaded: ${fontsList} -->`;
        } catch (e) {
          container.innerHTML = `<!-- Google Fonts Error: ${e.toString()} -->`;
          errorHandler(e, "Google Fonts", 0, "parse", container);
        }
      }
      const instances = googleFontsInstances.map((googleFontsInstance) => {
        return {
          id: googleFontsInstance.id,
          initialSignals: [],
          // Google Fonts doesn't need signals
          destroy: () => {
            if (googleFontsInstance.styleElement && googleFontsInstance.styleElement.parentNode) {
              googleFontsInstance.styleElement.parentNode.removeChild(googleFontsInstance.styleElement);
            }
            if (googleFontsInstance.linkElement && googleFontsInstance.linkElement.parentNode) {
              googleFontsInstance.linkElement.parentNode.removeChild(googleFontsInstance.linkElement);
            }
          }
        };
      });
      return instances;
    }
  };
  const pluginName$7 = "dropdown";
  const className$7 = pluginClassName(pluginName$7);
  const dropdownPlugin = {
    ...flaggablePlugin(pluginName$7, className$7),
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const { signalBus } = renderer;
      const dropdownInstances = [];
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        const spec = specReview.approvedSpec;
        const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            <select class="vega-bind-select" id="${spec.variableId}" name="${spec.variableId}" ${spec.multiple ? "multiple" : ""} size="${spec.size || 1}">
                            </select>
                        </label>
                    </div>
                </form>`;
        container.innerHTML = html;
        const element = container.querySelector("select");
        setSelectOptions(element, spec.multiple ?? false, spec.options ?? [], spec.value ?? (spec.multiple ? [] : ""));
        const dropdownInstance = { id: `${pluginName$7}-${index2}`, spec, element };
        dropdownInstances.push(dropdownInstance);
      }
      const instances = dropdownInstances.map((dropdownInstance, index2) => {
        const { element, spec } = dropdownInstance;
        const initialSignals = [{
          name: spec.variableId,
          value: spec.value || null,
          priority: 1,
          isData: false
        }];
        if (spec.dynamicOptions) {
          initialSignals.push({
            name: spec.dynamicOptions.dataSourceName,
            value: null,
            priority: -1,
            isData: true
          });
        }
        return {
          ...dropdownInstance,
          initialSignals,
          receiveBatch: async (batch) => {
            var _a, _b;
            const { dynamicOptions } = spec;
            if (dynamicOptions == null ? void 0 : dynamicOptions.dataSourceName) {
              const newData = (_a = batch[dynamicOptions.dataSourceName]) == null ? void 0 : _a.value;
              if (newData) {
                let hasFieldName = false;
                const uniqueOptions = /* @__PURE__ */ new Set();
                newData.forEach((d2) => {
                  if (d2.hasOwnProperty(dynamicOptions.fieldName)) {
                    hasFieldName = true;
                    uniqueOptions.add(d2[dynamicOptions.fieldName]);
                  }
                });
                if (hasFieldName) {
                  const options = Array.from(uniqueOptions);
                  const existingSelection = spec.multiple ? Array.from(element.selectedOptions).map((option) => option.value) : element.value;
                  setSelectOptions(element, spec.multiple ?? false, options, existingSelection);
                  if (!spec.multiple) {
                    element.value = ((_b = batch[spec.variableId]) == null ? void 0 : _b.value) || options[0];
                  }
                } else {
                  element.innerHTML = "";
                  const errorOption = document.createElement("option");
                  errorOption.value = "";
                  errorOption.textContent = `Field "${dynamicOptions.fieldName}" not found`;
                  element.appendChild(errorOption);
                  element.value = "";
                }
              }
            }
            if (batch[spec.variableId]) {
              const value = batch[spec.variableId].value;
              if (spec.multiple) {
                Array.from(element.options).forEach((option) => {
                  option.selected = !!(value && Array.isArray(value) && value.includes(option.value));
                });
              } else {
                element.value = value;
              }
            }
          },
          beginListening() {
            element.addEventListener("change", (e) => {
              const value = spec.multiple ? Array.from(e.target.selectedOptions).map((option) => option.value) : e.target.value;
              const batch = {
                [spec.variableId]: {
                  value,
                  isData: false
                }
              };
              signalBus.broadcast(dropdownInstance.id, batch);
            });
          },
          getCurrentSignalValue: () => {
            if (spec.multiple) {
              return Array.from(element.selectedOptions).map((option) => option.value);
            }
            return element.value;
          },
          destroy: () => {
            element.removeEventListener("change", dropdownInstance.element.onchange);
          }
        };
      });
      return instances;
    }
  };
  function setSelectOptions(selectElement, multiple, options, selected) {
    selectElement.innerHTML = "";
    if (!options || options.length === 0) {
      if (multiple) {
        if (Array.isArray(selected)) {
          options = selected;
        } else {
          if (selected) {
            options = [selected];
          }
        }
      } else {
        if (selected) {
          options = [selected];
        }
      }
    }
    if (!options || options.length === 0) {
      return;
    }
    options.forEach((optionValue) => {
      const optionElement = document.createElement("option");
      optionElement.value = optionValue;
      optionElement.textContent = optionValue;
      let isSelected = false;
      if (multiple) {
        isSelected = (selected || []).includes(optionValue);
      } else {
        isSelected = selected === optionValue;
      }
      optionElement.selected = isSelected;
      selectElement.appendChild(optionElement);
    });
  }
  const pluginName$6 = "mermaid";
  const className$6 = pluginClassName(pluginName$6);
  function inspectMermaidSpec(spec) {
    const reasons = [];
    let hasFlags = false;
    if (spec.diagramText) {
      const dangerousPatterns = [
        /javascript:/i,
        /<script/i,
        /onclick=/i,
        /onerror=/i,
        /onload=/i,
        /href\s*=\s*["']javascript:/i
      ];
      for (const pattern of dangerousPatterns) {
        if (pattern.test(spec.diagramText)) {
          hasFlags = true;
          reasons.push("Potentially unsafe content detected in diagram");
          break;
        }
      }
    } else {
      if (spec.template && typeof spec.template !== "object") {
        hasFlags = true;
        reasons.push("template must be an object if provided");
      } else if (spec.template) {
        if (!spec.template.header || typeof spec.template.header !== "string") {
          hasFlags = true;
          reasons.push("template.header must be a non-empty string");
        }
        if (!spec.template.lineTemplates || typeof spec.template.lineTemplates !== "object") {
          hasFlags = true;
          reasons.push("template.lineTemplates must be an object");
        } else {
          for (const [lineTemplateName, lineTemplate] of Object.entries(spec.template.lineTemplates)) {
            if (typeof lineTemplate !== "string") {
              hasFlags = true;
              reasons.push(`Template '${lineTemplateName}' must be a string`);
            }
          }
        }
        if (!spec.template.dataSourceName) {
          hasFlags = true;
          reasons.push("Must specify dataSourceName for dynamic content");
        }
      }
    }
    return {
      spec,
      hasFlags,
      reasons
    };
  }
  async function initializeMermaid() {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict"
    });
  }
  if (typeof mermaid !== "undefined") {
    initializeMermaid();
  }
  let mermaidLoadPromise = null;
  function loadMermaidFromCDN() {
    if (mermaidLoadPromise) return mermaidLoadPromise;
    mermaidLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@11.10.0/dist/mermaid.min.js";
      script.async = true;
      script.onload = () => {
        initializeMermaid();
        resolve();
      };
      script.onerror = () => reject(new Error("Failed to load Mermaid from CDN"));
      document.head.appendChild(script);
    });
    return mermaidLoadPromise;
  }
  const mermaidPlugin = {
    ...flaggablePlugin(pluginName$6, className$6),
    fence: (token, index2) => {
      const content = token.content.trim();
      let spec;
      let flaggableSpec;
      const info = token.info.trim();
      const isYaml = info.startsWith("yaml ");
      try {
        let parsed;
        if (isYaml) {
          parsed = yaml__namespace.load(content);
        } else {
          parsed = JSON.parse(content);
        }
        if (parsed && typeof parsed === "object") {
          spec = parsed;
        } else {
          spec = { diagramText: content };
        }
      } catch (e) {
        spec = { diagramText: content };
      }
      flaggableSpec = inspectMermaidSpec(spec);
      const json = JSON.stringify(flaggableSpec);
      return sanitizedHTML("div", { class: className$6, id: `${pluginName$6}-${index2}` }, json, true);
    },
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const { signalBus } = renderer;
      const mermaidInstances = [];
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        if (!container) {
          continue;
        }
        const spec = specReview.approvedSpec;
        const { template } = spec;
        container.innerHTML = `<div class="mermaid-loading">Loading diagram...</div>`;
        const tokens = tokenizeTemplate((template == null ? void 0 : template.header) || "") || [];
        const mermaidInstance = {
          id: `${pluginName$6}-${index2}`,
          spec,
          container,
          signals: {},
          tokens,
          lastRenderedDiagram: null
        };
        mermaidInstances.push(mermaidInstance);
        if (spec.diagramText && typeof spec.diagramText === "string") {
          await renderRawDiagram(mermaidInstance.id, mermaidInstance.container, spec.diagramText, errorHandler, pluginName$6, index2);
        }
      }
      const instances = mermaidInstances.map((mermaidInstance, index2) => {
        const { spec, signals, tokens } = mermaidInstance;
        const { template, variableId } = spec;
        const initialSignals = tokens.filter((token) => token.type === "variable").map((token) => ({
          name: token.name,
          value: null,
          priority: -1,
          isData: false
        }));
        if (template == null ? void 0 : template.dataSourceName) {
          initialSignals.push({
            name: template.dataSourceName,
            value: null,
            priority: -1,
            isData: true
          });
        }
        if (variableId) {
          initialSignals.push({
            name: variableId,
            value: "",
            priority: 1,
            isData: false
          });
        }
        return {
          ...mermaidInstance,
          initialSignals,
          receiveBatch: async (batch) => {
            if (template) {
              for (const [signalName, batchItem] of Object.entries(batch)) {
                signals[signalName] = batchItem.value;
              }
              if (Array.isArray(signals[template.dataSourceName])) {
                const diagramText = dataToDiagram(template, signals[template.dataSourceName], tokens, signals);
                if (diagramText && mermaidInstance.lastRenderedDiagram !== diagramText) {
                  if (spec.variableId) {
                    signalBus.broadcast(mermaidInstance.id, {
                      [spec.variableId]: {
                        value: diagramText,
                        isData: false
                      }
                    });
                  }
                }
                if (diagramText && mermaidInstance.lastRenderedDiagram !== diagramText) {
                  await renderRawDiagram(mermaidInstance.id, mermaidInstance.container, diagramText, errorHandler, pluginName$6, index2);
                  mermaidInstance.lastRenderedDiagram = diagramText;
                }
              } else {
                mermaidInstance.container.innerHTML = '<div class="error">No data available to render diagram</div>';
              }
            } else if (variableId && batch[variableId]) {
              const value = batch[variableId].value;
              if (typeof value === "string" && value.trim().length > 0) {
                await renderRawDiagram(mermaidInstance.id, mermaidInstance.container, value, errorHandler, pluginName$6, index2);
                mermaidInstance.lastRenderedDiagram = value;
              } else {
                mermaidInstance.container.innerHTML = '<div class="error">No diagram to display</div>';
              }
            }
          }
        };
      });
      return instances;
    }
  };
  function isValidMermaid(diagramText) {
    const lines = diagramText.split("\n");
    return lines.length > 1 && lines[1].trim().length > 0;
  }
  async function renderRawDiagram(id, container, diagramText, errorHandler, pluginName2, index2) {
    if (typeof mermaid === "undefined") {
      await loadMermaidFromCDN();
    }
    if (typeof mermaid === "undefined") {
      container.innerHTML = '<div class="error">Mermaid library not loaded dynamically</div>';
      return;
    }
    if (!isValidMermaid(diagramText)) {
      container.innerHTML = '<div class="error">Invalid Mermaid diagram format</div>';
      return;
    }
    try {
      const { svg } = await mermaid.render(id, diagramText);
      container.innerHTML = svg;
    } catch (error) {
      container.innerHTML = `<div class="error">Failed to render diagram ${id} <pre>${diagramText}</pre></div>`;
      errorHandler(error instanceof Error ? error : new Error(String(error)), pluginName2, index2, "render", container);
      document.querySelectorAll('div[id^="dmermaid-"]').forEach((el) => el.remove());
    }
  }
  function dataToDiagram(template, data, tokens, signals) {
    var _a;
    const lines = [];
    const parts = [];
    tokens.forEach((token) => {
      if (token.type === "literal") {
        parts.push(token.value);
      } else if (token.type === "variable") {
        const signalValue = signals[token.name];
        if (signalValue !== void 0) {
          parts.push(encodeURIComponent(signalValue));
        }
      }
    });
    const header = parts.join("");
    lines.push(header);
    for (const item of data) {
      const lineTemplateName = item["lineTemplate"];
      const lineTemplate = (_a = template == null ? void 0 : template.lineTemplates) == null ? void 0 : _a[lineTemplateName];
      if (!lineTemplate) {
        console.warn(`Template '${lineTemplateName}' not found in lineTemplates`);
        continue;
      }
      const tokens2 = tokenizeTemplate(lineTemplate);
      let line = "";
      for (const token of tokens2) {
        if (token.type === "literal") {
          line += token.value;
        } else if (token.type === "variable") {
          const value = item[token.name];
          if (value !== void 0) {
            line += String(value);
          }
        }
      }
      lines.push(line);
    }
    const diagramText = lines.join("\n");
    return diagramText;
  }
  const pluginName$5 = "presets";
  const className$5 = pluginClassName(pluginName$5);
  const presetsPlugin = {
    ...flaggablePlugin(pluginName$5, className$5),
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const { signalBus } = renderer;
      const presetsInstances = [];
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        const id = `${pluginName$5}-${index2}`;
        const presets = specReview.approvedSpec;
        if (!Array.isArray(presets)) {
          container.innerHTML = '<div class="error">Expected an array of presets</div>';
          continue;
        }
        container.innerHTML = "";
        const ul = document.createElement("ul");
        const presetsInstance = { id, presets, element: ul };
        container.appendChild(ul);
        for (const preset of presets) {
          const li = document.createElement("li");
          if (!preset.name || !preset.state) {
            const span = document.createElement("span");
            span.className = "error";
            span.textContent = "Each preset must have a name and state";
            li.appendChild(span);
          } else {
            const button = document.createElement("button");
            button.textContent = preset.name;
            button.onclick = () => {
              const batch = {};
              for (const [signalName, value] of Object.entries(preset.state)) {
                batch[signalName] = { value, isData: false };
              }
              signalBus.broadcast(id, batch);
            };
            li.appendChild(button);
            li.appendChild(document.createTextNode(" "));
            if (preset.description) {
              button.title = preset.description;
            }
          }
          ul.appendChild(li);
        }
        presetsInstances.push(presetsInstance);
      }
      const instances = presetsInstances.map((presetsInstance, index2) => {
        const initialSignals = presetsInstance.presets.flatMap((preset) => {
          return Object.keys(preset.state).map((signalName) => {
            return {
              name: signalName,
              value: null,
              priority: -1,
              isData: void 0
              // we do not know if it is data or not
            };
          });
        });
        return {
          ...presetsInstance,
          initialSignals,
          broadcastComplete: async () => {
            const state = {};
            for (const signalName of Object.keys(signalBus.signalDeps)) {
              state[signalName] = signalBus.signalDeps[signalName].value;
            }
            setAllPresetsActiveState(presetsInstance, state);
          }
        };
      });
      return instances;
    }
  };
  function isPresetActive(preset, state) {
    for (const [signalName, value] of Object.entries(preset.state)) {
      if (state[signalName] !== value) {
        return false;
      }
    }
    return true;
  }
  function setAllPresetsActiveState(presetsInstance, state) {
    for (const [presetIndex, preset] of presetsInstance.presets.entries()) {
      const { classList } = presetsInstance.element.children[presetIndex];
      if (isPresetActive(preset, state)) {
        classList.add("active");
      } else {
        classList.remove("active");
      }
    }
  }
  const pluginName$4 = "slider";
  const className$4 = pluginClassName(pluginName$4);
  const sliderPlugin = {
    ...flaggablePlugin(pluginName$4, className$4),
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const { signalBus } = renderer;
      const sliderInstances = [];
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        const spec = specReview.approvedSpec;
        const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            <input type="range" class="vega-bind-range" id="${spec.variableId}" name="${spec.variableId}" 
                                   min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${spec.value || spec.min}"/>
                            <span class="vega-bind-value">${spec.value || spec.min}</span>
                        </label>
                    </div>
                </form>`;
        container.innerHTML = html;
        const element = container.querySelector('input[type="range"]');
        const sliderInstance = { id: `${pluginName$4}-${index2}`, spec, element };
        sliderInstances.push(sliderInstance);
      }
      const instances = sliderInstances.map((sliderInstance) => {
        var _a;
        const { element, spec } = sliderInstance;
        const valueSpan = (_a = element.parentElement) == null ? void 0 : _a.querySelector(".vega-bind-value");
        const initialSignals = [{
          name: spec.variableId,
          value: spec.value || spec.min,
          priority: 1,
          isData: false
        }];
        return {
          ...sliderInstance,
          initialSignals,
          receiveBatch: async (batch) => {
            if (batch[spec.variableId]) {
              const value = batch[spec.variableId].value;
              element.value = value.toString();
              if (valueSpan) {
                valueSpan.textContent = value.toString();
              }
            }
          },
          beginListening() {
            const updateValue = (e) => {
              const value = parseFloat(e.target.value);
              if (valueSpan) {
                valueSpan.textContent = value.toString();
              }
              const batch = {
                [spec.variableId]: {
                  value,
                  isData: false
                }
              };
              signalBus.broadcast(sliderInstance.id, batch);
            };
            element.addEventListener("input", updateValue);
            element.addEventListener("change", updateValue);
          },
          getCurrentSignalValue: () => {
            return parseFloat(element.value);
          },
          destroy: () => {
            element.removeEventListener("input", sliderInstance.element.oninput);
            element.removeEventListener("change", sliderInstance.element.onchange);
          }
        };
      });
      return instances;
    }
  };
  function inspectTabulatorSpec(spec) {
    const flaggableSpec = {
      spec
    };
    return flaggableSpec;
  }
  const pluginName$3 = "tabulator";
  const className$3 = pluginClassName(pluginName$3);
  const tabulatorPlugin = {
    ...flaggablePlugin(pluginName$3, className$3, inspectTabulatorSpec, { style: "box-sizing: border-box;" }),
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const { signalBus } = renderer;
      const tabulatorInstances = [];
      const deleteFieldname = newId();
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        if (!container) {
          continue;
        }
        const spec = specReview.approvedSpec;
        const buttons = spec.editable ? `<div class="tabulator-buttons">
                        <button type="button" class="tabulator-add-row">Add Row</button>
                        <button type="button" class="tabulator-reset">Reset</button>
                   </div>` : "";
        container.innerHTML = `<div class="tabulator-parent">
                <div class="tabulator-nested"></div>
                ${buttons}
            </div>`;
        const nestedDiv = container.querySelector(".tabulator-nested");
        if (!Tabulator && index2 === 0) {
          errorHandler(new Error("Tabulator not found"), pluginName$3, index2, "init", container);
          continue;
        }
        if (!spec.dataSourceName) {
          errorHandler(new Error("Tabulator requires dataSourceName"), pluginName$3, index2, "init", container);
          continue;
        } else if (spec.dataSourceName === spec.variableId) {
          errorHandler(new Error("Tabulator dataSourceName and variableId cannot be the same"), pluginName$3, index2, "init", container);
          continue;
        }
        let options = {
          autoColumns: true,
          layout: "fitColumns",
          maxHeight: "200px"
        };
        if (spec.tabulatorOptions && Object.keys(spec.tabulatorOptions).length > 0) {
          options = spec.tabulatorOptions;
        }
        const selectableRows = !!(options == null ? void 0 : options.selectableRows) || false;
        if (spec.editable && selectableRows) {
          delete options.selectableRows;
        }
        const table = new Tabulator(nestedDiv, options);
        const tabulatorInstance = {
          id: `${pluginName$3}-${index2}`,
          spec,
          container,
          table,
          built: false,
          selectableRows,
          listening: false
        };
        table.on("tableBuilt", () => {
          table.off("tableBuilt");
          tabulatorInstance.built = true;
        });
        tabulatorInstances.push(tabulatorInstance);
      }
      const instances = tabulatorInstances.map((tabulatorInstance, index2) => {
        const { container, spec, table, selectableRows } = tabulatorInstance;
        const initialSignals = [{
          name: spec.dataSourceName,
          value: null,
          priority: -1,
          isData: true
        }];
        if (selectableRows || spec.editable) {
          initialSignals.push({
            name: spec.variableId,
            value: [],
            priority: -1,
            isData: true
          });
        }
        const outputData = () => {
          if (!spec.variableId) {
            return;
          }
          let data;
          if (selectableRows) {
            data = table.getSelectedData();
          } else {
            data = table.getData();
          }
          data.forEach((row) => {
            delete row[deleteFieldname];
          });
          const batch = {
            [spec.variableId]: {
              value: data,
              isData: true
            }
          };
          signalBus.log(tabulatorInstance.id, "sending batch", batch);
          signalBus.broadcast(tabulatorInstance.id, batch);
        };
        const setData = (_data) => {
          const data = structuredClone(_data);
          table.setData(data).then(() => {
            let columns = table.getColumnDefinitions().filter((cd) => cd.field !== deleteFieldname).filter((cd) => cd.formatter !== "rowSelection");
            if (spec.editable) {
              columns.unshift({
                headerSort: false,
                title: "Delete",
                field: deleteFieldname,
                titleFormatter: "tickCross",
                width: 40,
                formatter: "tickCross",
                cellClick: (e, cell) => {
                  cell.getRow().delete();
                  outputData();
                }
              });
              columns = columns.map((col) => {
                if (col.editor === void 0) {
                  const type = col.type || col.sorter;
                  if (type === "number") {
                    return { ...col, editor: "number" };
                  }
                  if (type === "date" || type === "datetime") {
                    return { ...col, editor: "date" };
                  }
                  if (type === "boolean") {
                    return { ...col, editor: "tickCross" };
                  }
                  return { ...col, editor: "input" };
                }
                return col;
              });
            }
            table.setColumns(columns);
            if (tabulatorInstance.listening) {
              outputData();
            }
          }).catch((error) => {
            console.error(`Error setting data for Tabulator ${spec.variableId}:`, error);
          });
        };
        if (spec.editable) {
          const addRowBtn = container.querySelector(".tabulator-add-row");
          const resetBtn = container.querySelector(".tabulator-reset");
          if (addRowBtn) {
            addRowBtn.onclick = () => {
              table.addRow({}).then((row) => {
                row.scrollTo();
              });
            };
          }
          if (resetBtn) {
            resetBtn.onclick = () => {
              const value = signalBus.signalDeps[spec.dataSourceName].value;
              if (Array.isArray(value)) {
                setData(value);
              }
            };
          }
        }
        return {
          ...tabulatorInstance,
          initialSignals,
          receiveBatch: async (batch, from) => {
            var _a;
            const newData = (_a = batch[spec.dataSourceName]) == null ? void 0 : _a.value;
            if (newData) {
              if (!tabulatorInstance.built) {
                table.off("tableBuilt");
                table.on("tableBuilt", () => {
                  tabulatorInstance.built = true;
                  table.off("tableBuilt");
                  setData(newData);
                });
              } else {
                setData(newData);
              }
            }
          },
          beginListening(sharedSignals) {
            tabulatorInstance.listening = true;
            if (tabulatorInstance.built) {
              outputData();
            }
            if (selectableRows) {
              const hasMatchingSignal = sharedSignals.some(
                ({ isData, signalName }) => isData && signalName === spec.variableId
              );
              if (hasMatchingSignal) {
                table.on("rowSelectionChanged", (e, rows) => {
                  outputData();
                });
              }
            }
            if (spec.editable) {
              table.on("cellEdited", (cell) => {
                outputData();
              });
              table.on("rowMoved", (row) => {
                outputData();
              });
            }
          },
          getCurrentSignalValue() {
            if (selectableRows) {
              return tabulatorInstance.table.getSelectedData();
            } else {
              return tabulatorInstance.table.getData();
            }
          },
          destroy: () => {
            tabulatorInstance.table.destroy();
          }
        };
      });
      return instances;
    }
  };
  const pluginName$2 = "textbox";
  const className$2 = pluginClassName(pluginName$2);
  const textboxPlugin = {
    ...flaggablePlugin(pluginName$2, className$2),
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const { signalBus } = renderer;
      const textboxInstances = [];
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        const spec = specReview.approvedSpec;
        const placeholderAttr = spec.placeholder ? ` placeholder="${spec.placeholder}"` : "";
        const inputElement = spec.multiline ? `<textarea class="vega-bind-text" id="${spec.variableId}" name="${spec.variableId}"${placeholderAttr}>${spec.value || ""}</textarea>` : `<input type="text" class="vega-bind-text" id="${spec.variableId}" name="${spec.variableId}" value="${spec.value || ""}"${placeholderAttr} />`;
        const html = `<form class="vega-bindings">
                    <div class="vega-bind">
                        <label>
                            <span class="vega-bind-name">${spec.label || spec.variableId}</span>
                            ${inputElement}
                        </label>
                    </div>
                </form>`;
        container.innerHTML = html;
        const element = container.querySelector(spec.multiline ? "textarea" : 'input[type="text"]');
        const textboxInstance = { id: `${pluginName$2}-${index2}`, spec, element };
        textboxInstances.push(textboxInstance);
      }
      const instances = textboxInstances.map((textboxInstance) => {
        const { element, spec } = textboxInstance;
        const initialSignals = [{
          name: spec.variableId,
          value: spec.value || "",
          priority: 1,
          isData: false
        }];
        return {
          ...textboxInstance,
          initialSignals,
          receiveBatch: async (batch) => {
            if (batch[spec.variableId]) {
              const value = batch[spec.variableId].value;
              element.value = value;
            }
          },
          beginListening() {
            const updateValue = (e) => {
              const value = e.target.value;
              const batch = {
                [spec.variableId]: {
                  value,
                  isData: false
                }
              };
              signalBus.broadcast(textboxInstance.id, batch);
            };
            element.addEventListener("input", updateValue);
            element.addEventListener("change", updateValue);
          },
          getCurrentSignalValue: () => {
            return element.value;
          },
          destroy: () => {
            element.removeEventListener("input", textboxInstance.element.oninput);
            element.removeEventListener("change", textboxInstance.element.onchange);
          }
        };
      });
      return instances;
    }
  };
  var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
    LogLevel2[LogLevel2["none"] = 0] = "none";
    LogLevel2[LogLevel2["some"] = 1] = "some";
    LogLevel2[LogLevel2["all"] = 2] = "all";
    return LogLevel2;
  })(LogLevel || {});
  class SignalBus {
    constructor(dataSignalPrefix) {
      __publicField(this, "broadcastingStack");
      __publicField(this, "logLevel");
      __publicField(this, "logWatchIds");
      __publicField(this, "active");
      __publicField(this, "peers");
      __publicField(this, "signalDeps");
      __publicField(this, "peerDependencies");
      this.dataSignalPrefix = dataSignalPrefix;
      this.logLevel = 0;
      this.logWatchIds = [];
      this.signalDeps = {};
      this.active = false;
      this.peers = [];
      this.broadcastingStack = [];
      this.peerDependencies = {};
    }
    log(id, message, ...optionalParams) {
      if (this.logLevel === 0) return;
      if (this.logWatchIds.length > 0 && !this.logWatchIds.includes(id)) return;
      console.log(`[Signal Bus][${id}] ${message}`, ...optionalParams);
    }
    async broadcast(originId, batch) {
      if (!this.active) {
        this.log(originId, "Broadcast called but bus is not active");
        return;
      }
      if (this.broadcastingStack.includes(originId)) {
        this.log(originId, "Additional broadcast from", originId, this.broadcastingStack.join(" -> "));
      }
      this.log(originId, "Broadcasting batch from", originId, batch);
      this.broadcastingStack.push(originId);
      const peerDependencies = this.peerDependencies[originId];
      if (!peerDependencies || peerDependencies.length === 0) {
        this.log(originId, "No peers to broadcast to");
        this.broadcastingStack.pop();
        return;
      }
      for (const peerId of peerDependencies) {
        const peer = this.peers.find((p) => p.id === peerId);
        if (!peer) continue;
        const peerBatch = {};
        let hasBatch = false;
        for (const signalName in batch) {
          if (peer.initialSignals.some((s) => s.name === signalName) && batch[signalName].value !== this.signalDeps[signalName].value) {
            peerBatch[signalName] = batch[signalName];
            hasBatch = true;
          }
        }
        if (!hasBatch) continue;
        peer.receiveBatch && await peer.receiveBatch(peerBatch, originId);
      }
      this.broadcastingStack.pop();
      for (const signalName in batch) {
        const signalDep = this.signalDeps[signalName];
        signalDep.value = batch[signalName].value;
      }
      if (this.broadcastingStack.length === 0) {
        for (const peer of this.peers) {
          peer.broadcastComplete && await peer.broadcastComplete();
        }
      }
    }
    getPriorityPeer(signalName) {
      const signalDep = this.signalDeps[signalName];
      if (!signalDep) return null;
      return this.peers.find((p) => p.id === signalDep.initialPriorityId);
    }
    registerPeer(peer) {
      this.log("registerPeer", "register", peer);
      this.peers.push(peer);
      for (const initialSignal of peer.initialSignals) {
        if (!(initialSignal.name in this.signalDeps)) {
          this.signalDeps[initialSignal.name] = {
            deps: [peer],
            priority: initialSignal.priority,
            initialPriorityId: peer.id,
            value: initialSignal.value,
            isData: initialSignal.isData
          };
        } else {
          const signalDep = this.signalDeps[initialSignal.name];
          if (!signalDep.deps.includes(peer)) {
            signalDep.deps.push(peer);
          }
          if (initialSignal.priority > signalDep.priority) {
            signalDep.priority = initialSignal.priority;
            signalDep.initialPriorityId = peer.id;
            signalDep.value = initialSignal.value;
            signalDep.isData = initialSignal.isData;
          }
        }
      }
    }
    async beginListening() {
      this.active = true;
      this.log("beginListening", "begin initial batch", this.signalDeps);
      for (const peer of this.peers) {
        const batch = {};
        for (const signalName in this.signalDeps) {
          const signalDep = this.signalDeps[signalName];
          const { value, isData } = signalDep;
          batch[signalName] = { value, isData };
        }
        peer.receiveBatch && peer.receiveBatch(batch, "initial");
      }
      for (const peer of this.peers) {
        peer.broadcastComplete && await peer.broadcastComplete();
      }
      this.log("beginListening", "end initial batch");
      const peerSignals = {};
      for (const signalName in this.signalDeps) {
        const signalDep = this.signalDeps[signalName];
        if (signalDep.deps.length === 1) continue;
        for (const peer of signalDep.deps) {
          if (!(peer.id in peerSignals)) {
            peerSignals[peer.id] = [];
            this.peerDependencies[peer.id] = [];
          }
          peerSignals[peer.id].push({ signalName, isData: signalDep.isData });
          for (const otherPeer of signalDep.deps) {
            if (otherPeer.id !== peer.id && !this.peerDependencies[peer.id].includes(otherPeer.id)) {
              this.peerDependencies[peer.id].push(otherPeer.id);
            }
          }
        }
      }
      this.log("beginListening", "======= dependencies =========", peerSignals, this.peerDependencies);
      for (const peer of this.peers) {
        const sharedSignals = peerSignals[peer.id];
        if (sharedSignals) {
          this.log(peer.id, "Shared signals:", sharedSignals);
          if (this.peerDependencies[peer.id]) {
            this.log(peer.id, "Shared dependencies:", this.peerDependencies[peer.id]);
          }
          peer.beginListening && peer.beginListening(sharedSignals);
        } else {
          this.log(peer.id, "No shared signals");
        }
      }
    }
    deactivate() {
      if (this.signalDeps) {
        for (const signalName in this.signalDeps) {
          this.signalDeps[signalName].deps = [];
        }
      }
      this.active = false;
    }
  }
  const ignoredSignals = ["width", "height", "padding", "autosize", "background", "style", "parent", "datum", "item", "event", "cursor"];
  const pluginName$1 = "vega";
  const className$1 = pluginClassName(pluginName$1);
  function inspectVegaSpec(spec) {
    const flaggableSpec = {
      spec
    };
    return flaggableSpec;
  }
  const vegaPlugin = {
    ...flaggablePlugin(pluginName$1, className$1, inspectVegaSpec),
    hydrateComponent: async (renderer, errorHandler, specs) => {
      const { signalBus } = renderer;
      if (!expressionsInitialized) {
        vega.expressionFunction("encodeURIComponent", encodeURIComponent);
        expressionsInitialized = true;
      }
      const vegaInstances = [];
      const specInits = [];
      for (let index2 = 0; index2 < specs.length; index2++) {
        const specReview = specs[index2];
        if (!specReview.approvedSpec) {
          continue;
        }
        const container = renderer.element.querySelector(`#${specReview.containerId}`);
        const specInit = createSpecInit(container, index2, specReview.approvedSpec);
        if (specInit) {
          specInits.push(specInit);
        }
      }
      prioritizeSignalValues(specInits);
      for (const specInit of specInits) {
        const vegaInstance = await createVegaInstance(specInit, renderer, errorHandler);
        if (vegaInstance) {
          vegaInstances.push(vegaInstance);
        }
      }
      const dataSignals = vegaInstances.map((vegaInstance) => vegaInstance.initialSignals.filter((signal) => signal.isData)).flat();
      for (const vegaInstance of vegaInstances) {
        if (!vegaInstance.spec.data) continue;
        for (const data of vegaInstance.spec.data) {
          const dataSignal = dataSignals.find((signal) => signal.name === data.name);
          if (dataSignal) {
            vegaInstance.initialSignals.push({
              name: data.name,
              value: data.values,
              priority: data.values ? 1 : 0,
              isData: true
            });
          }
        }
      }
      const instances = vegaInstances.map((vegaInstance) => {
        const { spec, view, initialSignals } = vegaInstance;
        const startBatch = (from) => {
          if (!vegaInstance.batch) {
            signalBus.log(vegaInstance.id, "starting batch", from);
            vegaInstance.batch = {};
            view.runAfter(() => {
              const { batch } = vegaInstance;
              vegaInstance.batch = void 0;
              signalBus.log(vegaInstance.id, "sending batch", batch);
              signalBus.broadcast(vegaInstance.id, batch);
            });
          }
        };
        return {
          ...vegaInstance,
          initialSignals,
          receiveBatch: async (batch, from) => {
            signalBus.log(vegaInstance.id, "received batch", batch, from);
            return new Promise((resolve) => {
              view.runAfter(async () => {
                if (receiveBatch(batch, signalBus, vegaInstance)) {
                  signalBus.log(vegaInstance.id, "running after _pulse, changes from", from);
                  vegaInstance.needToRun = true;
                } else {
                  signalBus.log(vegaInstance.id, "no changes");
                }
                signalBus.log(vegaInstance.id, "running view after _pulse finished");
                resolve();
              });
            });
          },
          broadcastComplete: async () => {
            signalBus.log(vegaInstance.id, "broadcastComplete");
            if (vegaInstance.needToRun) {
              view.runAfter(() => {
                view.runAsync();
                vegaInstance.needToRun = false;
                signalBus.log(vegaInstance.id, "running view after broadcastComplete");
              });
            }
          },
          beginListening: (sharedSignals) => {
            var _a, _b, _c;
            for (const { isData, signalName } of sharedSignals) {
              if (ignoredSignals.includes(signalName)) return;
              if (isData) {
                const matchData = (_a = spec.data) == null ? void 0 : _a.find((data) => data.name === signalName);
                if (matchData && vegaInstance.dataSignals.includes(matchData.name)) {
                  signalBus.log(vegaInstance.id, "listening to data", signalName);
                  if (signalBus.signalDeps[signalName].value === void 0 && ((_b = view.data(signalName)) == null ? void 0 : _b.length) > 0) {
                    signalBus.log(vegaInstance.id, "un-initialized", signalName);
                    const batch = {};
                    batch[signalName] = { value: view.data(signalName), isData: true };
                    signalBus.broadcast(vegaInstance.id, batch);
                  }
                  view.addDataListener(signalName, async (name, value) => {
                    startBatch(`data:${signalName}`);
                    vegaInstance.batch[name] = { value, isData };
                  });
                }
              }
              const matchSignal = (_c = spec.signals) == null ? void 0 : _c.find((signal) => signal.name === signalName);
              if (matchSignal) {
                const isChangeSource = matchSignal.on || // event streams
                matchSignal.bind || // ui elements
                matchSignal.update;
                if (isChangeSource) {
                  signalBus.log(vegaInstance.id, "listening to signal", signalName);
                  view.addSignalListener(signalName, async (name, value) => {
                    startBatch(`signal:${signalName}`);
                    vegaInstance.batch[name] = { value, isData };
                  });
                }
              }
            }
          },
          getCurrentSignalValue: (signalName) => {
            var _a;
            const matchSignal = (_a = spec.signals) == null ? void 0 : _a.find((signal) => signal.name === signalName);
            if (matchSignal) {
              return view.signal(signalName);
            } else {
              return void 0;
            }
          },
          destroy: () => {
            vegaInstance.view.finalize();
          }
        };
      });
      return instances;
    }
  };
  function receiveBatch(batch, signalBus, vegaInstance) {
    var _a, _b;
    const { spec, view } = vegaInstance;
    const doLog = signalBus.logLevel === LogLevel.all;
    doLog && signalBus.log(vegaInstance.id, "receiveBatch", batch);
    let hasAnyChange = false;
    for (const signalName in batch) {
      const batchItem = batch[signalName];
      if (ignoredSignals.includes(signalName)) {
        doLog && signalBus.log(vegaInstance.id, "ignoring reserved signal name", signalName, batchItem.value);
        continue;
      }
      if (batchItem.isData) {
        let logReason2;
        if (!batchItem.value) {
          logReason2 = "not updating data, no value";
        } else {
          const matchData = (_a = spec.data) == null ? void 0 : _a.find((data) => data.name === signalName);
          if (!matchData) {
            logReason2 = "not updating data, no match";
          } else {
            logReason2 = "updating data";
            view.change(signalName, vega.changeset().remove(() => true).insert(batchItem.value));
            hasAnyChange = true;
          }
        }
        doLog && signalBus.log(vegaInstance.id, `(isData) ${logReason2}`, signalName, batchItem.value);
      }
      let logReason = "";
      const matchSignal = (_b = spec.signals) == null ? void 0 : _b.find((signal) => signal.name === signalName);
      if (!matchSignal) {
        logReason = "not updating signal, no match";
      } else {
        if (matchSignal.update) {
          logReason = "not updating signal, it is a calculation";
        } else {
          if (isSignalDataBridge(matchSignal)) {
            logReason = "not updating signal, data bridge";
          } else {
            const oldValue = view.signal(signalName);
            if (oldValue === batchItem.value) {
              logReason = "not updating signal, same value";
            } else {
              logReason = "updating signal";
              view.signal(signalName, batchItem.value);
              hasAnyChange = true;
            }
          }
        }
      }
      doLog && signalBus.log(vegaInstance.id, logReason, signalName, batchItem.value);
    }
    return hasAnyChange;
  }
  function createSpecInit(container, index2, spec) {
    var _a;
    const initialSignals = ((_a = spec.signals) == null ? void 0 : _a.map((signal) => {
      if (ignoredSignals.includes(signal.name)) return;
      let isData = isSignalDataBridge(signal);
      if (signal.name.startsWith(defaultCommonOptions.dataSignalPrefix)) {
        isData = true;
      }
      return {
        name: signal.name,
        value: signal.value,
        priority: signal.bind ? 1 : 0,
        isData
      };
    }).filter(Boolean)) || [];
    const specInit = { container, index: index2, initialSignals, spec };
    return specInit;
  }
  async function createVegaInstance(specInit, renderer, errorHandler) {
    const { container, index: index2, initialSignals, spec } = specInit;
    const id = `${pluginName$1}-${index2}`;
    let runtime;
    let view;
    try {
      runtime = vega.parse(spec);
    } catch (e) {
      container.innerHTML = `<div class="error">${e.toString()}</div>`;
      errorHandler(e, pluginName$1, index2, "parse", container);
      return;
    }
    try {
      view = new vega.View(runtime, {
        container,
        renderer: renderer.options.vegaRenderer,
        logger: new VegaLogger((error) => {
          errorHandler(error, pluginName$1, index2, "view", container);
        })
      });
      view.run();
      for (const signal of initialSignals) {
        if (signal.isData) continue;
        const currentValue = view.signal(signal.name);
        if (currentValue !== signal.value) {
          renderer.signalBus.log(id, "re-setting initial signal", signal.name, signal.value, currentValue);
          signal.value = currentValue;
        }
      }
    } catch (e) {
      container.innerHTML = `<div class="error">${e.toString()}</div>`;
      errorHandler(e, pluginName$1, index2, "view", container);
      return;
    }
    const dataSignals = initialSignals.filter((signal) => {
      var _a;
      return signal.isData && ((_a = spec.data) == null ? void 0 : _a.some((data) => data.name === signal.name));
    }).map((signal) => signal.name);
    const instance = { ...specInit, view, id, dataSignals };
    return instance;
  }
  function isSignalDataBridge(signal) {
    return signal.update === `data('${signal.name}')`;
  }
  function prioritizeSignalValues(specInits) {
    var _a;
    const highPrioritySignals = specInits.map((specInit) => specInit.initialSignals.filter((signal) => signal.priority > 0)).flat();
    for (const specInit of specInits) {
      for (const prioritySignal of highPrioritySignals) {
        const matchSignal = (_a = specInit.spec.signals) == null ? void 0 : _a.find((signal) => signal.name === prioritySignal.name);
        if (matchSignal && matchSignal.value !== void 0 && matchSignal.value !== prioritySignal.value) {
          matchSignal.value = prioritySignal.value;
        }
      }
    }
  }
  let expressionsInitialized = false;
  class VegaLogger {
    constructor(errorHandler) {
      __publicField(this, "logLevel", 0);
      this.errorHandler = errorHandler;
      this.error = this.error.bind(this);
      this.warn = this.warn.bind(this);
      this.info = this.info.bind(this);
      this.debug = this.debug.bind(this);
    }
    level(level) {
      if (level === void 0) {
        return this.logLevel;
      }
      this.logLevel = level;
      return this;
    }
    error(...args) {
      if (this.errorHandler) {
        this.errorHandler(args[0]);
      }
      if (this.logLevel >= 1) {
        console.error(...args);
      }
      return this;
    }
    warn(...args) {
      if (this.logLevel >= 2) {
        console.warn(...args);
      }
      return this;
    }
    info(...args) {
      if (this.logLevel >= 3) {
        console.info(...args);
      }
      return this;
    }
    debug(...args) {
      if (this.logLevel >= 4) {
        console.debug(...args);
      }
      return this;
    }
  }
  const pluginName = "vega-lite";
  const className = pluginClassName(pluginName);
  const vegaLitePlugin = {
    ...flaggablePlugin(pluginName, className),
    fence: (token, index2) => {
      let content = token.content.trim();
      let spec;
      let flaggableSpec;
      const info = token.info.trim();
      const isYaml = info.startsWith("yaml ");
      const formatName = isYaml ? "YAML" : "JSON";
      try {
        if (isYaml) {
          spec = yaml__namespace.load(content);
        } else {
          spec = JSON.parse(content);
        }
      } catch (e) {
        flaggableSpec = {
          spec: null,
          hasFlags: true,
          reasons: [`malformed ${formatName}`]
        };
      }
      if (spec) {
        try {
          const vegaSpec = vegaLite.compile(spec);
          flaggableSpec = inspectVegaSpec(vegaSpec.spec);
        } catch (e) {
          flaggableSpec = {
            spec: null,
            hasFlags: true,
            reasons: [`failed to compile vega spec`]
          };
        }
      }
      if (flaggableSpec) {
        content = JSON.stringify(flaggableSpec);
      }
      return sanitizedHTML("div", { class: pluginClassName(vegaPlugin.name), id: `${pluginName}-${index2}` }, content, true);
    },
    hydratesBefore: vegaPlugin.name
  };
  function registerNativePlugins() {
    registerMarkdownPlugin(checkboxPlugin);
    registerMarkdownPlugin(commentPlugin);
    registerMarkdownPlugin(cssPlugin);
    registerMarkdownPlugin(googleFontsPlugin);
    registerMarkdownPlugin(dropdownPlugin);
    registerMarkdownPlugin(imagePlugin);
    registerMarkdownPlugin(mermaidPlugin);
    registerMarkdownPlugin(placeholdersPlugin);
    registerMarkdownPlugin(presetsPlugin);
    registerMarkdownPlugin(sliderPlugin);
    registerMarkdownPlugin(tabulatorPlugin);
    registerMarkdownPlugin(textboxPlugin);
    registerMarkdownPlugin(vegaLitePlugin);
    registerMarkdownPlugin(vegaPlugin);
  }
  const defaultRendererOptions = {
    vegaRenderer: "canvas",
    useShadowDom: false,
    openLinksInNewTab: true,
    errorHandler: (error, pluginName2, instanceIndex, phase) => {
      console.error(`Error in plugin ${pluginName2} instance ${instanceIndex} phase ${phase}`, error);
    }
  };
  class Renderer {
    constructor(_element, options) {
      __publicField(this, "md");
      __publicField(this, "instances");
      __publicField(this, "signalBus");
      __publicField(this, "options");
      __publicField(this, "shadowRoot");
      __publicField(this, "element");
      this.options = { ...defaultRendererOptions, ...options };
      this.signalBus = new SignalBus(defaultCommonOptions.dataSignalPrefix);
      this.instances = {};
      if (this.options.useShadowDom) {
        this.shadowRoot = _element.attachShadow({ mode: "open" });
        this.element = this.shadowRoot;
      } else {
        this.element = _element;
      }
    }
    ensureMd() {
      if (!this.md) {
        this.md = create();
        if (this.options.openLinksInNewTab) {
          const defaultRender = this.md.renderer.rules.link_open || function(tokens, idx, options, env, self2) {
            return self2.renderToken(tokens, idx, options);
          };
          this.md.renderer.rules.link_open = function(tokens, idx, options, env, self2) {
            const token = tokens[idx];
            const targetIndex = token.attrIndex("target");
            if (targetIndex < 0) {
              token.attrPush(["target", "_blank"]);
            } else {
              token.attrs[targetIndex][1] = "_blank";
            }
            const relIndex = token.attrIndex("rel");
            if (relIndex < 0) {
              token.attrPush(["rel", "noopener noreferrer"]);
            } else {
              token.attrs[relIndex][1] = "noopener noreferrer";
            }
            return defaultRender(tokens, idx, options, env, self2);
          };
        }
      }
    }
    async render(markdown) {
      this.reset();
      const html = this.renderHtml(markdown);
      this.element.innerHTML = html;
      const specs = this.hydrateSpecs();
      await this.hydrate(specs);
    }
    renderHtml(markdown) {
      this.ensureMd();
      const parsedHTML = this.md.render(markdown);
      let content = parsedHTML;
      if (this.options.useShadowDom) {
        content = `<div class="body">${content}</div>`;
      }
      return content;
    }
    hydrateSpecs() {
      this.ensureMd();
      const specs = [];
      this.signalBus.log("Renderer", "hydrate specs");
      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (plugin.hydrateSpecs) {
          specs.push(...plugin.hydrateSpecs(this, this.options.errorHandler));
        }
      }
      return specs;
    }
    async hydrate(specs) {
      this.ensureMd();
      this.signalBus.log("Renderer", "hydrate components");
      const hydrationPromises = [];
      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (plugin.hydrateComponent) {
          const specsForPlugin = specs.filter((spec) => spec.pluginName === plugin.name);
          hydrationPromises.push(plugin.hydrateComponent(this, this.options.errorHandler, specsForPlugin).then((instances) => {
            return {
              pluginName: plugin.name,
              instances
            };
          }));
        }
      }
      try {
        const pluginHydrations = await Promise.all(hydrationPromises);
        for (const hydration of pluginHydrations) {
          if (hydration && hydration.instances) {
            this.instances[hydration.pluginName] = hydration.instances;
            for (const instance of hydration.instances) {
              this.signalBus.registerPeer(instance);
            }
          }
        }
        await this.signalBus.beginListening();
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 0);
      } catch (error) {
        console.error("Error in rendering plugins", error);
      }
    }
    reset() {
      this.signalBus.deactivate();
      this.signalBus = new SignalBus(defaultCommonOptions.dataSignalPrefix);
      for (const pluginName2 of Object.keys(this.instances)) {
        const instances = this.instances[pluginName2];
        for (const instance of instances) {
          instance.destroy && instance.destroy();
        }
      }
      this.instances = {};
      this.element.innerHTML = "";
    }
  }
  registerNativePlugins();
  const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Renderer,
    plugins,
    registerMarkdownPlugin,
    sanitizedHTML,
    setCssTree,
    setDomDocument,
    setMarkdownIt
  }, Symbol.toStringTag, { value: "Module" }));
  exports2.common = index$1;
  exports2.markdown = index;
  Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
}));
