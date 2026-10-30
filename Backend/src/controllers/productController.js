const { Product, ProductVariant, ProductSize, ProductColor } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { serializeProduct } = require("../services/productSerializer");
const productService = require("../services/productService");
const offerController = require("./offerController");

async function list(req, res) {
  const { rows, meta } = await productService.listProducts(req.query);
  const offers = await offerController.activeForProducts(rows);
  return sendSuccess(res, { data: rows.map((row) => ({ ...serializeProduct(row), offer: offers.get(Number(row.id)) || null })), meta });
}

const { Op } = require("sequelize");

async function getBySlug(req, res) {
  const { slug } = req.params;
  const isNumeric = /^\d+$/.test(slug);

  const whereClause = isNumeric
    ? { [Op.or]: [{ id: Number(slug) }, { slug }], is_active: true }
    : { [Op.or]: [{ slug }, { sku: slug }], is_active: true };

  const product = await Product.findOne({
    where: whereClause,
    include: productService.PRODUCT_INCLUDES
  });
  if (!product) throw ApiError.notFound("Product not found");
  const offers = await offerController.activeForProducts([product]);
  return sendSuccess(res, { data: { ...serializeProduct(product), offer: offers.get(Number(product.id)) || null } });
}

async function getById(req, res) {
  const product = await Product.findByPk(req.params.id, {
    include: productService.PRODUCT_INCLUDES
  });
  if (!product) throw ApiError.notFound("Product not found");
  const offers = await offerController.activeForProducts([product]);
  return sendSuccess(res, { data: { ...serializeProduct(product), offer: offers.get(Number(product.id)) || null } });
}

async function create(req, res) {
  const product = await productService.createProduct(req.body);
  const full = await Product.findByPk(product.id, { include: productService.PRODUCT_INCLUDES });
  return sendSuccess(res, { statusCode: 201, data: serializeProduct(full) });
}

async function update(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");
  await productService.updateProduct(product, req.body);
  const full = await Product.findByPk(product.id, { include: productService.PRODUCT_INCLUDES });
  return sendSuccess(res, { data: serializeProduct(full) });
}

async function remove(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");
  await product.destroy();
  return sendSuccess(res, { message: "Product deleted" });
}

async function toggleBestSeller(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");
  product.is_best_seller = req.body.value ?? !product.is_best_seller;
  await product.save();
  return sendSuccess(res, { data: { id: product.id, is_best_seller: product.is_best_seller } });
}


async function toggleShowOnHomepage(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");
  product.show_on_homepage = req.body.value !== undefined ? Boolean(req.body.value) : !product.show_on_homepage;
  await product.save();
  return sendSuccess(res, { data: { id: product.id, show_on_homepage: product.show_on_homepage } });
}

async function toggleNewArrival(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");
  product.is_new_arrival = req.body.value ?? !product.is_new_arrival;
  await product.save();
  return sendSuccess(res, { data: { id: product.id, is_new_arrival: product.is_new_arrival } });
}

async function updateStock(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");
  if (req.body.stock_count !== undefined) product.stock_count = req.body.stock_count;
  if (req.body.sales_count !== undefined) product.sales_count = req.body.sales_count;
  if (req.body.in_stock !== undefined) {
    product.in_stock = req.body.in_stock;
  } else if (req.body.stock_count !== undefined) {
    product.in_stock = req.body.stock_count > 0;
  }
  await product.save();
  return sendSuccess(res, {
    data: { id: product.id, stock_count: product.stock_count, sales_count: product.sales_count, in_stock: product.in_stock }
  });
}

// ── Variants (per size/color stock) ─────────────────────────────────────

async function listVariants(req, res) {
  const variants = await ProductVariant.findAll({
    where: { product_id: req.params.id },
    include: [
      { model: ProductSize, as: "size" },
      { model: ProductColor, as: "color" }
    ]
  });
  return sendSuccess(res, { data: variants });
}

async function createVariant(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");

  const variantSalePrice = req.body.price_override ?? product.price;
  const variantMrp = req.body.original_price_override ?? product.original_price;
  if (req.body.price_override != null || req.body.original_price_override != null) {
    productService.assertVariantPriceOverride(variantSalePrice, variantMrp);
  }
  const variant = await ProductVariant.create({
    product_id: product.id,
    size_id: req.body.size_id || null,
    color_id: req.body.color_id || null,
    sku_suffix: req.body.sku_suffix || null,
    stock_count: req.body.stock_count ?? 0,
    price_override: req.body.price_override ?? null,
    original_price_override: req.body.original_price_override ?? null
  });
  return sendSuccess(res, { statusCode: 201, data: variant });
}

async function syncProductTotalStock(productId) {
  const all = await ProductVariant.findAll({ where: { product_id: productId } });
  if (all.length > 0) {
    const total = all.reduce((sum, v) => sum + (Number(v.stock_count) || 0), 0);
    await Product.update(
      { stock_count: total, in_stock: total > 0 },
      { where: { id: productId } }
    );
  }
}

async function saveVariants(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");

  const variants = Array.isArray(req.body.variants) ? req.body.variants : [];
  await productService.updateProduct(product, { variants });
  const full = await Product.findByPk(product.id, { include: productService.PRODUCT_INCLUDES });
  return sendSuccess(res, { data: serializeProduct(full) });
}

async function updateVariant(req, res) {
  const variant = await ProductVariant.findOne({
    where: { id: req.params.variantId, product_id: req.params.id }
  });
  if (!variant) throw ApiError.notFound("Variant not found");
  if (req.body.price_override != null || req.body.original_price_override != null) {
    const product = await Product.findByPk(req.params.id);
    const salePrice = req.body.price_override ?? variant.price_override ?? product.price;
    const mrp = req.body.original_price_override ?? variant.original_price_override ?? product.original_price;
    productService.assertVariantPriceOverride(salePrice, mrp);
  }

  const fields = ["size_id", "color_id", "sku_suffix", "stock_count", "price_override", "original_price_override", "image_url", "gallery_images"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) variant[f] = req.body[f];
  });
  await variant.save();
  await syncProductTotalStock(req.params.id);
  return sendSuccess(res, { data: variant });
}

async function deleteVariant(req, res) {
  const variant = await ProductVariant.findOne({
    where: { id: req.params.variantId, product_id: req.params.id }
  });
  if (!variant) throw ApiError.notFound("Variant not found");
  await variant.destroy();
  await syncProductTotalStock(req.params.id);
  return sendSuccess(res, { message: "Variant deleted" });
}

module.exports = {
  list,
  getBySlug,
  getById,
  create,
  update,
  remove,
  toggleBestSeller,
  toggleNewArrival,
  toggleShowOnHomepage,
  updateStock,
  listVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  saveVariants
};
