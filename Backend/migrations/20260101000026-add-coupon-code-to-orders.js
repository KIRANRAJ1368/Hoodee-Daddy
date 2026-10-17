"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("orders", "coupon_code", {
      type: Sequelize.STRING(50),
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("orders", "coupon_code");
  }
};
