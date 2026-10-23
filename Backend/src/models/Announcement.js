module.exports = (sequelize, DataTypes) => {
  const Announcement = sequelize.define(
    "Announcement",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      message: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      link_url: {
        type: DataTypes.STRING(300),
        allowNull: true
      },
      bg_color: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "#DC2626"
      },
      text_color: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "#FFFFFF"
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: "announcements",
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ["is_active"] },
        { fields: ["sort_order"] }
      ]
    }
  );

  return Announcement;
};
