require("express-async-errors");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");

const env = require("./config/env");
const apiRoutes = require("./routes");
const { generalLimiter } = require("./middleware/rateLimiters");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { UPLOAD_ROOT } = require("./middleware/upload");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    // Uploaded images are served cross-origin to the frontend/admin panel.
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, server-to-server, mobile apps, no Origin header).
      if (!origin) return callback(null, true);

      const isConfigured = env.corsOrigins.length === 0 || env.corsOrigins.includes(origin);
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isPrivateNetwork = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
      const isSaiTechno = /^https?:\/\/([a-zA-Z0-9-]+\.)*saitechnosolutions\.co\.in(:\d+)?$/.test(origin);

      if (isConfigured || isLocalhost || isPrivateNetwork || isSaiTechno) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
  })
);

app.use(compression());
if (env.env !== "test") {
  app.use(morgan(env.env === "development" ? "dev" : "combined"));
}

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(generalLimiter);

// Uploaded images — publicUrlFor() in middleware/upload.js builds URLs
// that point here.
app.use("/uploads", express.static(UPLOAD_ROOT));

const seoController = require("./controllers/seoController");

app.get("/health", (req, res) => res.json({ success: true, data: { status: "ok", env: env.env } }));

// Root-level Technical SEO endpoints
app.get("/sitemap.xml", seoController.getSitemapXml);
app.get("/robots.txt", seoController.getRobotsTxt);

app.use("/api", apiRoutes);
app.use("/api/v1", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
