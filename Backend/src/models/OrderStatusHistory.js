module.exports = (sequelize, DataTypes) => {
  const OrderStatusHistory = sequelize.define(
    "OrderStatusHistory",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: false },
      shipping_status: { type: DataTypes.STRING(50), allowNull: true },
      source: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "admin" },
      note: { type: DataTypes.STRING(255), allowNull: true }
    },
    { tableName: "order_status_history" }
  );

  OrderStatusHistory.associate = (db) => {
    OrderStatusHistory.belongsTo(db.Order, { foreignKey: "order_id", as: "order" });
  };

  return OrderStatusHistory;
};
