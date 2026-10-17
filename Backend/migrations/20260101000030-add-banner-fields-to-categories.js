"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("categories");

    const columnsToAdd = [
      { name: "banner_image_url", def: { type: Sequelize.STRING(255), allowNull: true } },
      { name: "banner_image_position", def: { type: Sequelize.STRING(80), allowNull: true, defaultValue: "center center" } },
      { name: "banner_tag", def: { type: Sequelize.STRING(150), allowNull: true } },
      { name: "banner_title", def: { type: Sequelize.STRING(150), allowNull: true } },
      { name: "banner_subtitle", def: { type: Sequelize.TEXT, allowNull: true } },
      { name: "banner_badge_promo", def: { type: Sequelize.STRING(100), allowNull: true } },
      { name: "banner_primary_cta_text", def: { type: Sequelize.STRING(80), allowNull: true, defaultValue: "Shop Now" } },
      { name: "banner_secondary_cta_text", def: { type: Sequelize.STRING(80), allowNull: true } }
    ];

    for (const col of columnsToAdd) {
      if (!tableInfo[col.name]) {
        await queryInterface.addColumn("categories", col.name, col.def);
      }
    }

    // Populate existing category banner attributes from existing banners table
    try {
      const [banners] = await queryInterface.sequelize.query(
        "SELECT placement, tag, title, subtitle, badge_promo, image_url, image_position, primary_cta_text, secondary_cta_text FROM banners WHERE placement NOT IN ('hero', 'offers')"
      );

      for (const b of banners) {
        const catSlug = b.placement;
        await queryInterface.sequelize.query(
          `UPDATE categories SET 
            banner_image_url = :image_url,
            banner_image_position = :image_position,
            banner_tag = :tag,
            banner_title = :title,
            banner_subtitle = :subtitle,
            banner_badge_promo = :badge_promo,
            banner_primary_cta_text = :primary_cta_text,
            banner_secondary_cta_text = :secondary_cta_text
          WHERE slug = :slug OR (slug = 'mens' AND :slug = 'men') OR (slug = 'women' AND :slug = 'womens')`,
          {
            replacements: {
              image_url: b.image_url,
              image_position: b.image_position || "center center",
              tag: b.tag,
              title: b.title,
              subtitle: b.subtitle,
              badge_promo: b.badge_promo,
              primary_cta_text: b.primary_cta_text || "Shop Now",
              secondary_cta_text: b.secondary_cta_text || "",
              slug: catSlug
            }
          }
        );
      }
    } catch (err) {
      console.warn("Notice: could not copy banners to categories during migration:", err.message);
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable("categories");
    const cols = [
      "banner_image_url",
      "banner_image_position",
      "banner_tag",
      "banner_title",
      "banner_subtitle",
      "banner_badge_promo",
      "banner_primary_cta_text",
      "banner_secondary_cta_text"
    ];
    for (const col of cols) {
      if (tableInfo[col]) {
        await queryInterface.removeColumn("categories", col);
      }
    }
  }
};
