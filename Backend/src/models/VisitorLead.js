module.exports = (sequelize, DataTypes) => {
  const VisitorLead = sequelize.define(
    "VisitorLead",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      pincode: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      district: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      ip_address: {
        type: DataTypes.STRING(64),
        allowNull: true
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      email_sent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      admin_email_sent_to: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: "visitor_leads",
      underscored: true,
      timestamps: true
    }
  );

  return VisitorLead;
};
