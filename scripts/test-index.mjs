import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

class MockElement {
  constructor(language, kind) {
    this.dataset = kind === 'tab' ? { languageTab: language } : { languagePanel: language };
    this.hidden = false;
    this.attributes = {};
    this.listeners = {};
    this.classes = new Set(language === 'ml' && kind === 'tab' ? ['active'] : []);
    this.classList = {
      toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name)
    };
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  addEventListener(name, listener) {
    this.listeners[name] = listener;
  }
}

const tabs = [new MockElement('ml', 'tab'), new MockElement('en', 'tab')];
const panels = [new MockElement('ml', 'panel'), new MockElement('en', 'panel')];
const bodyClasses = new Set();
globalThis.window = {
  location: { search: '?lang=en', href: 'file:///site/index.html?lang=en' },
  history: { replaceState: () => {} }
};
globalThis.document = {
  documentElement: { lang: '' },
  body: { classList: { toggle: (name, enabled) => enabled ? bodyClasses.add(name) : bodyClasses.delete(name) } },
  querySelectorAll: (selector) => selector === '[data-language-tab]' ? tabs : panels
};

const indexScript = await readFile(new URL('./index.js', import.meta.url), 'utf8');
vm.runInThisContext(indexScript);

assert.equal(tabs[1].classes.has('active'), true);
assert.equal(panels[0].hidden, true);
assert.equal(panels[1].hidden, false);
assert.equal(document.documentElement.lang, 'en');

tabs[0].listeners.click({ preventDefault: () => {} });
assert.equal(tabs[0].classes.has('active'), true);
assert.equal(panels[0].hidden, false);
assert.equal(panels[1].hidden, true);

console.log('Verified the shared index language switcher.');
