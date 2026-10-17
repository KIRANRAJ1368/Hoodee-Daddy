"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("products", "sales_count", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn("product_variants", "sales_count", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.sequelize.query(`
      UPDATE products p
      SET p.sales_count = COALESCE((
        SELECT SUM(oi.quantity)
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = p.id
          AND o.status NOT IN ('cancelled', 'returned')
      ), 0)
    `);
    await queryInterface.sequelize.query(`
      UPDATE product_variants pv
      LEFT JOIN product_sizes ps ON ps.id = pv.size_id
      LEFT JOIN product_colors pc ON pc.id = pv.color_id
      SET pv.sales_count = COALESCE((
        SELECT SUM(oi.quantity)
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = pv.product_id
          AND LOWER(COALESCE(oi.size, '')) = LOWER(COALESCE(ps.label, ''))
          AND LOWER(COALESCE(oi.color, '')) = LOWER(COALESCE(pc.name, ''))
          AND o.status NOT IN ('cancelled', 'returned')
      ), 0)
    `);
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("product_variants", "sales_count");
    await queryInterface.removeColumn("products", "sales_count");
  }
};
