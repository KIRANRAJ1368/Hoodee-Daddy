module.exports = (sequelize, DataTypes) => {
  const ProductSize = sequelize.define(
    "ProductSize",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      // Free-text label so both letter sizes ("S".."XXL") and age-band
      // sizes ("2-3Y") used by the Kids/Boys/Girls/Babies catalogs work.
      label: { type: DataTypes.STRING(60), allowNull: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
    },
    { tableName: "product_sizes" }
  );

  ProductSize.associate = (db) => {
    ProductSize.belongsTo(db.Product, { foreignKey: "product_id", as: "product" });
    ProductSize.hasMany(db.ProductVariant, { foreignKey: "size_id", as: "variants" });
  };

  return ProductSize;
};
