"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const reviewColumns = await queryInterface.describeTable("reviews");
    if (!reviewColumns.order_item_id) {
      await queryInterface.addColumn("reviews", "order_item_id", {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: "order_items", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE"
      });
      await queryInterface.addIndex("reviews", ["order_item_id"], { unique: true, name: "reviews_order_item_unique" });
    }
    if (!reviewColumns.image_urls) {
      await queryInterface.addColumn("reviews", "image_urls", { type: Sequelize.JSON, allowNull: true });
    }
    await queryInterface.bulkUpdate("reviews", { is_approved: false }, { user_id: null });
    const orderColumns = await queryInterface.describeTable("orders");
    if (!orderColumns.shipment_error) await queryInterface.addColumn("orders", "shipment_error", { type: Sequelize.STRING(255), allowNull: true });

    const tables = await queryInterface.showAllTables();
    if (!tables.includes("order_status_history")) {
      await queryInterface.createTable("order_status_history", {
        id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
        order_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: "orders", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE"
        },
        status: { type: Sequelize.STRING(50), allowNull: false },
        shipping_status: { type: Sequelize.STRING(50), allowNull: true },
        source: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "admin" },
        note: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") }
      });
      await queryInterface.addIndex("order_status_history", ["order_id", "created_at"]);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("order_status_history");
    const orderColumns = await queryInterface.describeTable("orders");
    if (orderColumns.shipment_error) await queryInterface.removeColumn("orders", "shipment_error");
    const columns = await queryInterface.describeTable("reviews");
    if (columns.image_urls) await queryInterface.removeColumn("reviews", "image_urls");
    if (columns.order_item_id) {
      await queryInterface.removeIndex("reviews", "reviews_order_item_unique");
      await queryInterface.removeColumn("reviews", "order_item_id");
    }
  }
};
