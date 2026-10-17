module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    "OrderItem",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      // Nullable + snapshot fields: if a product is later deleted, past
      // orders keep an accurate historical record.
      product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      product_name_snapshot: { type: DataTypes.STRING(200), allowNull: false },
      sku_snapshot: { type: DataTypes.STRING(60), allowNull: true },
      image_url: { type: DataTypes.STRING(500), allowNull: true },
      size: { type: DataTypes.STRING(20), allowNull: true },
      color: { type: DataTypes.STRING(60), allowNull: true },
      unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
      line_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
    },
    { tableName: "order_items" }
  );

  OrderItem.associate = (db) => {
    OrderItem.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
    OrderItem.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
    OrderItem.hasOne(db.Review, { foreignKey: "order_item_id", as: "review" });
  };

  return OrderItem;
};
