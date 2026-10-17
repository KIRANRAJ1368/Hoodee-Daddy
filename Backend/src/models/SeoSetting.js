module.exports = (sequelize, DataTypes) => {
  const SeoSetting = sequelize.define(
    "SeoSetting",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      default_meta_title: { type: DataTypes.STRING(255), allowNull: false },
      default_meta_description: { type: DataTypes.TEXT, allowNull: false },
      default_meta_keywords: { type: DataTypes.STRING(500), allowNull: true },
      homepage_title: { type: DataTypes.STRING(255), allowNull: false },
      homepage_description: { type: DataTypes.TEXT, allowNull: false },
      product_title_format: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "{name} | ZMW Clothing" },
      product_description_format: { type: DataTypes.TEXT, allowNull: true },
      category_title_format: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "{name} Collection — Luxury Apparel | ZMW Clothing" },
      category_description_format: { type: DataTypes.TEXT, allowNull: true },
      canonical_base_url: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "https://zmwclothing.com" },
      og_title: { type: DataTypes.STRING(255), allowNull: true },
      og_description: { type: DataTypes.TEXT, allowNull: true },
      og_image_url: { type: DataTypes.STRING(500), allowNull: true },
      robots_index: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      robots_follow: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      robots_custom_rules: { type: DataTypes.TEXT, allowNull: true },
      organization_name: { type: DataTypes.STRING(150), allowNull: false, defaultValue: "ZMW Clothing" },
      organization_telephone: { type: DataTypes.STRING(50), allowNull: true, defaultValue: "+919876543210" },
      organization_email: { type: DataTypes.STRING(150), allowNull: true, defaultValue: "zmw@gmail.com" }
    },
    {
      tableName: "seo_settings",
      timestamps: true,
      underscored: true
    }
  );

  return SeoSetting;
};
