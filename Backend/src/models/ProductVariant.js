module.exports = (sequelize, DataTypes) => {
  const ProductVariant = sequelize.define(
    "ProductVariant",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      size_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      color_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      sku_suffix: { type: DataTypes.STRING(30), allowNull: true },
      stock_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      sales_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      // Optional per-variant price override; null means "use product.price".
      price_override: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      original_price_override: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      image_url: { type: DataTypes.STRING(2048), allowNull: true },
      gallery_images: { type: DataTypes.JSON, allowNull: true }
    },
    {
      tableName: "product_variants",
      indexes: [{ unique: true, fields: ["product_id", "size_id", "color_id"] }]
    }
  );

  ProductVariant.associate = (db) => {
    ProductVariant.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
    ProductVariant.belongsTo(db.ProductSize, { foreignKey: "size_id", as: "size" });
    ProductVariant.belongsTo(db.ProductColor, { foreignKey: "color_id", as: "color" });
  };

  return ProductVariant;
};
