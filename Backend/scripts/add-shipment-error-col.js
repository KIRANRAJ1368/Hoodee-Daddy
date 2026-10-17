const { sequelize } = require("../src/models");

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query("ALTER TABLE orders ADD COLUMN shipment_error VARCHAR(255) NULL AFTER status;");
    console.log("Successfully added shipment_error column!");
  } catch (err) {
    if (err.message.includes("Duplicate column name")) {
      console.log("Column shipment_error already exists.");
    } else {
      console.error("Error adding column:", err.message);
    }
  } finally {
    await sequelize.close();
  }
}

run();
