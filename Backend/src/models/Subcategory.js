module.exports = (sequelize, DataTypes) => {
  const Subcategory = sequelize.define(
    "Subcategory",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      slug: { type: DataTypes.STRING(80), allowNull: false },
      // Thumbnail used on the Home category-feature-grid tiles.
      image_url: { type: DataTypes.STRING(500), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      show_on_homepage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    {
      tableName: "subcategories",
      indexes: [{ unique: true, fields: ["category_id", "slug"] }]
    }
  );

  Subcategory.associate = (db) => {
    Subcategory.belongsTo(db.Category, { foreignKey: "category_id", as: "category" });
  };

  return Subcategory;
};
