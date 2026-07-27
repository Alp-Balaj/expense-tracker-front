import "@testing-library/jest-dom/vitest";

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

// Radix's Checkbox measures itself through ResizeObserver, which jsdom also
// lacks. Nothing under test asserts on size, so an inert observer is enough.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
