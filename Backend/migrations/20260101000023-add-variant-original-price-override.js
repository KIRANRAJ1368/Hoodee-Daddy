"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable("product_variants");
    if (!columns.original_price_override) {
      await queryInterface.addColumn("product_variants", "original_price_override", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }
  },
  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable("product_variants");
    if (columns.original_price_override) {
      await queryInterface.removeColumn("product_variants", "original_price_override");
    }
  }
};
