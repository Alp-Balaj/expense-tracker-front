import "@testing-library/jest-dom/vitest";

// Node >=22 ships an experimental Web Storage whose localStorage shadows jsdom's
// inside the vitest environment, and without the process opting in it surfaces as
// an object whose methods are missing ("localStorage.clear is not a function").
// Tests only need functional storage, so an in-memory implementation is installed
// unconditionally — identical behavior on Node 20 (CI) and Node 25 (dev).
class MemoryStorage implements Storage {
  #store = new Map<string, string>();
  get length() {
    return this.#store.size;
  }
  clear() {
    this.#store.clear();
  }
  getItem(key: string) {
    return this.#store.has(key) ? this.#store.get(key)! : null;
  }
  key(index: number) {
    return [...this.#store.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.#store.delete(key);
  }
  setItem(key: string, value: string) {
    this.#store.set(key, String(value));
  }
}

const testLocalStorage = new MemoryStorage();
const testSessionStorage = new MemoryStorage();
for (const target of new Set<object>([globalThis, window])) {
  Object.defineProperty(target, "localStorage", {
    value: testLocalStorage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(target, "sessionStorage", {
    value: testSessionStorage,
    configurable: true,
    writable: true,
  });
}

// Radix's Select/Dropdown primitives drive their open state through Pointer
// Events and scroll the active item into view. jsdom implements neither, so
// any test that opens one throws before it can assert. These are no-op
// stand-ins purely so the components run headless.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom has no matchMedia, which use-mobile (mobile layout) and ThemeProvider
// (system theme) both call on mount. matches:false answers every query, which
// renders the desktop layout and light theme — what the existing tests assert.
// Tests that need a different answer install their own mock over this one.
if (!window.matchMedia) {
  const matchMediaStub = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
  for (const target of new Set<object>([globalThis, window])) {
    Object.defineProperty(target, "matchMedia", {
      value: matchMediaStub,
      configurable: true,
      writable: true,
    });
  }
}

// Radix's Checkbox measures itself through ResizeObserver, which jsdom also
// lacks. Nothing under test asserts on size, so an inert observer is enough.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
