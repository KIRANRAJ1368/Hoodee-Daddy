"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Products table
    const productCols = await queryInterface.describeTable("products");
    const productAdditions = [
      { name: "meta_title", def: { type: Sequelize.STRING(255), allowNull: true } },
      { name: "meta_description", def: { type: Sequelize.TEXT, allowNull: true } },
      { name: "meta_keywords", def: { type: Sequelize.STRING(500), allowNull: true } },
      { name: "canonical_url", def: { type: Sequelize.STRING(255), allowNull: true } }
    ];

    for (const col of productAdditions) {
      if (!productCols[col.name]) {
        await queryInterface.addColumn("products", col.name, col.def);
      }
    }

    // 2. Categories table
    const categoryCols = await queryInterface.describeTable("categories");
    const categoryAdditions = [
      { name: "meta_title", def: { type: Sequelize.STRING(255), allowNull: true } },
      { name: "meta_description", def: { type: Sequelize.TEXT, allowNull: true } },
      { name: "meta_keywords", def: { type: Sequelize.STRING(500), allowNull: true } },
      { name: "canonical_url", def: { type: Sequelize.STRING(255), allowNull: true } }
    ];

    for (const col of categoryAdditions) {
      if (!categoryCols[col.name]) {
        await queryInterface.addColumn("categories", col.name, col.def);
      }
    }
  },

  down: async (queryInterface) => {
    const productCols = await queryInterface.describeTable("products");
    for (const col of ["meta_title", "meta_description", "meta_keywords", "canonical_url"]) {
      if (productCols[col]) {
        await queryInterface.removeColumn("products", col);
      }
    }

    const categoryCols = await queryInterface.describeTable("categories");
    for (const col of ["meta_title", "meta_description", "meta_keywords", "canonical_url"]) {
      if (categoryCols[col]) {
        await queryInterface.removeColumn("categories", col);
      }
    }
  }
};
