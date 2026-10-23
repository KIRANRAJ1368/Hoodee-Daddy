"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("visitor_leads", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      district: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      email_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      admin_email_sent_to: {
        type: Sequelize.STRING(255),
        allowNull: true
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

    await queryInterface.addIndex("visitor_leads", ["phone"]);
    await queryInterface.addIndex("visitor_leads", ["pincode"]);
    await queryInterface.addIndex("visitor_leads", ["created_at"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("visitor_leads");
  }
};
