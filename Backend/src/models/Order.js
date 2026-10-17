module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      order_number: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      customer_name: { type: DataTypes.STRING(150), allowNull: false },
      email: { type: DataTypes.STRING(190), allowNull: false, validate: { isEmail: true } },
      phone: { type: DataTypes.STRING(20), allowNull: false },
      shipping_address: { type: DataTypes.TEXT, allowNull: false },
      city: { type: DataTypes.STRING(100), allowNull: true },
      state: { type: DataTypes.STRING(100), allowNull: true },
      pincode: { type: DataTypes.STRING(10), allowNull: true },
      payment_method: { type: DataTypes.ENUM("COD", "PREPAID"), allowNull: false, defaultValue: "COD" },
      status: {
        type: DataTypes.ENUM("pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"),
        allowNull: false,
        defaultValue: "pending"
      },
      shipment_error: { type: DataTypes.STRING(255), allowNull: true },
      subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      coupon_code: { type: DataTypes.STRING(50), allowNull: true },
      shipping_fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      shipping_status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "pending_dispatch" },
      tracking_number: { type: DataTypes.STRING(100), allowNull: true },
      courier_name: { type: DataTypes.STRING(100), allowNull: true },
      courier_company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      shiprocket_order_id: { type: DataTypes.STRING(100), allowNull: true },
      shipment_id: { type: DataTypes.STRING(100), allowNull: true },
      awb_code: { type: DataTypes.STRING(100), allowNull: true },
      shipping_label_url: { type: DataTypes.TEXT, allowNull: true },
      estimated_delivery: { type: DataTypes.STRING(100), allowNull: true },

      // ── Cancellation & Return State Machine ──
      cancellation_type: {
        type: DataTypes.ENUM("pre_pack", "in_transit", "post_delivery"),
        allowNull: true
      },
      cancellation_status: {
        type: DataTypes.ENUM(
          "none",
          "requested",
          "approved",
          "rejected",
          "rto_in_transit",
          "rto_delivered",
          "completed"
        ),
        allowNull: false,
        defaultValue: "none"
      },
      cancellation_reason: { type: DataTypes.STRING(255), allowNull: true },
      cancellation_comments: { type: DataTypes.TEXT, allowNull: true },

      // ── Return Media Proofs (Type 3) ──
      return_images: { type: DataTypes.JSON, allowNull: true },
      return_video_url: { type: DataTypes.STRING(2048), allowNull: true },

      // ── Reverse Pickup Shiprocket Integration ──
      reverse_shiprocket_order_id: { type: DataTypes.STRING(100), allowNull: true },
      reverse_shipment_id: { type: DataTypes.STRING(100), allowNull: true },
      reverse_awb_code: { type: DataTypes.STRING(100), allowNull: true },
      reverse_shipping_status: { type: DataTypes.STRING(50), allowNull: true },
      warehouse_received_at: { type: DataTypes.DATE, allowNull: true },
      warehouse_inspected_by: { type: DataTypes.STRING(100), allowNull: true },

      // ── Customer UPI Refund & Audit Ledger ──
      refund_upi_id: { type: DataTypes.STRING(100), allowNull: true },
      refund_account_holder: { type: DataTypes.STRING(150), allowNull: true },
      refund_status: {
        type: DataTypes.ENUM("not_required", "pending", "processed", "failed"),
        allowNull: false,
        defaultValue: "not_required"
      },
      refund_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      refund_utr_number: { type: DataTypes.STRING(100), allowNull: true },
      refund_processed_at: { type: DataTypes.DATE, allowNull: true },
      refund_notes: { type: DataTypes.TEXT, allowNull: true },

      user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      is_guest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    {
      tableName: "orders",
      indexes: [
        { fields: ["status"] },
        { fields: ["shipping_status"] },
        { fields: ["tracking_number"] },
        { fields: ["email"] },
        { fields: ["user_id"] },
        { fields: ["is_guest"] }
      ]
    }
  );

  Order.associate = (db) => {
    Order.hasMany(db.OrderItem, { foreignKey: "order_id", as: "items", onDelete: "CASCADE" });
    Order.hasMany(db.OrderStatusHistory, { foreignKey: "order_id", as: "status_history", onDelete: "CASCADE" });
    Order.belongsTo(db.User, { foreignKey: "user_id", as: "user", onDelete: "SET NULL" });
  };

  return Order;
};
