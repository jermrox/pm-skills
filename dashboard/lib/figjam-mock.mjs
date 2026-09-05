// A mock Figma Plugin API for FigJam that ENFORCES the rules the real API
// enforces at runtime, so a generated script can be executed and checked
// offline. Every throw here corresponds to a documented failure mode in the
// figma-use-figjam skill, not an invented constraint.

class MockNode {
  constructor(type, api) {
    this.type = type;
    this.id = `${api._nextId++}:1`;
    this.parent = null;
    this._x = 0;
    this._y = 0;
    this.width = 0;
    this.height = 0;
    this.name = '';
    this._api = api;
    this._positionedBeforeParent = false;
  }
  set x(v) {
    if (this.parent === null && this._api._sectionsExist) this._positionedBeforeParent = true;
    this._x = v;
  }
  get x() { return this._x; }
  set y(v) { this._y = v; }
  get y() { return this._y; }
  remove() {
    this._removed = true;
    const i = this._api.nodes.indexOf(this);
    if (i !== -1) this._api.nodes.splice(i, 1);
    const j = this._api.shapes.indexOf(this);
    if (j !== -1) this._api.shapes.splice(j, 1);
  }
}

class MockText extends MockNode {
  constructor(api) {
    super('TEXT', api);
    this._fontLoaded = false;
    this._fontName = { family: 'Inter', style: 'Medium' };
    this._characters = '';
    this.textAutoResize = 'WIDTH_AND_HEIGHT';
    this.width = 100;
    this.height = 24;
  }
  get fontName() { return this._fontName; }
  set fontName(f) {
    if (!this._api._loadedFonts.has(fontKey(f))) {
      throw new Error(`font "${fontKey(f)}" set on TEXT before loadFontAsync`);
    }
    this._fontName = f;
    this._fontLoaded = true;
  }
  get characters() { return this._characters; }
  set characters(v) {
    if (!this._api._loadedFonts.has(fontKey(this._fontName))) {
      throw new Error(`Cannot write to node with unloaded font "${fontKey(this._fontName)}"`);
    }
    this._characters = v;
    // Rough autosize so downstream layout math is exercised with real numbers.
    this.height = Math.max(24, Math.ceil(v.length / 60) * 24);
  }
  set fontSize(v) {
    if (!this._api._loadedFonts.has(fontKey(this._fontName))) {
      throw new Error('fontSize requires a loaded font');
    }
    this._fontSize = v;
    this.height = Math.max(this.height, v * 1.2);
  }
  get fontSize() { return this._fontSize; }
  resize(w, h) {
    if (w < 0.01 || h < 0.01) throw new Error('resize dimensions must be >= 0.01');
    this.width = w;
    this.height = h;
  }
}

class MockSection extends MockNode {
  constructor(api) {
    super('SECTION', api);
    this.children = [];
    this.width = 0.01;
    this.height = 0.01;
  }
  resize(w, h) {
    if (w < 0.01 || h < 0.01) throw new Error('section resize must be >= 0.01');
    this.width = w;
    this.height = h;
  }
  appendChild(node) {
    if (node._positionedBeforeParent) {
      throw new Error('node was positioned before appendChild; x/y are section-local after reparenting');
    }
    node.parent = this;
    this.children.push(node);
  }
}

class MockConnector extends MockNode {
  constructor(api) {
    super('CONNECTOR', api);
    // A new connector's text.fontName is invalid until explicitly set.
    const self = this;
    this.text = {
      _font: null,
      _chars: '',
      get fontName() {
        if (!self.text._font) throw new Error('connector text.fontName is invalid by default');
        return self.text._font;
      },
      set fontName(f) {
        if (!api._loadedFonts.has(fontKey(f))) throw new Error('connector font set before loadFontAsync');
        self.text._font = f;
      },
      get characters() { return self.text._chars; },
      set characters(v) {
        if (!self.text._font) throw new Error('connector text.characters set before text.fontName');
        self.text._chars = v;
      },
    };
  }
}


class MockShapeWithText extends MockNode {
  constructor(api) {
    super('SHAPE_WITH_TEXT', api);
    this._shapeType = 'ELLIPSE';
    this.width = 200;
    this.height = 120;
    const self = this;
    this.text = {
      // Real default is Inter Medium, not Regular. Code that hardcodes Regular
      // and loads only that font must still fail here.
      _font: { family: 'Inter', style: 'Medium' },
      _chars: '',
      _fills: null,
      get fontName() { return self.text._font; },
      set fontName(f) { self.text._font = f; },
      get characters() { return self.text._chars; },
      set characters(v) {
        if (!api._loadedFonts.has(fontKey(self.text._font))) {
          throw new Error(`Cannot write to shape text with unloaded font "${fontKey(self.text._font)}"`);
        }
        self.text._chars = v;
      },
      get fills() { return self.text._fills; },
      set fills(v) { self.text._fills = v; },
    };
  }
  get shapeType() { return this._shapeType; }
  set shapeType(v) { this._shapeType = v; }
  resize(w, h) {
    if (w < 0.01 || h < 0.01) throw new Error('shape resize must be >= 0.01');
    this.width = w;
    this.height = h;
  }
}

const fontKey = (f) => `${f.family} ${f.style}`;

export function createMockFigma() {
  const api = {
    _nextId: 1,
    _loadedFonts: new Set(),
    _sectionsExist: false,
    _closed: 0,
    nodes: [],
    connectors: [],
    shapes: [],
    async loadFontAsync(f) {
      if (!f || !f.family || !f.style) throw new Error('loadFontAsync needs {family, style}');
      api._loadedFonts.add(fontKey(f));
    },
    createSection() {
      const n = new MockSection(api);
      api._sectionsExist = true;
      api.nodes.push(n);
      return n;
    },
    createText() {
      const n = new MockText(api);
      api.nodes.push(n);
      return n;
    },
    createSticky() {
      const n = new MockNode('STICKY', api);
      n.width = 240;
      n.height = 240;
      api.nodes.push(n);
      return n;
    },
    createConnector() {
      const n = new MockConnector(api);
      api.connectors.push(n);
      return n;
    },
    createShapeWithText() {
      const n = new MockShapeWithText(api);
      api.nodes.push(n);
      api.shapes.push(n);
      return n;
    },
    closePlugin() { api._closed += 1; },
  };
  // FigJam has no createPage; calling it throws in the real API.
  Object.defineProperty(api, 'createPage', {
    get() { throw new TypeError("figma.createPage no such property 'createPage' on the figma global object"); },
  });
  return api;
}

/** Execute a generated Plugin API script against the mock. Returns the script's
 *  own return value plus the recorded state. */
export async function runPluginScript(script, figma) {
  // eslint-disable-next-line no-new-func
  const fn = new Function('figma', `return (${script.trim().replace(/;\s*$/, '')});`);
  const result = await fn(figma);
  return { result, figma };
}

/** Colors must use hex/255 notation exactly; a rounded decimal makes FigJam
 *  treat the color as "custom" rather than a palette match. */
export function assertExactPaletteChannels(script) {
  const bad = [];
  // (?<![\w.]) so `push(` and similar identifiers ending in h are not matched.
  const re = /(?<![\w.])h\(([^)]*)\)/g;
  for (const m of script.matchAll(re)) {
    const args = m[1].split(',').map((s) => s.trim());
    if (args.length !== 3) continue;
    for (const a of args) {
      if (!/^0x[0-9a-fA-F]{2}$/.test(a) && !/^\d+$/.test(a)) bad.push(m[0]);
    }
  }
  return [...new Set(bad)];
}
