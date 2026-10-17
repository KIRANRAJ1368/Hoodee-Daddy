module.exports = (sequelize, DataTypes) => sequelize.define("Offer", {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  target_type: { type: DataTypes.ENUM("all", "product", "category", "subcategory"), allowNull: false },
  target_ids: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  discount_type: { type: DataTypes.ENUM("percentage", "flat"), allowNull: false },
  discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  starts_at: { type: DataTypes.DATE, allowNull: false },
  ends_at: { type: DataTypes.DATE, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: "offers" });

