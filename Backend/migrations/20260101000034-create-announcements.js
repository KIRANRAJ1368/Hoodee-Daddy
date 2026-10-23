"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("announcements", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      message: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      link_url: {
        type: Sequelize.STRING(300),
        allowNull: true
      },
      bg_color: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "#DC2626"
      },
      text_color: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "#FFFFFF"
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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

    await queryInterface.addIndex("announcements", ["is_active"]);
    await queryInterface.addIndex("announcements", ["sort_order"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("announcements");
  }
};
