"use strict";

const { Category, sequelize } = require("../src/models");
const { createProduct } = require("../src/services/productService");

async function main() {
  let createdProduct;
  try {
    const category = await Category.findOne({ order: [["id", "ASC"]] });
    if (!category) throw new Error("Create a category before verifying product creation.");

    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    createdProduct = await createProduct({
      name: `Product create verification ${unique}`,
      slug: `product-create-verification-${unique}`,
      category_id: category.id,
      price: 100,
      original_price: 150,
      stock_count: 2,
      in_stock: true,
      is_active: true,
      images: ["/uploads/product-create-verification.jpg"],
      specifications: [
        { title: "Fabric", value: "Cotton" },
        { title: "Fit", value: "Regular" },
        { title: "Care", value: "Machine wash" }
      ],
      colors: [{ name: `Verification ${unique}`, hex: "#181715" }],
      sizes: ["S", "M"],
      variants: ["S", "M"].map((size) => ({
        color: `Verification ${unique}`,
        colorHex: "#181715",
        size,
        stock_count: 1,
        price_override: 100,
        original_price_override: 150,
        image_url: "/uploads/product-create-verification.jpg",
        gallery_images: ["/uploads/product-create-verification-back.jpg"]
      }))
    });

    console.log(`Product create passed: ${createdProduct.name} (${createdProduct.id})`);
  } finally {
    if (createdProduct) await createdProduct.destroy();
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error("Product create verification failed:", error.message);
  process.exitCode = 1;
});
