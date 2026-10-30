module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(200), allowNull: false },
      slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
      sku: { type: DataTypes.STRING(60), allowNull: false, unique: true },

      category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      subcategory_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

      // Standardized cross-department type bucket used for filtering
      // ("T-Shirts", "Hoodies", "Sweatshirts", ...). Set explicitly by the
      // admin instead of guessed from the product name.
      product_type: { type: DataTypes.STRING(60), allowNull: true },

      description: { type: DataTypes.TEXT, allowNull: true },

      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      original_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },

      rating: { type: DataTypes.DECIMAL(2, 1), allowNull: false, defaultValue: 0 },
      review_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      in_stock: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      stock_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      sales_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

      is_best_seller: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_new_arrival: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_sale: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      // Optional custom badge overriding the computed one (e.g. "Trending").
      badge_label: { type: DataTypes.STRING(40), allowNull: true },
      badge_type: { type: DataTypes.ENUM("hot", "new", "sale"), allowNull: true },

      // Publish toggle — inactive products are hidden from public APIs but
      // kept for admin/order history.
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      show_on_homepage: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      // Dynamic Specifications array: [{ title: "SILHOUETTE", value: "Relaxed Regular Fit" }]
      specifications: { type: DataTypes.JSON, allowNull: true },

      // On-page SEO Metadata fields
      meta_title: { type: DataTypes.STRING(255), allowNull: true },
      meta_description: { type: DataTypes.TEXT, allowNull: true },
      meta_keywords: { type: DataTypes.STRING(500), allowNull: true },
      canonical_url: { type: DataTypes.STRING(255), allowNull: true }
    },
    {
      tableName: "products",
      indexes: [
        { fields: ["category_id"] },
        { fields: ["subcategory_id"] },
        { fields: ["is_best_seller"] },
        { fields: ["is_new_arrival"] },
        { fields: ["is_active"] }
      ]
    }
  );

  Product.associate = (db) => {
    Product.belongsTo(db.Category, { foreignKey: "category_id", as: "category" });
    Product.hasMany(db.ProductImage, { foreignKey: "product_id", as: "images", onDelete: "CASCADE" });
    Product.hasMany(db.ProductColor, { foreignKey: "product_id", as: "colors", onDelete: "CASCADE" });
    Product.hasMany(db.ProductSize, { foreignKey: "product_id", as: "sizes", onDelete: "CASCADE" });
    Product.hasMany(db.ProductVariant, { foreignKey: "product_id", as: "variants", onDelete: "CASCADE" });
    Product.hasMany(db.OrderItem, { foreignKey: "product_id", as: "orderItems" });
    Product.hasMany(db.Review, { foreignKey: "product_id", as: "reviews", onDelete: "CASCADE" });
  };

  return Product;
};
