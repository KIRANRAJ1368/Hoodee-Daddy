"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("orders");

    // 1. Courier Company ID
    if (!tableInfo.courier_company_id) {
      await queryInterface.addColumn("orders", "courier_company_id", {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true
      });
    }

    // 2. Cancellation & Return State Machine
    if (!tableInfo.cancellation_type) {
      await queryInterface.addColumn("orders", "cancellation_type", {
        type: Sequelize.ENUM("pre_pack", "in_transit", "post_delivery"),
        allowNull: true
      });
    }

    if (!tableInfo.cancellation_status) {
      await queryInterface.addColumn("orders", "cancellation_status", {
        type: Sequelize.ENUM(
          "none",
          "requested",
          "approved",
          "rejected",
          "rto_in_transit",
          "rto_delivered",
          "completed"
        ),
        defaultValue: "none",
        allowNull: false
      });
    }

    if (!tableInfo.cancellation_reason) {
      await queryInterface.addColumn("orders", "cancellation_reason", {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }

    if (!tableInfo.cancellation_comments) {
      await queryInterface.addColumn("orders", "cancellation_comments", {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    // 3. Return Media Proofs
    if (!tableInfo.return_images) {
      await queryInterface.addColumn("orders", "return_images", {
        type: Sequelize.JSON,
        allowNull: true
      });
    }

    if (!tableInfo.return_video_url) {
      await queryInterface.addColumn("orders", "return_video_url", {
        type: Sequelize.STRING(2048),
        allowNull: true
      });
    }

    // 4. Reverse Pickup Shiprocket Integration
    if (!tableInfo.reverse_shiprocket_order_id) {
      await queryInterface.addColumn("orders", "reverse_shiprocket_order_id", {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!tableInfo.reverse_shipment_id) {
      await queryInterface.addColumn("orders", "reverse_shipment_id", {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!tableInfo.reverse_awb_code) {
      await queryInterface.addColumn("orders", "reverse_awb_code", {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!tableInfo.reverse_shipping_status) {
      await queryInterface.addColumn("orders", "reverse_shipping_status", {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }

    if (!tableInfo.warehouse_received_at) {
      await queryInterface.addColumn("orders", "warehouse_received_at", {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableInfo.warehouse_inspected_by) {
      await queryInterface.addColumn("orders", "warehouse_inspected_by", {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    // 5. Customer UPI Refund & Audit Ledger
    if (!tableInfo.refund_upi_id) {
      await queryInterface.addColumn("orders", "refund_upi_id", {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!tableInfo.refund_account_holder) {
      await queryInterface.addColumn("orders", "refund_account_holder", {
        type: Sequelize.STRING(150),
        allowNull: true
      });
    }

    if (!tableInfo.refund_status) {
      await queryInterface.addColumn("orders", "refund_status", {
        type: Sequelize.ENUM("not_required", "pending", "processed", "failed"),
        defaultValue: "not_required",
        allowNull: false
      });
    }

    if (!tableInfo.refund_amount) {
      await queryInterface.addColumn("orders", "refund_amount", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      });
    }

    if (!tableInfo.refund_utr_number) {
      await queryInterface.addColumn("orders", "refund_utr_number", {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!tableInfo.refund_processed_at) {
      await queryInterface.addColumn("orders", "refund_processed_at", {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableInfo.refund_notes) {
      await queryInterface.addColumn("orders", "refund_notes", {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  down: async (queryInterface) => {
    const cols = [
      "refund_notes",
      "refund_processed_at",
      "refund_utr_number",
      "refund_amount",
      "refund_status",
      "refund_account_holder",
      "refund_upi_id",
      "warehouse_inspected_by",
      "warehouse_received_at",
      "reverse_shipping_status",
      "reverse_awb_code",
      "reverse_shipment_id",
      "reverse_shiprocket_order_id",
      "return_video_url",
      "return_images",
      "cancellation_comments",
      "cancellation_reason",
      "cancellation_status",
      "cancellation_type",
      "courier_company_id"
    ];

    for (const col of cols) {
      try {
        await queryInterface.removeColumn("orders", col);
      } catch (e) {
        // ignore if not present
      }
    }
  }
};
