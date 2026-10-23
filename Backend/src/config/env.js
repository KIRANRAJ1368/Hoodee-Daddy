const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const required = ["DB_HOST", "DB_NAME", "DB_USER", "JWT_SECRET"];
if (process.env.NODE_ENV === "production") {
  required.push("DB_PASSWORD");
}

const missing = required.filter((key) => !process.env[key] || process.env[key].trim() === "");

if (missing.length > 0) {
  // Fail fast and loudly rather than booting with undefined secrets.
  // eslint-disable-next-line no-console
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy .env.example to .env and fill in real values before starting the server.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
  // eslint-disable-next-line no-console
  console.error("JWT_SECRET is too short for production use. Use at least 32 random characters.");
  process.exit(1);
}

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  appUrl: process.env.APP_URL
    ? (/^https?:\/\//i.test(process.env.APP_URL) ? process.env.APP_URL.trim() : `https://${process.env.APP_URL.trim()}`)
    : `http://localhost:${process.env.PORT || 5000}`,

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT || "mysql"
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  corsOrigins: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .flatMap((origin) => {
      if (/^https?:\/\//i.test(origin)) {
        return [origin];
      }
      return [`https://${origin}`, `http://${origin}`, origin];
    }),

  rateLimit: {
    windowMin: parseInt(process.env.RATE_LIMIT_WINDOW_MIN, 10) || 15,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
    authWindowMin: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MIN, 10) || 15,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10
  },

  upload: {
    maxFileSizeMb: parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB, 10) || 10
  },

  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || "ZMW Admin",
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD
  },

  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "ZMW Clothing <no-reply@zmwclothing.com>"
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || ""
  },

  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL || "",
    password: process.env.SHIPROCKET_PASSWORD || "",
    token: process.env.SHIPROCKET_TOKEN || "",
    apiUrl: process.env.SHIPROCKET_API_URL || "https://apiv2.shiprocket.in/v1/external",
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "warehouse",
    pickupPincode: process.env.SHIPROCKET_PICKUP_PIN || process.env.SHIPROCKET_PICKUP_PINCODE || "641004",
    defaultWeightKg: parseFloat(process.env.SHIPROCKET_DEFAULT_WEIGHT || "0.5")
  }
};
