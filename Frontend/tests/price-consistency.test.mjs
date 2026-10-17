/**
 * Price consistency: Admin/database value === storefront value.
 *
 * The Admin panel and the database are the single source of truth for product
 * prices. These tests pin the rule that the storefront renders that exact
 * number — no FX conversion, no re-scaling, no rounding multiplier — so a
 * regression like "Admin shows 42, storefront shows 3,486" cannot come back.
 */
import { test, before, describe } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { formatPrice, formatINRNumber, CURRENCY_SYMBOL } from "../src/utils/formatPrice.js";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE
} from "../src/utils/shopConfig.js";
import { HOME_DATA, PRODUCTS } from "./support/catalogFixture.js";

/* ── jsdom environment ── */
let dom;
let container;
let root;

before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
    url: "http://localhost/"
  });
  const expose = (name, value) =>
    Object.defineProperty(global, name, { value, configurable: true, writable: true });

  expose("window", dom.window);
  expose("document", dom.window.document);
  expose("navigator", dom.window.navigator);
  expose("HTMLElement", dom.window.HTMLElement);
  expose("Element", dom.window.Element);
  expose("Node", dom.window.Node);
  expose("Event", dom.window.Event);
  expose("MouseEvent", dom.window.MouseEvent);
  expose("getComputedStyle", dom.window.getComputedStyle);
  expose("requestAnimationFrame", dom.window.requestAnimationFrame);
  expose("cancelAnimationFrame", dom.window.cancelAnimationFrame);
  global.IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(dom.window, "innerWidth", { value: 1440, configurable: true, writable: true });
  dom.window.localStorage.clear();

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

const { buildCollectionTree } = await import("./support/.build/entry.mjs");

const rendered = (selector) => [...container.querySelectorAll(selector)].map((n) => n.textContent.trim());

/* ══════════════════════════════════════════════════════════════
   The formatter itself
   ══════════════════════════════════════════════════════════════ */
describe("formatPrice renders the stored Admin/database amount verbatim", () => {
  test("a whole-number price is displayed unscaled", () => {
    assert.equal(formatPrice(42), "₹42");
    // The old behaviour multiplied by 83 and would have produced ₹3,486 here.
    assert.notEqual(formatPrice(42), "₹3,486");
  });

  test("prices are grouped in the Indian lakh/crore style", () => {
    assert.equal(formatPrice(1234), "₹1,234");
    assert.equal(formatPrice(1234567), "₹12,34,567");
  });

  test("paise are preserved rather than rounded away", () => {
    assert.equal(formatPrice(42.5), "₹42.5");
    assert.equal(formatPrice(42.55), "₹42.55");
  });

  test("null, undefined and empty stay empty", () => {
    assert.equal(formatPrice(null), "");
    assert.equal(formatPrice(undefined), "");
    assert.equal(formatPrice(""), "");
  });

  test("numeric strings are accepted", () => {
    assert.equal(formatPrice("42"), "₹42");
  });

  test("the bare number helper and symbol are consistent", () => {
    assert.equal(CURRENCY_SYMBOL, "₹");
    assert.equal(formatINRNumber(1234567), "12,34,567");
  });
});

/* ══════════════════════════════════════════════════════════════
   Shipping money shares the same unit as catalogue prices
   ══════════════════════════════════════════════════════════════ */
describe("shipping amounts use the same unit as catalogue prices", () => {
  test("the thresholds are plain amounts, not FX rates", () => {
    assert.equal(FREE_SHIPPING_THRESHOLD, Infinity);
    assert.equal(SHIPPING_FEE, 60);
  });

  test("they render through the same formatter as product prices", () => {
    assert.equal(formatPrice(FREE_SHIPPING_THRESHOLD), "");
    assert.equal(formatPrice(SHIPPING_FEE), "₹60");
  });
});

/* ══════════════════════════════════════════════════════════════
   Rendered catalogue
   ══════════════════════════════════════════════════════════════ */
describe("rendered product cards show the Admin/database price", () => {
  test("every card price matches its product's stored price", async () => {
    await act(async () => {
      root.render(
        buildCollectionTree({ url: "/collection?category=mens", homeData: HOME_DATA, allProducts: PRODUCTS })
      );
    });

    const cards = [...container.querySelectorAll(".coll-product-grid .product-card")];
    assert.ok(cards.length > 0, "the mens grid rendered at least one card");

    for (const card of cards) {
      const name = card.querySelector(".product-name")?.textContent.trim();
      const shown = card.querySelector(".price-current")?.textContent.trim();
      const product = PRODUCTS.find((p) => p.name === name);
      assert.ok(product, `card "${name}" maps to a catalog product`);
      assert.equal(shown, formatPrice(product.price), `price for "${name}"`);
    }
  });

  test("a discounted card shows both the sale price and the MRP", async () => {
    // "Mens Hoodies" is the only mens product with a different MRP in the fixture.
    await act(async () => {
      root.render(
        buildCollectionTree({ url: "/collection?category=mens", homeData: HOME_DATA, allProducts: PRODUCTS })
      );
    });

    const hoodie = [...container.querySelectorAll(".coll-product-grid .product-card")].find((c) =>
      c.querySelector(".price-original")
    );
    assert.ok(hoodie, "at least one card renders a strikethrough comparison price");

    const name = hoodie.querySelector(".product-name").textContent.trim();
    const product = PRODUCTS.find((p) => p.name === name);
    assert.equal(hoodie.querySelector(".price-current").textContent.trim(), formatPrice(product.price));
    assert.equal(hoodie.querySelector(".price-original").textContent.trim(), formatPrice(product.originalPrice));
    assert.ok(
      Number(product.originalPrice) > Number(product.price),
      "fixture MRP is a genuine discount"
    );
  });

  test("no card renders a price inflated by an FX multiplier", async () => {
    await act(async () => {
      root.render(
        buildCollectionTree({ url: "/collection?category=mens", homeData: HOME_DATA, allProducts: PRODUCTS })
      );
    });

    const shown = rendered(".coll-product-grid .price-current").map((t) => Number(t.replace(/[^\d.]/g, "")));
    const stored = PRODUCTS.filter((p) => p.category === "mens").map((p) => Number(p.price));

    for (const value of shown) {
      assert.ok(
        stored.includes(value),
        `rendered ${value} is one of the stored Admin prices (${stored.join(", ")})`
      );
    }
  });

  test("an empty catalogue renders no prices at all", async () => {
    // Regression guard: the store used to seed its catalogue from the static
    // `data/products.js` list, so hard-coded prices were visible before (and
    // without) the API. The Admin/DB is the only price source now.
    await act(async () => {
      root.render(buildCollectionTree({ url: "/collection?category=mens", homeData: HOME_DATA, allProducts: [] }));
    });

    assert.deepEqual(rendered(".price-current"), [], "no card shows a price before the API responds");
    assert.deepEqual(rendered(".price-original"), []);
  });
});
