import { test, before, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

let dom, React, act, createRoot, Gate, api, root, container, requests;
const key = "zmw_visitor_details";
const originalFetch = global.fetch;
const details = { phone: "9876543210", pincode: "641004", savedAt: "2026-10-24T10:00:00Z" };

before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { url: "http://localhost/", pretendToBeVisual: true });
  for (const name of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) {
    Object.defineProperty(global, name, { value: typeof dom.window[name] === "function" && ["getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"].includes(name) ? dom.window[name].bind(dom.window) : dom.window[name], configurable: true, writable: true });
  }
  global.IS_REACT_ACT_ENVIRONMENT = true;
  React = await import("react");
  act = React.act;
  ({ createRoot } = await import("react-dom/client"));
  const entry = await import("./support/.build/entry.mjs");
  Gate = entry.FirstVisitModal;
  api = entry.storefrontApi;
});

beforeEach(() => {
  window.localStorage.clear(); window.sessionStorage.clear(); requests = 0;
  global.fetch = async () => ({ ok: true, json: async () => [{ Status: "Success", PostOffice: [{ District: "Coimbatore", State: "Tamil Nadu" }] }] });
  api.submitFirstVisitLead = async payload => { requests++; return { id: 42, ...payload, is_existing: false }; };
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); global.fetch = originalFetch; });
const render = () => act(async () => root.render(React.createElement(Gate, null, React.createElement("main", { id: "store-content" }, "Storefront"))));
async function input(id, value) {
  await act(async () => {
    const e = container.querySelector(id);
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(e, value);
    e.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}
async function submit() { await act(async () => container.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }))); }
async function fill() { await input("#fvm-phone", details.phone); await input("#fvm-pincode", details.pincode); }

test("first visit blocks all storefront content immediately, with no skip/close or Escape/backdrop bypass", async () => {
  window.sessionStorage.setItem("zmw_first_visit_dismissed", "true");
  window.sessionStorage.setItem("zmw_visitor_guest", "true");
  await render();
  assert.ok(container.querySelector('[role="dialog"]'));
  assert.equal(container.querySelector("#store-content"), null);
  assert.equal(container.querySelectorAll("button").length, 1);
  await act(async () => {
    container.querySelector('[role="dialog"]').dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    container.querySelector(".fvm-backdrop").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  });
  assert.ok(container.querySelector("form"));
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal(document.activeElement.id, "fvm-phone");
});

test("invalid fields stay gated and cannot call the save endpoint", async () => {
  await render(); await submit();
  assert.equal(container.querySelectorAll('[aria-invalid="true"]').length, 2);
  assert.equal(requests, 0);
  await input("#fvm-phone", "1234567890"); await input("#fvm-pincode", "000000"); await submit();
  assert.equal(requests, 0);
  assert.equal(window.localStorage.getItem(key), null);
});

test("network failure keeps the form, retains entered values, and never unlocks or stores success", async () => {
  api.submitFirstVisitLead = async () => { throw new Error("Network unavailable. Please retry."); };
  await render(); await fill(); await submit();
  assert.match(container.querySelector('[role="alert"]').textContent, /Network unavailable/);
  assert.equal(container.querySelector("#fvm-phone").value, details.phone);
  assert.equal(container.querySelector("#store-content"), null);
  assert.equal(window.localStorage.getItem(key), null);
});

test("successful registration persists and a later tab opens directly without the gate", async () => {
  await render(); await fill(); await submit();
  assert.match(container.textContent, /You're all set/i);
  assert.equal(JSON.parse(window.localStorage.getItem(key)).phone, details.phone);
  await act(async () => new Promise(resolve => setTimeout(resolve, 1150)));
  assert.ok(container.querySelector("#store-content"));
  await act(async () => root.unmount()); root = createRoot(container);
  window.sessionStorage.clear(); await render();
  assert.equal(container.querySelector('[role="dialog"]'), null);
  assert.ok(container.querySelector("#store-content"));
});

test("clearing site data asks again and an existing mobile receives Welcome back", async () => {
  window.localStorage.setItem(key, JSON.stringify(details)); await render();
  assert.ok(container.querySelector("#store-content"));
  await act(async () => { window.localStorage.clear(); window.dispatchEvent(new window.StorageEvent("storage", { key: null })); });
  assert.ok(container.querySelector("form"));
  assert.equal(container.querySelector("#store-content"), null);
  api.submitFirstVisitLead = async payload => ({ id: 42, ...payload, is_existing: true });
  await fill(); await submit();
  assert.match(container.textContent, /Welcome back/i);
  await act(async () => new Promise(resolve => setTimeout(resolve, 1150)));
  assert.ok(container.querySelector("#store-content"));
});

test("corrupted or incomplete remembered details cannot bypass the entry form", async () => {
  window.localStorage.setItem(key, '{broken'); await render();
  assert.ok(container.querySelector("form"));
  await act(async () => root.unmount()); root = createRoot(container);
  window.localStorage.setItem(key, JSON.stringify({ phone: details.phone })); await render();
  assert.ok(container.querySelector("form"));
});

test("keyboard focus cycles inside the entry dialog", async () => {
  await render(); const button = container.querySelector('button[type="submit"]');
  await act(async () => { button.focus(); button.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })); });
  assert.equal(document.activeElement.id, "fvm-phone");
  await act(async () => document.activeElement.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })));
  assert.equal(document.activeElement, button);
});
