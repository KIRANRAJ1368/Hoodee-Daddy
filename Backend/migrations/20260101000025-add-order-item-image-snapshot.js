"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("order_items", "image_url", {
      type: Sequelize.STRING(500),
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("order_items", "image_url");
  }
};
