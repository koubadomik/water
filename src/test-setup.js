// localStorage polyfill for non-jsdom test workers
if (typeof localStorage === 'undefined') {
  let store = {}
  global.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { store = {} },
  }
}
