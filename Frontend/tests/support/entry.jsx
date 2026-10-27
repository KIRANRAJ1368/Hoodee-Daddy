import React from "react";
import { MemoryRouter } from "react-router-dom";
import {
  MensCategoriesSection,
  WomensCategoriesSection,
  BoysCategoriesSection,
  GirlsCategoriesSection,
  BabiesCategoriesSection
} from "../../src/components/CategoryShowcase/CategoryFeatureGrid";
import Collection from "../../src/pages/Collection";
import Navbar from "../../src/components/Navbar/Navbar";
import Hero from "../../src/components/Hero/Hero";
import { __setShop } from "./mockShopContext.js";

export const SECTION_COMPONENTS = {
  mens: MensCategoriesSection,
  women: WomensCategoriesSection,
  boys: BoysCategoriesSection,
  girls: GirlsCategoriesSection,
  babies: BabiesCategoriesSection
};

const SECTIONS = [
  { section_key: "mens_categories", config: { categorySlug: "mens" } },
  { section_key: "womens_categories", config: { categorySlug: "women" } },
  { section_key: "boys_categories", config: { categorySlug: "boys" } },
  { section_key: "girls_categories", config: { categorySlug: "girls" } },
  { section_key: "babies_categories", config: { categorySlug: "babies" } }
];

/**
 * Builds a ready-to-mount element for one department section.
 * `subcategories` is the fixture list for that category; `visibleCount` marks
 * which of them the admin left enabled.
 */
export function buildSectionTree({ section, categories, subcategories = [], visibleCount }) {
  const enabled = new Set(subcategories.slice(0, visibleCount).map((s) => s.id));
  const homeData = {
    sections: SECTIONS,
    categories: [
      {
        slug: section,
        name: section,
        is_active: true,
        show_on_homepage: true,
        subcategories: subcategories.map((s) => ({
          ...s,
          show_on_homepage: enabled.has(s.id)
        }))
      }
    ]
  };

  __setShop({ homeData, allProducts: [] });

  const Component = SECTION_COMPONENTS[section];
  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Component />
    </MemoryRouter>
  );
}

/** Builds N fixture subcategories for a category. */
export function makeSubcategories(section, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${section}-sub-${i + 1}`,
    name: `${section.toUpperCase()} Item ${i + 1}`,
    slug: `${section}-item-${i + 1}`,
    image_url: `/images/sub-${i + 1}.jpg`,
    image_position: "center top",
    is_active: true
  }));
}

export { __setShop };

/**
 * Builds a ready-to-mount element for the /collection page at a given URL.
 * `homeData.categories[].subcategories` is what the page resolves ?type= against.
 *
 * The key forces React to remount MemoryRouter when the URL changes, otherwise
 * react-router keeps its previous location and the page never re-reads the query.
 */
export function buildCollectionTree({ url, homeData, allProducts }) {
  __setShop({ homeData, allProducts });
  return (
    <MemoryRouter key={url} initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Collection />
    </MemoryRouter>
  );
}

/** Builds a ready-to-mount element for the header, for link inspection. */
export function buildNavbarTree({ url = "/", homeData, allProducts = [] }) {
  __setShop({ homeData, allProducts });
  return (
    <MemoryRouter key={url} initialEntries={[url]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
    </MemoryRouter>
  );
}

/** Builds the storefront hero against a real-shaped Admin homepage payload. */
export function buildHeroTree({ homeData, allProducts = [] }) {
  __setShop({ homeData, allProducts });
  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Hero />
    </MemoryRouter>
  );
}
export { default as FirstVisitModal } from "../../src/components/Modals/FirstVisitModal";
export { storefrontApi } from "../../src/services/storefrontApi";

export { default as AddressReminder } from "../../src/components/Modals/AddressReminder";
export { default as Checkout } from "../../src/pages/Checkout";
export { checkoutVisitorFields } from "../../src/utils/visitorAccess";
