const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { publicUrlFor } = require("../middleware/upload");

const ALLOWED_FOLDERS = new Set(["products", "variants", "categories", "subcategories", "banners", "returns", "reviews"]);

async function upload(req, res) {
  const { folder } = req.params;
  if (!ALLOWED_FOLDERS.has(folder)) throw ApiError.badRequest("Invalid upload folder");

  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest("No file(s) uploaded");
  }

  const files = req.files.map((f) => ({
    filename: f.filename,
    url: publicUrlFor(folder, f.filename),
    size: f.size
  }));

  return sendSuccess(res, { statusCode: 201, data: { files, urls: files.map((file) => file.url) } });
}

module.exports = { upload };
