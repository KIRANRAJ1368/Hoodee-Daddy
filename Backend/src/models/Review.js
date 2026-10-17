module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    "Review",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      order_item_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, unique: true },
      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      customer_name: { type: DataTypes.STRING(120), allowNull: false },
      customer_email: { type: DataTypes.STRING(190), allowNull: true },
      rating: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 5 },
      title: { type: DataTypes.STRING(255), allowNull: true },
      comment: { type: DataTypes.TEXT, allowNull: false },
      image_urls: { type: DataTypes.JSON, allowNull: true },
      verified_purchase: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      is_approved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    {
      tableName: "reviews",
      indexes: [
        { fields: ["product_id"] },
        { fields: ["order_item_id"], unique: true },
        { fields: ["rating"] },
        { fields: ["is_approved"] }
      ]
    }
  );

  Review.associate = (db) => {
    Review.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
    Review.belongsTo(db.OrderItem, { foreignKey: "order_item_id", as: "orderItem" });
    if (db.User) {
      Review.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
    }
  };

  return Review;
};
