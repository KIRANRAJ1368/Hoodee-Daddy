"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("seo_settings", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      default_meta_title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "ZMW Clothing — Luxury Pret-a-Porter & Haute Couture"
      },
      default_meta_description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      default_meta_keywords: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: "ZMW clothing, luxury fashion, couture, menswear, womenswear, premium apparel, oversized t-shirts, hoodies, streetwear, Coimbatore"
      },
      homepage_title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "ZMW Clothing — Luxury Fashion, Streetwear & Everyday Essentials"
      },
      homepage_description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      product_title_format: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "{name} | ZMW Clothing"
      },
      product_description_format: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category_title_format: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "{name} Collection — Luxury Apparel | ZMW Clothing"
      },
      category_description_format: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      canonical_base_url: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "https://zmwclothing.com"
      },
      og_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: "ZMW Clothing — Luxury Pret-a-Porter & Haute Couture"
      },
      og_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      og_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: "/images/zmw-logo.png"
      },
      robots_index: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      robots_follow: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      robots_custom_rules: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      organization_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
        defaultValue: "ZMW Clothing"
      },
      organization_telephone: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "+919876543210"
      },
      organization_email: {
        type: Sequelize.STRING(150),
        allowNull: true,
        defaultValue: "zmw@gmail.com"
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });

    // Seed initial row
    await queryInterface.bulkInsert("seo_settings", [
      {
        id: 1,
        default_meta_title: "ZMW Clothing — Luxury Pret-a-Porter & Haute Couture",
        default_meta_description: "Handcrafted luxury apparel. Natural fibres, master tailoring, and considered design. Nationwide insured dispatch.",
        default_meta_keywords: "ZMW clothing, luxury fashion, couture, menswear, womenswear, premium apparel, oversized t-shirts, hoodies, streetwear, Coimbatore",
        homepage_title: "ZMW Clothing — Luxury Fashion, Streetwear & Everyday Essentials",
        homepage_description: "Discover ZMW's luxury streetwear and couture collections. Handcrafted 240+ GSM oversized t-shirts, 450 GSM hoodies, and tailored apparel.",
        product_title_format: "{name} | ZMW Clothing",
        product_description_format: "{description}",
        category_title_format: "{name} Collection — Luxury Apparel | ZMW Clothing",
        category_description_format: "Explore the latest {name} collection at ZMW Clothing. Premium luxury fabrics, considered tailoring, and pan-India delivery.",
        canonical_base_url: "https://zmwclothing.com",
        og_title: "ZMW Clothing — Luxury Pret-a-Porter & Haute Couture",
        og_description: "Handcrafted luxury apparel. Master tailoring, considered design, and nationwide insured dispatch.",
        og_image_url: "/images/zmw-logo.png",
        robots_index: true,
        robots_follow: true,
        robots_custom_rules: "Disallow: /admin\nDisallow: /cart\nDisallow: /checkout\nDisallow: /account\nDisallow: /profile\nDisallow: /my-orders\nDisallow: /login\nDisallow: /register\nDisallow: /forgot-password\nDisallow: /reset-password",
        organization_name: "ZMW Clothing",
        organization_telephone: "+919876543210",
        organization_email: "zmw@gmail.com",
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("seo_settings");
  }
};
