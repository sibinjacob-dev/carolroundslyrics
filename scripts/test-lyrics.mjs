import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

class MockNode {
  constructor(tagName = '') {
    this.tagName = tagName;
    this.childNodes = [];
    this.className = '';
    this.hidden = false;
    this.textContent = '';
    this.classList = {
      add: (name) => { this.className = `${this.className} ${name}`.trim(); },
      toggle: (name, enabled) => {
        const names = new Set(this.className.split(/\s+/).filter(Boolean));
        enabled ? names.add(name) : names.delete(name);
        this.className = [...names].join(' ');
      }
    };
  }

  append(...nodes) {
    this.childNodes.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.childNodes = nodes;
  }
}

const dataScript = await readFile(new URL('./song-data.js', import.meta.url), 'utf8');
const lyricScript = await readFile(new URL('./lyrics.js', import.meta.url), 'utf8');

function render(search) {
  const elements = {
    '#song-title': new MockNode('h1'),
    '#lyrics-content': new MockNode('div'),
    '#lyrics-message': new MockNode('p'),
    '#lyric-view': new MockNode('main'),
    '#home-link': new MockNode('a'),
    'meta[name="description"]': new MockNode('meta')
  };

  globalThis.window = { location: { search } };
  globalThis.document = {
    body: new MockNode('body'),
    documentElement: new MockNode('html'),
    title: '',
    querySelector: (selector) => elements[selector],
    createDocumentFragment: () => new MockNode('fragment'),
    createElement: (tagName) => new MockNode(tagName),
    createTextNode: (text) => Object.assign(new MockNode('text'), { textContent: text })
  };

  vm.runInThisContext(dataScript);
  vm.runInThisContext(lyricScript);
  return { document: globalThis.document, elements };
}

const english = render('?lang=en&song=kannumkannum');
assert.equal(english.elements['#song-title'].textContent, 'Kannum Kannum Kaathirunnu');
assert.equal(english.elements['#home-link'].href, 'index.html?lang=en');
assert.equal(english.elements['#lyrics-message'].hidden, true);
assert.ok(english.elements['#lyrics-content'].childNodes.length > 0);

const malayalam = render('?lang=ml&song=aadi-aadi-paduvaan');
assert.equal(malayalam.elements['#song-title'].textContent, 'ആടി ആടി പാടുവാനായി');
assert.equal(malayalam.elements['#home-link'].href, 'index.html?lang=ml');
assert.match(malayalam.elements['#lyric-view'].className, /arima-Malayalam/);

console.log('Verified direct-file lyric rendering for English and Malayalam.');
