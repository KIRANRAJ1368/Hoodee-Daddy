"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("page_meta_settings", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      page_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      page_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "custom" // 'system', 'category', 'product', 'custom'
      },
      page_slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      meta_title: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      meta_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      meta_keywords: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      canonical_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      og_image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
      }
    });

    // Seed initial System pages
    const systemPages = [
      {
        page_name: "Home (/)",
        page_type: "system",
        page_slug: "/",
        meta_title: "ZMW Clothing — Luxury Fashion, Streetwear & Everyday Essentials",
        meta_description: "Discover ZMW's luxury streetwear and couture collections. Handcrafted 240+ GSM oversized t-shirts, 450 GSM hoodies, and tailored apparel.",
        meta_keywords: "ZMW clothing, luxury fashion, couture, menswear, womenswear, premium apparel, oversized t-shirts, hoodies, streetwear, Coimbatore",
        canonical_url: "https://zmwclothing.com/",
        og_image_url: "/images/zmw-logo.png"
      },
      {
        page_name: "About Us (/about)",
        page_type: "system",
        page_slug: "/about",
        meta_title: "About Us — Luxury Fashion & Modern Streetwear Atelier | ZMW Clothing",
        meta_description: "Learn the story behind ZMW Clothing. Handcrafted natural fibres, deliberate oversized streetwear cuts, master tailoring, and ethical Indian manufacturing.",
        meta_keywords: "about ZMW, luxury clothing brand, Indian fashion atelier, Coimbatore streetwear, Tiruppur combed cotton",
        canonical_url: "https://zmwclothing.com/about",
        og_image_url: "/images/dept-family-banner.jpg"
      },
      {
        page_name: "Contact Us (/contact)",
        page_type: "system",
        page_slug: "/contact",
        meta_title: "Contact Us — Customer Concierge & Atelier Inquiries | ZMW Clothing",
        meta_description: "Reach the ZMW Clothing concierge team for sizing advice, order assistance, or wholesale inquiries. Support active Monday-Saturday in Coimbatore, Tamil Nadu.",
        meta_keywords: "contact ZMW, customer support, ZMW clothing email, phone, Coimbatore fashion store",
        canonical_url: "https://zmwclothing.com/contact",
        og_image_url: "/images/zmw-logo.png"
      },
      {
        page_name: "FAQ (/faq)",
        page_type: "system",
        page_slug: "/faq",
        meta_title: "Frequently Asked Questions (FAQ) — Orders, Shipping & Returns | ZMW Clothing",
        meta_description: "Find prompt answers regarding our premium streetwear fits, nationwide Indian logistics, easy returns, and payment options at ZMW Clothing.",
        meta_keywords: "ZMW FAQ, shipping questions, return policy, delivery times, payment options",
        canonical_url: "https://zmwclothing.com/faq",
        og_image_url: "/images/zmw-logo.png"
      },
      {
        page_name: "Size & Fit Guide (/size-guide)",
        page_type: "system",
        page_slug: "/size-guide",
        meta_title: "Size & Fit Guide — Measurements & Sizing Charts | ZMW Clothing",
        meta_description: "Find your perfect streetwear fit with our comprehensive ZMW Clothing size guide. Accurate flat-lay measurements in inches and cm for men, women, and kids.",
        meta_keywords: "size guide, oversized fit, streetwear size chart, chest measurements, ZMW sizes",
        canonical_url: "https://zmwclothing.com/size-guide",
        og_image_url: "/images/zmw-logo.png"
      },
      {
        page_name: "Privacy Policy (/privacy-policy)",
        page_type: "system",
        page_slug: "/privacy-policy",
        meta_title: "Privacy Policy — Data Protection & Security | ZMW Clothing",
        meta_description: "Learn how ZMW Clothing collects, uses, and protects your personal information and transactions with bank-grade SSL encryption.",
        meta_keywords: "privacy policy, data protection, secure shopping, ZMW legal",
        canonical_url: "https://zmwclothing.com/privacy-policy",
        og_image_url: "/images/zmw-logo.png"
      },
      {
        page_name: "Terms & Conditions (/terms-conditions)",
        page_type: "system",
        page_slug: "/terms-conditions",
        meta_title: "Terms & Conditions — User Agreement & Shopping Terms | ZMW Clothing",
        meta_description: "Review the terms of service, purchasing policies, and legal agreements governing the use of the ZMW Clothing e-commerce platform.",
        meta_keywords: "terms and conditions, user agreement, shopping policies, ZMW Clothing",
        canonical_url: "https://zmwclothing.com/terms-conditions",
        og_image_url: "/images/zmw-logo.png"
      },
      {
        page_name: "Shipping Policy (/shipping-policy)",
        page_type: "system",
        page_slug: "/shipping-policy",
        meta_title: "Shipping Policy — Pan-India Express Delivery Timelines | ZMW Clothing",
        meta_description: "Review ZMW Clothing shipping rates, delivery timelines, and order tracking across Tier-1 metros and regional pin codes in India.",
        meta_keywords: "shipping policy, delivery timelines, express dispatch, COD shipping",
        canonical_url: "https://zmwclothing.com/shipping-policy",
        og_image_url: "/images/zmw-logo.png"
      },
      {
        page_name: "Return & Refund Policy (/return-refund-policy)",
        page_type: "system",
        page_slug: "/return-refund-policy",
        meta_title: "Return & Refund Policy — 7-Day Easy Returns | ZMW Clothing",
        meta_description: "Learn about the ZMW Clothing return, replacement, and refund policies. Easy 7-day doorstep pickup across India for unworn apparel.",
        meta_keywords: "return policy, refund process, 7 day returns, exchange clothing",
        canonical_url: "https://zmwclothing.com/return-refund-policy",
        og_image_url: "/images/zmw-logo.png"
      }
    ];

    const records = systemPages.map((p) => ({
      ...p,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert("page_meta_settings", records);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("page_meta_settings");
  }
};
