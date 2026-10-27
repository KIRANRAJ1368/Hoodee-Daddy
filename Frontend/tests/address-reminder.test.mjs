import { test, before, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

let React, act, createRoot, Reminder, Checkout, entry, root, container;
const key = "zmw_visitor_details";
const base = () => ({ phone: "9876543210", pincode: "641004", district: "Coimbatore", state: "Tamil Nadu", savedAt: new Date().toISOString() });
const read = () => JSON.parse(window.localStorage.getItem(key));
before(async () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
  for (const name of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MutationObserver"]) {
    Object.defineProperty(global, name, { value: dom.window[name], configurable: true, writable: true });
  }
  window.scrollTo = () => {};
  global.IS_REACT_ACT_ENVIRONMENT = true;
  React = await import("react"); act = React.act;
  ({ createRoot } = await import("react-dom/client"));
  entry = await import("./support/.build/entry.mjs");
  Reminder = entry.AddressReminder; Checkout = entry.Checkout;
});
beforeEach(t => {
  window.localStorage.clear();
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: new Date("2026-10-24T10:00:00Z") });
  window.localStorage.setItem(key, JSON.stringify(base()));
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const render = props => act(async () => root.render(React.createElement(Reminder, props)));
const tick = (t, ms) => act(async () => t.mock.timers.tick(ms));
const later = () => act(async () => container.querySelector(".address-reminder-later").click());
const submit = () => act(async () => container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
async function input(name, value) {
  await act(async () => {
    const element = container.querySelector('input[name="' + name + '"]');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

test("first reminder waits 5m (300s), dismissal permanently stops, no 30s/60s triggers", async t => {
  await render(); await tick(t, 299999);
  assert.equal(container.querySelector('[role="dialog"]'), null);
  await tick(t, 1); assert.ok(container.querySelector('[role="dialog"]'));
  assert.equal(read().addressReminder.count, 1);
  await later();
  assert.equal(container.querySelector('[role="dialog"]'), null);
  assert.equal(read().addressReminder.status, "dismissed");
  // Ensure no retry at 60s or beyond
  await tick(t, 600000);
  assert.equal(container.querySelector('[role="dialog"]'), null);
  await act(async () => root.unmount()); root = createRoot(container);
  await render(); await tick(t, 600000); assert.equal(container.querySelector('[role="dialog"]'), null);
});

test("reload preserves 5m deadline and never shows again after single display", async t => {
  await render(); await tick(t, 150000);
  await act(async () => root.unmount()); root = createRoot(container);
  await render(); await tick(t, 149999); assert.equal(container.querySelector('[role="dialog"]'), null);
  await tick(t, 1); assert.equal(read().addressReminder.count, 1);
  await later();
  assert.equal(read().addressReminder.status, "dismissed");
  await act(async () => root.unmount()); root = createRoot(container);
  await render(); await tick(t, 600000); assert.equal(container.querySelector('[role="dialog"]'), null);
});

test("saving valid address retains phone/PIN, fills checkout data and stops prompts", async t => {
  await render(); await tick(t, 300000);
  await input("fullName", "Harish Kumar"); await input("address", "12 Main Street");
  await input("apartment", "Near the park");
  await submit();
  assert.equal(container.querySelector('[role="dialog"]'), null);
  assert.deepEqual(entry.checkoutVisitorFields(), {
    fullName: "Harish Kumar", address: "12 Main Street", apartment: "Near the park",
    city: "Coimbatore", state: "Tamil Nadu", postalCode: "641004", phone: "9876543210"
  });
  await tick(t, 600000); assert.equal(container.querySelector('[role="dialog"]'), null);
});

test("invalid address stays open and does not save; storage failure reports error", async t => {
  await render(); await tick(t, 300000); await submit();
  assert.ok(container.querySelector('[role="alert"]')); assert.equal(read().address, undefined);
  await input("fullName", "Harish"); await input("address", "12 Main Street");
  t.mock.method(window.Storage.prototype, "setItem", () => { throw new Error("Storage blocked"); });
  await submit();
  assert.match(container.querySelector('[role="alert"]').textContent, /Unable to save/);
  assert.ok(container.querySelector('[role="dialog"]'));
});

test("checkout/login pause overdue prompts and resume without losing the schedule", async t => {
  await render({ paused: true }); await tick(t, 350000);
  assert.equal(container.querySelector('[role="dialog"]'), null);
  await render({ paused: false }); await tick(t, 0);
  assert.ok(container.querySelector('[role="dialog"]'));
  await render({ paused: true }); assert.equal(container.querySelector('[role="dialog"]'), null);
  await render({ paused: false }); assert.ok(container.querySelector('[role="dialog"]'));
});

test("already saved address and missing visitor never get reminders", async t => {
  window.localStorage.setItem(key, JSON.stringify({ ...base(), fullName: "Harish", address: "12 Main Street", city: "Coimbatore" }));
  await render(); await tick(t, 600000); assert.equal(container.querySelector('[role="dialog"]'), null);
  await act(async () => { window.localStorage.clear(); window.dispatchEvent(new window.StorageEvent("storage", { key: null })); });
  await tick(t, 600000); assert.equal(container.querySelector('[role="dialog"]'), null);
});

test("Escape counts as dismissal and stops permanently", async t => {
  await render(); await tick(t, 300000);
  const first = container.querySelector("input"), last = container.querySelector(".address-reminder-later");
  assert.equal(document.activeElement, first);
  await act(async () => { first.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })); });
  assert.equal(document.activeElement, last);
  await act(async () => last.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  assert.equal(container.querySelector('[role="dialog"]'), null);
  assert.equal(read().addressReminder.status, "dismissed");
  await tick(t, 600000); assert.equal(container.querySelector('[role="dialog"]'), null);
});

test("saved popup details appear in actual checkout delivery inputs", async t => {
  window.localStorage.setItem(key, JSON.stringify({ ...base(), fullName: "Harish Kumar", address: "12 Main Street", apartment: "Near park", city: "Peelamedu" }));
  entry.__setShop({
    isCustomerAuthenticated: true, customerUser: { name: "Account Name", email: "test@example.com" },
    buyNowItems: [], cart: [{ id: 1, price: 100, quantity: 1, name: "T-shirt" }],
    cartSubtotal: 100, shippingCost: 0, cartItemCount: 1, discountAmount: 0,
    setPendingCheckout() {}, setCheckoutIntent() {}
  });
  t.mock.method(entry.storefrontApi, "availableCoupons", async () => []);
  t.mock.method(entry.storefrontApi, "calculateShippingRate", async () => ({ serviceable: true }));
  const { MemoryRouter } = await import("react-router-dom");
  await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ["/checkout"], future: { v7_startTransition: true, v7_relativeSplatPath: true } }, React.createElement(Checkout))));
  for (const [name, value] of Object.entries({ fullName: "Harish Kumar", address: "12 Main Street", apartment: "Near park", city: "Peelamedu", state: "Tamil Nadu", postalCode: "641004", phone: "9876543210" })) {
    assert.equal(container.querySelector('input[name="' + name + '"]')?.value, value, name);
  }
});

test("legacy exhausted counter without an address gets marked dismissed", async t => {
  window.localStorage.setItem(key, JSON.stringify({ ...base(), addressReminder: { count: 2, nextAt: null } }));
  await render(); await tick(t, 600000);
  assert.equal(container.querySelector('[role="dialog"]'), null);
  assert.equal(read().addressReminder.status, "dismissed");
});

test("hidden tab cannot use up a reminder; returning to it displays the due popup", async t => {
  await render();
  t.mock.getter(document, "visibilityState", () => "hidden");
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  await tick(t, 350000);
  assert.equal(read().addressReminder.count, 0);
  t.mock.restoreAll();
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  await tick(t, 0);
  assert.ok(container.querySelector('[role="dialog"]'));
  assert.equal(read().addressReminder.count, 1);
});

test("site loader must disappear before the address reminder can begin", async t => {
  const loader = document.createElement("div");
  loader.id = "zmw-loading-screen"; document.body.append(loader);
  await render(); await tick(t, 350000);
  assert.equal(container.querySelector('[role="dialog"]'), null);
  await act(async () => loader.remove());
  await tick(t, 300000);
  assert.ok(container.querySelector('[role="dialog"]'));
});
