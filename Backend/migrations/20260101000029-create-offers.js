"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("offers", {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(160), allowNull: false },
      target_type: { type: Sequelize.ENUM("all", "product", "category", "subcategory"), allowNull: false },
      target_ids: { type: Sequelize.JSON, allowNull: false },
      discount_type: { type: Sequelize.ENUM("percentage", "flat"), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") }
    });
    await queryInterface.addIndex("offers", ["is_active", "starts_at", "ends_at"]);
  },
  down: async (queryInterface) => queryInterface.dropTable("offers")
};
