import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { HOME_DATA, PRODUCTS, CATEGORIES, expectedProducts } from "./support/catalogFixture.js";

/* ── jsdom environment ── */
let dom;
let container;
let root;

before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://localhost/" });
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

const { buildCollectionTree, buildNavbarTree, buildHeroTree } = await import("./support/.build/entry.mjs");

after(async () => {
  if (root) await act(async () => root.unmount());
});

async function mountCollection(url, products = PRODUCTS) {
  await act(async () => {
    root.render(buildCollectionTree({ url, homeData: HOME_DATA, allProducts: products }));
  });
  return {
    banner: () => container.querySelector("#collection-hero"),
    bannerImages: () => [...container.querySelectorAll("img")].filter((i) => /banner|hero/i.test(i.getAttribute("src") || "")),
    trail: () => container.querySelector(".coll-subcat-trail"),
    trailCurrent: () => container.querySelector(".coll-subcat-trail-current")?.textContent,
    cards: () => [...container.querySelectorAll(".coll-product-grid .product-card, .coll-product-grid a")],
    count: () => container.querySelector(".coll-toolbar-count")?.textContent,
    sortLabel: () => container.querySelector(".coll-sort-trigger-label")?.textContent,
    loadMore: () => [...container.querySelectorAll("button")].find((b) => /load more/i.test(b.textContent)),
    chips: () => [...container.querySelectorAll(".coll-chip")].map((c) => c.textContent),
    emptyState: () => Boolean(container.querySelector(".coll-empty, .coll-no-results"))
  };
}

/** Product names currently rendered in the grid, in DOM order. */
function renderedNames() {
  return [...container.querySelectorAll(".coll-product-grid .product-card .product-name")].map((n) =>
    n.textContent.trim()
  );
}

const q = (value) => `/collection?category=mens&type=${encodeURIComponent(value)}`;

/* ══════════════════════════════════════════════════════════════
   The expected flow: dropdown -> subcategory -> products
   ══════════════════════════════════════════════════════════════ */
describe("Category dropdown -> subcategory -> product listing", () => {
  test("every dropdown subcategory link points at a subcategory listing", async () => {
    await act(async () => {
      root.render(buildNavbarTree({ homeData: HOME_DATA, allProducts: PRODUCTS }));
    });

    // Walk the expandable category toggles in the mobile drawer
    const toggles = [...container.querySelectorAll(".mobile-nav-expand-toggle")];
    assert.equal(toggles.length, 5, "one dropdown/toggle per department with subcategories");

    for (const toggle of toggles) {
      await act(async () => {
        toggle.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
      });
    }

    const subLinks = [...container.querySelectorAll(".mobile-nav-submenu a")].filter(
      (a) => !a.textContent.includes("Shop all")
    );
    const hrefs = subLinks.map((a) => a.getAttribute("href"));

    assert.ok(hrefs.length > 0, "the header must render subcategory links");
    hrefs.forEach((href) => {
      assert.match(
        href,
        /^\/(categories\/[a-z0-9_-]+\/[a-z0-9_-]+|collection\?category=[a-z]+&type=.+)/,
        `bad subcategory link: ${href}`
      );
    });

    // One link per subcategory per department, all unique.
    const expectedCount = CATEGORIES.reduce((n, c) => n + c.subcategories.length, 0);
    assert.equal(hrefs.length, expectedCount, `expected ${expectedCount} subcategory links`);
    assert.equal(new Set(hrefs).size, hrefs.length, "subcategory links must be unique");
  });

  test("clicking each dropdown link shows only that subcategory's products", async () => {
    for (const category of CATEGORIES) {
      for (const sub of category.subcategories) {
        const view = await mountCollection(
          `/collection?category=${category.slug}&type=${encodeURIComponent(sub.name)}`
        );

        const shown = renderedNames();
        const expected = expectedProducts(category.slug, sub.name).map((p) => p.name);

        assert.deepEqual(
          shown.slice(0, expected.length).sort(),
          [...expected].sort(),
          `${category.slug}/${sub.name}: rendered products differ from the subcategory's products`
        );
        shown.forEach((name) => {
          const product = PRODUCTS.find((p) => p.name === name);
          assert.equal(
            product.subCategory,
            sub.name,
            `${category.slug}/${sub.name}: "${name}" belongs to "${product.subCategory}"`
          );
          assert.equal(product.category, category.slug, `${category.slug}/${sub.name}: "${name}" is from ${product.category}`);
        });
      }
    }
  });

  test("the same subcategory name in another department does not bleed across", async () => {
    // "Round Neck" exists under mens, women, boys and girls.
    const boys = await mountCollection("/collection?category=boys&type=round%20neck");
    const boysNames = renderedNames();
    const girls = await mountCollection("/collection?category=girls&type=round%20neck");
    const girlsNames = renderedNames();

    assert.deepEqual(boysNames, expectedProducts("boys", "Round Neck").map((p) => p.name));
    assert.deepEqual(girlsNames, expectedProducts("girls", "Round Neck").map((p) => p.name));
    assert.notDeepEqual(boysNames, girlsNames, "boys and girls Round Neck must be different sets");
  });

  test("a subcategory slug resolves as well as a display name", async () => {
    // The homepage tiles link by slug; the navbar links by name.
    const bySlug = await mountCollection("/collection?category=mens&type=mens-hoodies");
    const byName = await mountCollection(q("Mens Hoodies"));
    assert.deepEqual(renderedNames(), expectedProducts("mens", "Mens Hoodies").map((p) => p.name));
    assert.equal(bySlug.trailCurrent(), "Mens Hoodies");
    assert.equal(byName.trailCurrent(), "Mens Hoodies");
  });
});

/* ══════════════════════════════════════════════════════════════
   No cross-subcategory leakage (the actual bugs)
   ══════════════════════════════════════════════════════════════ */
describe("Only the selected subcategory's products", () => {
  test("products with no subcategory never appear", async () => {
    for (const sub of CATEGORIES[0].subcategories) {
      const view = await mountCollection(`/collection?category=mens&type=${encodeURIComponent(sub.name)}`);
      const shown = renderedNames();
      PRODUCTS.filter((p) => p.category === "mens" && p.subCategory === null).forEach((unlinked) => {
        assert.ok(!shown.includes(unlinked.name), `unlinked product "${unlinked.name}" leaked into ${sub.name}`);
      });
    }
  });

  test('"T-shirt" does not drag in the "T-Shirts" product type', async () => {
    // babies/T-shirt and babies/Babies Pyjama both have productType "T-Shirts".
    const view = await mountCollection("/collection?category=babies&type=t-shirt");
    const shown = renderedNames();

    assert.deepEqual(shown, expectedProducts("babies", "T-shirt").map((p) => p.name));
    assert.ok(!shown.some((n) => n.includes("Pyjama")), "Babies Pyjama must not appear under T-shirt");
  });

  test("an unknown subcategory shows nothing rather than everything", async () => {
    await mountCollection("/collection?category=mens&type=does-not-exist");
    assert.equal(renderedNames().length, 0, "an unmatched subcategory must not fall back to all products");
  });

  test("an unresolvable subcategory name still filters by name", async () => {
    // Offline fallback: no home payload to resolve against.
    await act(async () => {
      root.render(buildCollectionTree({ url: q("Mens Hoodies"), homeData: null, allProducts: PRODUCTS }));
    });
    assert.deepEqual(renderedNames(), expectedProducts("mens", "Mens Hoodies").map((p) => p.name));
  });
});

/* ══════════════════════════════════════════════════════════════
   The banner
   ══════════════════════════════════════════════════════════════ */
describe("No banner on subcategory pages", () => {
  test("the banner section is absent when a subcategory is selected", async () => {
    for (const category of CATEGORIES) {
      for (const sub of category.subcategories) {
        const view = await mountCollection(
          `/collection?category=${category.slug}&type=${encodeURIComponent(sub.name)}`
        );
        assert.equal(view.banner(), null, `${category.slug}/${sub.name} must not render a banner`);
        assert.equal(view.bannerImages().length, 0, `${category.slug}/${sub.name} must not load a banner image`);
      }
    }
  });

  test("products are rendered without scrolling past a banner", async () => {
    const view = await mountCollection("/collection?category=mens&type=mens%20hoodies");
    assert.ok(view.cards().length > 0, "products must be present");
    assert.ok(view.trail(), "a breadcrumb trail replaces the banner breadcrumb");

    // The catalog is the first section on the page: nothing large precedes it.
    const firstSection = container.querySelector("section");
    assert.equal(
      firstSection?.id,
      "collection-catalog",
      "the catalog must be the first section, with no banner above it"
    );
    assert.equal(view.banner(), null);
  });

  test("category pages keep their banner and curated pages render as bannerless listings", async () => {
    assert.ok((await mountCollection("/collection?category=mens")).banner(), "category page keeps its banner");
    for (const [slug, title] of [["best-sellers", "Best Sellers"], ["new-arrivals", "New Arrivals"]]) {
      const view = await mountCollection(`/collection?collection=${slug}`);
      assert.equal(view.banner(), null, `${title} must not render a banner`);
      assert.equal(view.bannerImages().length, 0, `${title} must not load a banner image`);
      assert.equal(container.querySelector(".coll-subcat-trail-current")?.textContent, title);
      assert.ok(container.querySelector("#collection-catalog"), `${title} renders the standard catalog`);
    }
    assert.ok((await mountCollection("/collection")).banner(), "unfiltered page keeps its banner");
    assert.ok((await mountCollection("/collection?category=mens&minPrice=200")).banner(), "filters alone do not hide it");
  });

  test("Best Sellers and New Arrivals retain category and product filters", async () => {
    const curatedProducts = PRODUCTS.map((product) => ({
      ...product,
      isBestSeller: true,
      isNewArrival: true
    }));
    for (const slug of ["best-sellers", "new-arrivals"]) {
      const categoryView = await mountCollection(
        `/collection?collection=${slug}&category=mens&size=M&color=Black&minPrice=101&maxPrice=101`,
        curatedProducts
      );
      assert.deepEqual(renderedNames(), [PRODUCTS[0].name], `${slug} respects category, size, color and price filters`);

      const subcategoryView = await mountCollection(
        `/collection?collection=${slug}&category=mens&type=round-neck-t-shirt&size=M&color=Black&minPrice=101&maxPrice=101`,
        curatedProducts
      );
      assert.deepEqual(renderedNames(), [PRODUCTS[0].name], `${slug} respects the subcategory filter`);
      assert.equal(subcategoryView.banner(), null, `${slug} remains bannerless with a subcategory selected`);
    }
  });
});

/* ══════════════════════════════════════════════════════════════
   Existing functionality must be untouched
   ══════════════════════════════════════════════════════════════ */
describe("Filters, sorting and pagination still work on subcategory pages", () => {
  test("sorting via the URL is applied", async () => {
    const asc = await mountCollection("/collection?category=mens&type=mens%20hoodies&sort=price-asc");
    assert.equal(asc.sortLabel(), "Price, low to high");

    const desc = await mountCollection("/collection?category=mens&type=mens%20hoodies&sort=price-desc");
    assert.equal(desc.sortLabel(), "Price, high to low");
  });

  test("a price filter narrows the subcategory results", async () => {
    const all = expectedProducts("mens", "Mens Hoodies");
    const target = all[0].price;
    const view = await mountCollection(`/collection?category=mens&type=mens%20hoodies&minPrice=${target}`);
    const shown = renderedNames();

    assert.equal(shown.length, 1, "the price filter should cut the set to one product");
    assert.equal(shown[0], all[0].name);
    assert.ok(view.chips().some((c) => /Price/i.test(c)), "an active price chip is shown");
  });

  test("a colour filter narrows the subcategory results", async () => {
    const view = await mountCollection("/collection?category=mens&type=mens%20hoodies&color=Black");
    assert.equal(renderedNames().length, expectedProducts("mens", "Mens Hoodies").length);

    const none = await mountCollection("/collection?category=mens&type=mens%20hoodies&color=Neon");
    assert.equal(renderedNames().length, 0, "an unmatched colour empties the grid");
  });

  test("the result count reflects the subcategory", async () => {
    const view = await mountCollection("/collection?category=babies&type=romper");
    assert.equal(view.count(), "1 Product");
  });

  test("pagination reveals more products on a subcategory page", async () => {
    // 15 mens "Round Neck T-shirt"-style products, above the 12 page size.
    const many = Array.from({ length: 15 }, (_, i) => ({
      id: `m${i}`,
      name: `Round Neck Item ${i}`,
      category: "mens",
      subCategory: "Round Neck T-shirt",
      productType: "T-Shirts",
      price: 100 + i,
      originalPrice: 100 + i,
      rating: 4,
      reviewCount: 3,
      inStock: true,
      stockCount: 2,
      isBestSeller: false,
      isNewArrival: false,
      isSale: false,
      isNew: false,
      images: ["/images/x.jpg"],
      colors: [{ id: "c", name: "Black", hex: "#000" }],
      sizes: ["M"],
      createdAt: "2026-01-01T00:00:00.000Z"
    }));

    await act(async () => {
      root.render(
        buildCollectionTree({
          url: "/collection?category=mens&type=round%20neck%20t-shirt",
          homeData: HOME_DATA,
          allProducts: many
        })
      );
    });

    assert.equal(container.querySelectorAll(".coll-product-grid > *").length, 12, "first page shows 12");
    const more = [...container.querySelectorAll("button")].find((b) => /load more/i.test(b.textContent));
    assert.ok(more, "a Load More button is offered");

    await act(async () => {
      more.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
      await new Promise((r) => setTimeout(r, 450));
    });
    assert.equal(container.querySelectorAll(".coll-product-grid > *").length, 15, "all 15 load");
  });
});

describe("Admin-managed homepage hero banners", () => {
  test("active Admin hero banners render, including the legacy placement alias", async () => {
    const activeBanner = {
      id: 301,
      placement: "hero",
      title: "Admin Hero Slide",
      subtitle: "Managed from Admin",
      tag: "ZMW",
      badge_promo: "New Drop",
      image_url: "/uploads/admin-hero.jpg",
      is_active: true
    };
    const legacyBanner = { ...activeBanner, id: 302, placement: "home_hero", title: "Legacy Hero Slide" };
    const inactiveBanner = { ...activeBanner, id: 303, title: "Inactive Hero Slide", is_active: false };

    await act(async () => {
      root.render(buildHeroTree({
        homeData: { banners: { hero: [activeBanner, inactiveBanner], home_hero: [legacyBanner] } },
        allProducts: []
      }));
    });

    assert.equal(container.querySelectorAll(".hero-slide-item").length, 2);
    assert.match(container.textContent, /Admin Hero Slide/);
    assert.match(container.textContent, /Legacy Hero Slide/);
    assert.doesNotMatch(container.textContent, /Inactive Hero Slide/);
    assert.equal(container.querySelector('.hero-slide-item img[src="http://localhost:5000/uploads/admin-hero.jpg"]') !== null, true);
  });
});
