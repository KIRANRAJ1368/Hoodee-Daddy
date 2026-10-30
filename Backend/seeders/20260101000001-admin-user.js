"use strict";
const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface) => {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const name = process.env.SEED_ADMIN_NAME || "HooDee Daddy Admin";

    if (!email || !password) {
      throw new Error(
        "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env before running this seeder."
      );
    }

    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
      { replacements: [email] }
    );
    if (existing.length > 0) {
      console.log(`Admin user ${email} already exists — skipping.`);
      return;
    }

    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12);

    await queryInterface.bulkInsert("admin_users", [
      {
        name,
        email,
        password_hash,
        role: "superadmin",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("admin_users", { email: process.env.SEED_ADMIN_EMAIL });
  }
};
