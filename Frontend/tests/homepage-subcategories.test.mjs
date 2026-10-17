import { test, before, describe } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createRoot } from "react-dom/client";
import { act } from "react";
import {
  stepIndex,
  maxIndexFor,
  shouldShowArrows,
  shouldShowCarousel,
  visibleCountForWidth,
  trackOffset
} from "../src/utils/carouselCore.js";

/* ── jsdom environment ── */
let dom;
let container;
let root;

const DESKTOP = 1440;
const MOBILE = 390;

function setWidth(width) {
  Object.defineProperty(dom.window, "innerWidth", { value: width, configurable: true, writable: true });
  Object.defineProperty(dom.window, "outerWidth", { value: width, configurable: true, writable: true });
}

before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://localhost/" });

  // Node 22 defines some of these (notably `navigator`) as getter-only globals,
  // so plain assignment throws. defineProperty works for both cases.
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

  setWidth(DESKTOP);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

const { buildSectionTree, makeSubcategories } = await import("./support/.build/entry.mjs");

/* ── helpers ── */
async function mount(props) {
  await act(async () => {
    root.render(buildSectionTree(props));
  });
  return {
    tiles: [...container.querySelectorAll(".cat-feature-card")],
    tileNames: () => [...container.querySelectorAll(".cat-feature-name")].map((n) => n.textContent),
    arrows: () => [...container.querySelectorAll(".cat-feature-arrow")],
    isCarousel: () => Boolean(container.querySelector(".cat-feature-carousel")),
    track: () => container.querySelector(".cat-feature-carousel-track"),
    grid: () => container.querySelector(".cat-feature-grid")
  };
}

async function clickArrow(direction) {
  const btn = container.querySelector(`.cat-feature-arrow.${direction}`);
  assert.ok(btn, `expected a "${direction}" arrow to be present`);
  await act(async () => {
    btn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

const offsetOf = (view) => {
  const raw = view.track()?.style.transform || "";
  const m = raw.match(/translateX\(-([\d.]+)%\)/);
  return m ? Number(m[1]) : 0;
};

/* ══════════════════════════════════════════════════════════════
   Cases 1 & 2 & 5 — the admin "Show on Homepage" checkbox
   ══════════════════════════════════════════════════════════════ */
describe('Admin "Show on Homepage" checkbox', () => {
  test("case 1: an enabled subcategory appears on the homepage", async () => {
    const subs = makeSubcategories("boys", 5);
    const view = await mount({ section: "boys", subcategories: subs, visibleCount: 3 });

    // The first 3 are enabled, the last 2 disabled.
    assert.deepEqual(view.tileNames(), [
      "BOYS Item 1",
      "BOYS Item 2",
      "BOYS Item 3"
    ]);
    assert.ok(
      view.tileNames().includes("BOYS Item 1"),
      "the enabled subcategory must render a tile"
    );
  });

  test("case 2: a disabled subcategory does not appear on the homepage", async () => {
    const subs = makeSubcategories("boys", 5);
    const view = await mount({ section: "boys", subcategories: subs, visibleCount: 3 });

    assert.ok(!view.tileNames().includes("BOYS Item 4"), "disabled item 4 must be hidden");
    assert.ok(!view.tileNames().includes("BOYS Item 5"), "disabled item 5 must be hidden");
    assert.equal(view.tiles.length, 3, "exactly the enabled subcategories render");
  });

  test("case 2b: disabling every subcategory hides the whole row's tiles", async () => {
    const subs = makeSubcategories("girls", 6);
    const view = await mount({ section: "girls", subcategories: subs, visibleCount: 0 });

    // No enabled subcategories -> curated static fallback keeps the section
    // non-empty, but none of the database subcategories leak through.
    const names = view.tileNames();
    subs.forEach((s) => {
      assert.ok(!names.includes(s.name.toUpperCase()), `${s.name} must not render when disabled`);
    });
  });

  test("case 5: state survives a remount (refresh) without drift", async () => {
    const subs = makeSubcategories("babies", 6);
    const enabled = 5;

    const first = await mount({ section: "babies", subcategories: subs, visibleCount: enabled });
    const before = first.tileNames();

    // "Refresh" = unmount and mount again from the same stored state.
    await act(async () => {
      root.unmount();
    });
    root = createRoot(container);
    const second = await mount({ section: "babies", subcategories: subs, visibleCount: enabled });

    assert.deepEqual(second.tileNames(), before, "tiles must be identical after a refresh");
    assert.equal(second.tiles.length, enabled);
    assert.equal(second.isCarousel(), true, "5 enabled subcategories still open a carousel");
  });
});

/* ══════════════════════════════════════════════════════════════
   Cases 3 & 4 — the 4-item threshold and arrow behaviour
   ══════════════════════════════════════════════════════════════ */
describe("Carousel threshold (desktop, 4 visible)", () => {
  test("case 3: 4 or fewer items render as a plain grid with no arrows", async () => {
    for (const count of [1, 2, 3, 4]) {
      setWidth(DESKTOP);
      const subs = makeSubcategories("mens", 8);
      const view = await mount({ section: "mens", subcategories: subs, visibleCount: count });

      assert.equal(view.isCarousel(), false, `${count} items must not use a carousel`);
      assert.equal(view.arrows().length, 0, `${count} items must show no arrows`);
      assert.equal(view.tiles.length, count, `${count} items must all render`);
      assert.ok(view.grid(), `${count} items must render in the grid`);
    }
  });

  test("case 4: more than 4 items opens a carousel with both arrows", async () => {
    setWidth(DESKTOP);
    const subs = makeSubcategories("mens", 8);
    const view = await mount({ section: "mens", subcategories: subs, visibleCount: 5 });

    assert.equal(view.isCarousel(), true, "5 items must use a carousel");
    assert.equal(view.tiles.length, 5, "all 5 items stay in the DOM");
    assert.equal(view.arrows().length, 2, "exactly two arrows");

    const left = container.querySelector(".cat-feature-arrow.left");
    const right = container.querySelector(".cat-feature-arrow.right");
    assert.ok(left, "left arrow must exist");
    assert.ok(right, "right arrow must exist");
    assert.equal(left.getAttribute("aria-label"), "Previous subcategories");
    assert.equal(right.getAttribute("aria-label"), "Next subcategories");
  });

  test("case 4b: right arrow walks through every item and wraps around", async () => {
    setWidth(DESKTOP);
    const subs = makeSubcategories("mens", 7); // 7 items, 4 visible -> maxIndex 3
    const view = await mount({ section: "mens", subcategories: subs, visibleCount: 7 });
    const maxIndex = maxIndexFor(7, 4);
    assert.equal(maxIndex, 3);

    assert.equal(offsetOf(view), 0, "starts at the first slide");
    const seen = new Set([offsetOf(view)]);

    // One full lap back to the start: 0 -> 1 -> 2 -> 3 -> 0
    for (let i = 0; i < 4; i += 1) {
      await clickArrow("right");
      seen.add(offsetOf(view));
    }

    assert.deepEqual(
      [...seen].sort((a, b) => a - b),
      [0, 25, 50, 75],
      `right arrow must visit every slide, saw offsets ${[...seen]}`
    );
    assert.equal(offsetOf(view), 0, "wraps back to the first slide");
  });

  test("case 4c: left arrow walks backwards and wraps to the last slide", async () => {
    setWidth(DESKTOP);
    const subs = makeSubcategories("mens", 7);
    const view = await mount({ section: "mens", subcategories: subs, visibleCount: 7 });

    await clickArrow("left");
    assert.equal(offsetOf(view), 75, "left from the start jumps to the last slide");

    await clickArrow("left");
    assert.equal(offsetOf(view), 50);
    await clickArrow("left");
    assert.equal(offsetOf(view), 25);
    await clickArrow("left");
    assert.equal(offsetOf(view), 0, "wraps forward to the first slide");
  });

  test("case 4d: every item is reachable and no offset is skipped", async () => {
    for (const total of [5, 6, 7, 9, 12]) {
      setWidth(DESKTOP);
      const subs = makeSubcategories("mens", total);
      const view = await mount({ section: "mens", subcategories: subs, visibleCount: total });
      const maxIndex = maxIndexFor(total, 4);

      const reached = new Set();
      for (let i = 0; i <= maxIndex; i += 1) {
        reached.add(offsetOf(view));
        await clickArrow("right");
      }
      assert.equal(
        reached.size,
        maxIndex + 1,
        `${total} items: expected ${maxIndex + 1} distinct slides, reached ${reached.size}`
      );
    }
  });
});

/* ══════════════════════════════════════════════════════════════
   Case 6 — mobile
   ══════════════════════════════════════════════════════════════ */
describe("Mobile behaviour", () => {
  test("case 6: on mobile a 4-item row needs arrows to stay reachable", async () => {
    setWidth(MOBILE);
    const subs = makeSubcategories("women", 6);
    const view = await mount({ section: "women", subcategories: subs, visibleCount: 4 });

    // 2 visible on mobile -> 4 items overflow and become a carousel.
    assert.equal(view.isCarousel(), true);
    assert.equal(visibleCountForWidth(MOBILE), 2);
    assert.equal(view.arrows().length, 2, "arrows required so items 3-4 are reachable");
  });

  test("case 6b: a single item is never a carousel on any width", async () => {
    for (const width of [DESKTOP, 1024, 768, MOBILE]) {
      setWidth(width);
      const subs = makeSubcategories("women", 4);
      const view = await mount({ section: "women", subcategories: subs, visibleCount: 1 });
      assert.equal(view.isCarousel(), false, `1 item at ${width}px must not be a carousel`);
      assert.equal(view.arrows().length, 0, `1 item at ${width}px must show no arrows`);
    }
  });

  test("case 6c: mobile arrows step one item at a time", async () => {
    setWidth(MOBILE);
    const subs = makeSubcategories("women", 5);
    const view = await mount({ section: "women", subcategories: subs, visibleCount: 5 });
    const maxIndex = maxIndexFor(5, 2);
    assert.equal(maxIndex, 3);

    const seen = [];
    for (let i = 0; i <= maxIndex; i += 1) {
      seen.push(offsetOf(view));
      await clickArrow("right");
    }
    assert.deepEqual(seen, [0, 50, 100, 150], "one full item per click on mobile");
    assert.equal(offsetOf(view), 0, "wraps back to the first item");
  });

  test("case 6d: resizing from desktop to mobile re-evaluates the arrows", async () => {
    setWidth(DESKTOP);
    const subs = makeSubcategories("girls", 4);
    const view = await mount({ section: "girls", subcategories: subs, visibleCount: 4 });
    assert.equal(view.arrows().length, 0, "4 items on a wide desktop needs no arrows");

    setWidth(MOBILE);
    await act(async () => {
      dom.window.dispatchEvent(new dom.window.Event("resize"));
    });
    assert.equal(view.arrows().length, 2, "the same 4 items now need arrows on mobile");
  });
});

/* ══════════════════════════════════════════════════════════════
   Pure carousel arithmetic
   ══════════════════════════════════════════════════════════════ */
describe("carouselCore", () => {
  test("visibleCountForWidth matches the static grid breakpoints", () => {
    assert.equal(visibleCountForWidth(1920), 4);
    assert.equal(visibleCountForWidth(1440), 4);
    assert.equal(visibleCountForWidth(1201), 4);
    assert.equal(visibleCountForWidth(1200), 4);
    assert.equal(visibleCountForWidth(1024), 3);
    assert.equal(visibleCountForWidth(769), 2);
    assert.equal(visibleCountForWidth(768), 2);
    assert.equal(visibleCountForWidth(390), 2);
  });

  test("maxIndexFor never goes negative", () => {
    assert.equal(maxIndexFor(4, 4), 0);
    assert.equal(maxIndexFor(2, 4), 0);
    assert.equal(maxIndexFor(0, 4), 0);
    assert.equal(maxIndexFor(5, 4), 1);
    assert.equal(maxIndexFor(7, 4), 3);
    assert.equal(maxIndexFor(12, 4), 8);
  });

  test("stepIndex covers the whole range in both directions", () => {
    const total = 12;
    const visible = 4;
    const max = maxIndexFor(total, visible);
    assert.equal(max, 8);

    const forward = [];
    let i = 0;
    for (let n = 0; n <= max + 1; n += 1) {
      forward.push(i);
      i = stepIndex(i, 1, max);
    }
    assert.deepEqual(forward, [0, 1, 2, 3, 4, 5, 6, 7, 8, 0]);
    assert.equal(new Set(forward).size, max + 1, "every slide is reachable going forward");

    const backward = [];
    i = 0;
    for (let n = 0; n <= max + 1; n += 1) {
      backward.push(i);
      i = stepIndex(i, -1, max);
    }
    assert.deepEqual(backward, [0, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
  });

  test("stepIndex is inert when everything fits", () => {
    assert.equal(stepIndex(0, 1, 0), 0);
    assert.equal(stepIndex(0, -1, 0), 0);
  });

  test("arrows appear only past the visible count", () => {
    assert.equal(shouldShowArrows(4, 4), false);
    assert.equal(shouldShowArrows(5, 4), true);
    assert.equal(shouldShowArrows(3, 4), false);
    assert.equal(shouldShowArrows(1, 1), false);
    assert.equal(shouldShowCarousel(4, 4), false);
    assert.equal(shouldShowCarousel(5, 4), true);
  });

  test("trackOffset converts an index into a percentage", () => {
    assert.equal(trackOffset(0, 4), 0);
    assert.equal(trackOffset(1, 4), 25);
    assert.equal(trackOffset(3, 4), 75);
    assert.equal(trackOffset(1, 1), 100);
    assert.equal(trackOffset(0, 0), 0);
  });
});
