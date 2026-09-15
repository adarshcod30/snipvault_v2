/**
 * In-memory snippet store.
 *
 * `findById` does a plain integer lookup. A non-integer id is simply "not
 * found": no query text is built, no driver error is surfaced, nothing about
 * the storage layer leaks to the client.
 */
let seq = 1;
const snippets = [];

function seed(title, language, code, author) {
  snippets.push({ id: seq++, title, language, code, author, createdAt: new Date().toISOString() });
}

seed('Debounce in JS', 'javascript',
  'const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };',
  'admin');
seed('Flatten a list', 'python',
  'flatten = lambda xs: [y for x in xs for y in (flatten(x) if isinstance(x, list) else [x])]',
  'admin');
seed('Quick HTTP server', 'bash',
  'python3 -m http.server 8000',
  'guest');

export const store = {
  all() {
    return snippets.slice().sort((a, b) => b.id - a.id);
  },

  // Integer lookup only. A bad or missing id returns null, never an error.
  findById(id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n < 1) return null;
    return snippets.find((s) => s.id === n) ?? null;
  },

  create({ title, language, code, author }) {
    const row = {
      id: seq++,
      title: String(title ?? 'untitled').slice(0, 200),
      language: String(language ?? 'text').slice(0, 40),
      code: String(code ?? '').slice(0, 20000),
      author: String(author ?? 'anonymous').slice(0, 80),
      createdAt: new Date().toISOString(),
    };
    snippets.push(row);
    return row;
  },

  remove(id) {
    const n = Number(id);
    if (!Number.isInteger(n)) return false;
    const i = snippets.findIndex((s) => s.id === n);
    if (i === -1) return false;
    snippets.splice(i, 1);
    return true;
  },

  count() {
    return snippets.length;
  },
};

export default store;
