module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(80), allowNull: false },
      // e.g. "mens", "women", "kids", "boys", "girls", "babies" — matches
      // the ?category= query param the existing frontend already sends.
      slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      show_on_homepage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      banner_image_url: { type: DataTypes.STRING(255), allowNull: true },
      banner_image_position: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "center center" },
      banner_tag: { type: DataTypes.STRING(150), allowNull: true },
      banner_title: { type: DataTypes.STRING(150), allowNull: true },
      banner_subtitle: { type: DataTypes.TEXT, allowNull: true },
      banner_badge_promo: { type: DataTypes.STRING(100), allowNull: true },
      banner_primary_cta_text: { type: DataTypes.STRING(80), allowNull: true, defaultValue: "Shop Now" },
      banner_primary_cta_link: { type: DataTypes.STRING(300), allowNull: true },
      banner_secondary_cta_text: { type: DataTypes.STRING(80), allowNull: true },

      // On-page SEO Metadata fields
      meta_title: { type: DataTypes.STRING(255), allowNull: true },
      meta_description: { type: DataTypes.TEXT, allowNull: true },
      meta_keywords: { type: DataTypes.STRING(500), allowNull: true },
      canonical_url: { type: DataTypes.STRING(255), allowNull: true }
    },
    { tableName: "categories" }
  );

  Category.associate = (db) => {
    Category.hasMany(db.Subcategory, { foreignKey: "category_id", as: "subcategories" });
    Category.hasMany(db.Product, { foreignKey: "category_id", as: "products" });
  };

  return Category;
};
