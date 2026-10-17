module.exports = (sequelize, DataTypes) => {
  const PageMetaSetting = sequelize.define(
    "PageMetaSetting",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      page_name: { type: DataTypes.STRING(255), allowNull: false },
      page_type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "custom" },
      page_slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      meta_title: { type: DataTypes.STRING(255), allowNull: true },
      meta_description: { type: DataTypes.TEXT, allowNull: true },
      meta_keywords: { type: DataTypes.STRING(500), allowNull: true },
      canonical_url: { type: DataTypes.STRING(500), allowNull: true },
      og_image_url: { type: DataTypes.STRING(500), allowNull: true },
      entity_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    {
      tableName: "page_meta_settings",
      timestamps: true,
      underscored: true
    }
  );

  return PageMetaSetting;
};
