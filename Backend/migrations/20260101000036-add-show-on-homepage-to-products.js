"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("products");
    if (!tableInfo.show_on_homepage) {
      await queryInterface.addColumn("products", "show_on_homepage", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable("products");
    if (tableInfo.show_on_homepage) {
      await queryInterface.removeColumn("products", "show_on_homepage");
    }
  }
};
