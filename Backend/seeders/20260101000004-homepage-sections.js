"use strict";

const SECTIONS = [
  { section_key: "hero", title: null, subtitle: null, sort_order: 0, config: null },
  {
    section_key: "new_arrivals",
    title: "New Arrivals",
    subtitle: "Fresh off the line",
    sort_order: 1,
    config: { limit: 8 }
  },
  {
    section_key: "mens_categories",
    title: "Men's Edit",
    subtitle: "Oversized tees, polos & hoodies",
    sort_order: 2,
    config: { categorySlug: "mens" }
  },
  {
    section_key: "womens_categories",
    title: "Women's Edit",
    subtitle: "Round neck, V-neck, tees & hoodies",
    sort_order: 3,
    config: { categorySlug: "women" }
  },
  {
    section_key: "boys_categories",
    title: "Boys' Edit",
    subtitle: "Skate tees, sets & shorts",
    sort_order: 4,
    config: { categorySlug: "boys" }
  },
  {
    section_key: "girls_categories",
    title: "Girls' Edit",
    subtitle: "Dresses, sets & pretty tees",
    sort_order: 5,
    config: { categorySlug: "girls" }
  },
  {
    section_key: "babies_categories",
    title: "Babies' Edit",
    subtitle: "Rompers, pyjamas & soft knits",
    sort_order: 6,
    config: { categorySlug: "babies" }
  },
  {
    section_key: "best_sellers",
    title: "Best Sellers",
    subtitle: "Loved by 1 Lakh+ streetwear enthusiasts",
    sort_order: 7,
    config: { limit: 8 }
  },
  {
    section_key: "category_visuals",
    title: "Explore by Department",
    subtitle: "Shop the edit made for every member of the family",
    sort_order: 8,
    config: null
  },
  { section_key: "newsletter", title: null, subtitle: null, sort_order: 9, config: null },
  { section_key: "instagram_showcase", title: "HooDee Daddy on Instagram", subtitle: null, sort_order: 10, config: null }
];

module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query("SELECT id FROM homepage_sections LIMIT 1");
    if (existing.length > 0) {
      console.log("Homepage sections already seeded — skipping.");
      return;
    }

    const now = new Date();
    await queryInterface.bulkInsert(
      "homepage_sections",
      SECTIONS.map((s) => ({
        section_key: s.section_key,
        title: s.title,
        subtitle: s.subtitle,
        is_active: true,
        sort_order: s.sort_order,
        config: s.config ? JSON.stringify(s.config) : null,
        created_at: now,
        updated_at: now
      }))
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("homepage_sections", null);
  }
};
