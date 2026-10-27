const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".jfif",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".mov"
]);

const UPLOAD_ROOT = path.resolve(__dirname, "..", "..", "uploads");

function destinationFor(folder) {
  return (req, file, cb) => {
    const dir = path.join(UPLOAD_ROOT, folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  };
}

function safeFilename(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const randomName = crypto.randomBytes(16).toString("hex");
  cb(null, `${Date.now()}-${randomName}${ext}`);
}

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedExt = ALLOWED_EXTENSIONS.has(ext);
  const isAllowedMime = ALLOWED_MIME_TYPES.has(file.mimetype) || (file.mimetype === "application/octet-stream" && isAllowedExt);
  if (!isAllowedMime || !isAllowedExt) {
    return cb(ApiError.badRequest("Only JPG, JPEG, JFIF, PNG, WEBP or GIF images are allowed"));
  }
  cb(null, true);
}

/**
 * Returns an upload middleware scoped to a folder under /uploads
 * (e.g. "products", "categories", "banners"). Validates mime type,
 * extension and size; writes files with a random name so the original
 * filename is never trusted or exposed.
 */
function makeUploader(folder) {
  return multer({
    storage: multer.diskStorage({
      destination: destinationFor(folder),
      filename: safeFilename
    }),
    fileFilter,
    limits: { fileSize: env.upload.maxFileSizeMb * 1024 * 1024, files: 10 }
  });
}

function publicUrlFor(folder, filename) {
  return `${env.appUrl}/uploads/${folder}/${filename}`;
}

module.exports = { makeUploader, publicUrlFor, UPLOAD_ROOT };
