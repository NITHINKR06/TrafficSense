/*
 * TrafficSense design runtime
 * Renders the design files in a plain browser: {{holes}}, <sc-for>, <sc-if>,
 * <dc-import>, event handlers, setState. Elements are reused between renders,
 * so CSS transitions and animations behave exactly as in the design canvas.
 */
(function () {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var defs = {};
  var roots = [];

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    schedule();
  };
  DCLogic.prototype.forceUpdate = function () { schedule(); };
  DCLogic.prototype.renderVals = function () { return {}; };

  function define(name, factory, templateId) {
    defs[name] = { cls: factory(DCLogic), tpl: document.getElementById(templateId) };
  }

  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    Promise.resolve().then(function () { pending = false; roots.forEach(function (r) { r.render(); }); });
  }

  /* ---- value lookup ---- */
  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  var WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
  function interp(str, scope) {
    return str.replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_, p) {
      var v = lookup(scope, p);
      return v == null ? '' : String(v);
    });
  }
  function camel(s) { return s.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); }); }

  /* ---- component instances ---- */
  function Instance(name, props, mountFn) {
    var d = defs[name];
    if (!d) throw new Error('Unknown component ' + name);
    this.name = name;
    this.def = d;
    this.logic = new d.cls(props);
    this.logic.props = props;
    this.children = {};
    this.mounted = false;
  }
  Instance.prototype.renderNodes = function (props) {
    if (props) this.logic.props = props;
    var vals = this.logic.renderVals() || {};
    var ctx = { inst: this, counters: {} };
    return renderChildren(this.def.tpl.content.childNodes, vals, false, ctx);
  };

  function renderChildren(nodes, scope, inSvg, ctx) {
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var r = renderNode(nodes[i], scope, inSvg, ctx);
      for (var j = 0; j < r.length; j++) out.push(r[j]);
    }
    return out;
  }

  function renderNode(node, scope, inSvg, ctx) {
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      if (t.indexOf('{{') === -1) return [document.createTextNode(t)];
      return [document.createTextNode(interp(t, scope))];
    }
    if (node.nodeType !== 1) return [];
    var tag = node.localName;
    if (tag === 'sc-for') {
      var m = WHOLE.exec(node.getAttribute('list') || '');
      var list = m ? lookup(scope, m[1]) : null;
      var as = node.getAttribute('as') || 'item';
      var res = [];
      (list || []).forEach(function (item, idx) {
        var s = Object.create(scope);
        s[as] = item; s.$index = idx;
        res = res.concat(renderChildren(node.childNodes, s, inSvg, ctx));
      });
      return res;
    }
    if (tag === 'sc-if') {
      var mi = WHOLE.exec(node.getAttribute('value') || '');
      var v = mi ? lookup(scope, mi[1]) : node.getAttribute('value');
      return v ? renderChildren(node.childNodes, scope, inSvg, ctx) : [];
    }
    if (tag === 'dc-import') {
      var name = node.getAttribute('name');
      var props = {};
      for (var a = 0; a < node.attributes.length; a++) {
        var at = node.attributes[a];
        if (at.name === 'name' || at.name.indexOf('hint-') === 0) continue;
        var mw = WHOLE.exec(at.value);
        props[camel(at.name)] = mw ? lookup(scope, mw[1]) : interp(at.value, scope);
      }
      var key = name + '#' + (ctx.counters[name] = (ctx.counters[name] || 0) + 1);
      var child = ctx.inst.children[key];
      if (!child) { child = new Instance(name, props); ctx.inst.children[key] = child; }
      child.seen = true;
      return child.renderNodes(props);
    }
    var svg = node.namespaceURI === SVG_NS;
    var el = svg ? document.createElementNS(SVG_NS, node.localName) : document.createElement(tag);
    for (var k = 0; k < node.attributes.length; k++) {
      var attr = node.attributes[k];
      var nm = attr.name, val = attr.value;
      var whole = WHOLE.exec(val);
      if (nm.indexOf('on') === 0 && whole) {
        var fn = lookup(scope, whole[1]);
        if (typeof fn === 'function') { el.__h = el.__h || {}; el.__h[nm.slice(2).toLowerCase()] = fn; }
        continue;
      }
      if (whole) {
        var raw = lookup(scope, whole[1]);
        if (raw === false || raw == null) continue;
        if (raw === true) { el.setAttribute(nm, nm === 'disabled' ? '' : 'true'); continue; }
        el.setAttribute(nm, String(raw));
      } else {
        el.setAttribute(nm, val.indexOf('{{') === -1 ? val : interp(val, scope));
      }
    }
    var kids = renderChildren(node.childNodes, scope, svg, ctx);
    for (var c = 0; c < kids.length; c++) el.appendChild(kids[c]);
    return [el];
  }

  /* ---- DOM morphing: keep elements so transitions run ---- */
  function bindHandlers(target, src) {
    var h = src.__h || null;
    target.__h = h;
    if (!h) return;
    Object.keys(h).forEach(function (type) {
      target.__bound = target.__bound || {};
      if (!target.__bound[type]) {
        target.__bound[type] = true;
        target.addEventListener(type, function (e) { if (target.__h && target.__h[type]) target.__h[type](e); });
      }
    });
  }
  function morphAttrs(a, b) {
    var i;
    for (i = a.attributes.length - 1; i >= 0; i--) {
      var n = a.attributes[i].name;
      if (!b.hasAttribute(n)) a.removeAttribute(n);
    }
    for (i = 0; i < b.attributes.length; i++) {
      var at = b.attributes[i];
      if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    }
  }
  function same(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType === 1) return a.namespaceURI === b.namespaceURI && a.tagName === b.tagName;
    return true;
  }
  function morphChildren(parent, next) {
    var cur = Array.prototype.slice.call(parent.childNodes);
    var n = Math.max(cur.length, next.length);
    for (var i = 0; i < n; i++) {
      var a = cur[i], b = next[i];
      if (!b) { parent.removeChild(a); continue; }
      if (!a) { attachAll(b); parent.appendChild(b); continue; }
      if (!same(a, b)) { attachAll(b); parent.replaceChild(b, a); continue; }
      if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; continue; }
      if (a.nodeType === 1) {
        morphAttrs(a, b);
        bindHandlers(a, b);
        morphChildren(a, Array.prototype.slice.call(b.childNodes));
      }
    }
  }
  function attachAll(node) {
    if (node.nodeType !== 1) return;
    if (node.__h) { var h = node.__h; node.__h = null; bindHandlers(node, { __h: h }); }
    for (var i = 0; i < node.childNodes.length; i++) attachAll(node.childNodes[i]);
  }

  function walkMount(inst) {
    Object.keys(inst.children).forEach(function (k) { walkMount(inst.children[k]); });
    if (!inst.mounted) {
      inst.mounted = true;
      if (typeof inst.logic.componentDidMount === 'function') inst.logic.componentDidMount();
    }
  }

  function mount(name, container) {
    var inst = new Instance(name, {});
    var root = {
      render: function () {
        var nodes = inst.renderNodes();
        morphChildren(container, nodes);
        walkMount(inst);
      }
    };
    roots.push(root);
    root.render();
  }

  window.TS = { define: define, mount: mount, DCLogic: DCLogic };
})();
