const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { SeoSetting, Product, Category, Subcategory, PageMetaSetting, sequelize } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

const FRONTEND_PUBLIC_DIR = path.resolve(__dirname, "../../../Frontend/public");

/**
 * Normalizes base URL, stripping trailing slashes.
 */
function cleanUrl(url) {
  return String(url || "https://zmwclothing.com").trim().replace(/\/+$/, "");
}

/**
 * Escapes special XML characters for safe sitemap generation.
 */
function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats a date into W3C / ISO 8601 date string (YYYY-MM-DD).
 */
function formatDate(date) {
  try {
    return new Date(date || Date.now()).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Retrieves the singleton SEO setting row, creating defaults if not present.
 */
async function getOrInitSettings() {
  let settings = await SeoSetting.findOne();
  if (!settings) {
    settings = await SeoSetting.create({
      default_meta_title: "ZMW Clothing — Luxury Pret-a-Porter & Haute Couture",
      default_meta_description: "Handcrafted luxury apparel. Natural fibres, master tailoring, and considered design. Nationwide insured dispatch.",
      default_meta_keywords: "ZMW clothing, luxury fashion, couture, menswear, womenswear, premium apparel, oversized t-shirts, hoodies, streetwear, Coimbatore",
      homepage_title: "ZMW Clothing — Luxury Fashion, Streetwear & Everyday Essentials",
      homepage_description: "Discover ZMW's luxury streetwear and couture collections. Handcrafted 240+ GSM oversized t-shirts, 450 GSM hoodies, and tailored apparel.",
      product_title_format: "{name} | ZMW Clothing",
      product_description_format: "{description}",
      category_title_format: "{name} Collection — Luxury Apparel | ZMW Clothing",
      category_description_format: "Explore the latest {name} collection at ZMW Clothing. Premium luxury fabrics, considered tailoring, and pan-India delivery.",
      canonical_base_url: "https://zmwclothing.com",
      og_title: "ZMW Clothing — Luxury Pret-a-Porter & Haute Couture",
      og_description: "Handcrafted luxury apparel. Master tailoring, considered design, and nationwide insured dispatch.",
      og_image_url: "/images/zmw-logo.png",
      robots_index: true,
      robots_follow: true,
      robots_custom_rules: "Disallow: /admin\nDisallow: /cart\nDisallow: /checkout\nDisallow: /account\nDisallow: /profile\nDisallow: /my-orders\nDisallow: /login\nDisallow: /register\nDisallow: /forgot-password\nDisallow: /reset-password",
      organization_name: "ZMW Clothing",
      organization_telephone: "+919876543210",
      organization_email: "zmw@gmail.com"
    });
  }
  return settings;
}

/**
 * Generates the complete XML sitemap content.
 */
async function generateSitemapXml() {
  const settings = await getOrInitSettings();
  const baseUrl = cleanUrl(settings.canonical_base_url);
  const today = formatDate();

  // Static informational and policy pages
  const staticUrls = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily", lastmod: today },
    { loc: `${baseUrl}/about`, priority: "0.7", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/contact`, priority: "0.7", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/faq`, priority: "0.6", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/size-guide`, priority: "0.6", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/shipping-policy`, priority: "0.5", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/return-refund-policy`, priority: "0.5", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/terms-conditions`, priority: "0.4", changefreq: "monthly", lastmod: today },
    { loc: `${baseUrl}/privacy-policy`, priority: "0.4", changefreq: "monthly", lastmod: today }
  ];

  // Active Categories & Subcategories
  const categories = await Category.findAll({
    where: { is_active: true },
    include: [{ model: Subcategory, as: "subcategories", where: { is_active: true }, required: false }]
  });

  const categoryUrls = [];
  categories.forEach((cat) => {
    categoryUrls.push({
      loc: `${baseUrl}/categories/${cat.slug}`,
      priority: "0.9",
      changefreq: "daily",
      lastmod: formatDate(cat.updated_at || cat.updatedAt)
    });

    if (Array.isArray(cat.subcategories)) {
      cat.subcategories.forEach((sub) => {
        categoryUrls.push({
          loc: `${baseUrl}/categories/${cat.slug}/${sub.slug}`,
          priority: "0.8",
          changefreq: "weekly",
          lastmod: formatDate(sub.updated_at || sub.updatedAt || cat.updated_at)
        });
      });
    }
  });

  // Active Products
  const products = await Product.findAll({
    where: { is_active: true },
    attributes: ["id", "slug", "name", "updated_at", "created_at"]
  });

  const productUrls = products.map((prod) => ({
    loc: `${baseUrl}/products/${prod.slug}`,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: formatDate(prod.updated_at || prod.created_at)
  }));

  const allUrls = [...staticUrls, ...categoryUrls, ...productUrls];

  const xmlEntries = allUrls
    .map(
      (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Generates the robots.txt text content.
 */
async function generateRobotsTxt() {
  const settings = await getOrInitSettings();
  const baseUrl = cleanUrl(settings.canonical_base_url);

  // If site indexing is completely turned off (safeguard controlled)
  if (!settings.robots_index) {
    return `# ZMW Clothing - Search Crawling Disabled via Admin SEO Settings
User-agent: *
Disallow: /
`;
  }

  const customRules = (settings.robots_custom_rules || "").trim();

  return `# ZMW Clothing Robots Configuration
User-agent: *
Allow: /
${customRules ? `${customRules}\n` : `Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /profile
Disallow: /my-orders
Disallow: /forgot-password
Disallow: /reset-password
`}
Sitemap: ${baseUrl}/sitemap.xml
`;
}

/**
 * Syncs generated sitemap.xml and robots.txt to Frontend/public/ if directory exists.
 */
async function syncStaticFiles() {
  try {
    if (fs.existsSync(FRONTEND_PUBLIC_DIR)) {
      const sitemap = await generateSitemapXml();
      const robots = await generateRobotsTxt();

      fs.writeFileSync(path.join(FRONTEND_PUBLIC_DIR, "sitemap.xml"), sitemap, "utf8");
      fs.writeFileSync(path.join(FRONTEND_PUBLIC_DIR, "robots.txt"), robots, "utf8");
    }
  } catch (err) {
    console.warn("Notice: could not write static sitemap/robots to Frontend/public:", err.message);
  }
}

// ── Controller Handlers ──────────────────────────────────────────────────

async function getSettings(req, res) {
  const settings = await getOrInitSettings();
  return sendSuccess(res, { data: settings });
}

async function updateSettings(req, res) {
  const settings = await getOrInitSettings();
  const body = req.body;

  // Safeguard against accidentally blocking production search engine indexing
  if (body.robots_index === false || body.robots_index === "false") {
    if (!body.confirm_block_robots && !body.confirmBlockRobots) {
      throw ApiError.badRequest(
        "Safeguard Warning: You are about to block all search engine crawlers from indexing this website. " +
          "Please check 'I confirm blocking all search engines' to apply this change."
      );
    }
  }

  const allowedFields = [
    "default_meta_title",
    "default_meta_description",
    "default_meta_keywords",
    "homepage_title",
    "homepage_description",
    "product_title_format",
    "product_description_format",
    "category_title_format",
    "category_description_format",
    "canonical_base_url",
    "og_title",
    "og_description",
    "og_image_url",
    "robots_index",
    "robots_follow",
    "robots_custom_rules",
    "organization_name",
    "organization_telephone",
    "organization_email"
  ];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      settings[field] = body[field];
    }
  });

  // Handle camelCase aliases
  if (body.defaultMetaTitle !== undefined) settings.default_meta_title = body.defaultMetaTitle;
  if (body.defaultMetaDescription !== undefined) settings.default_meta_description = body.defaultMetaDescription;
  if (body.defaultMetaKeywords !== undefined) settings.default_meta_keywords = body.defaultMetaKeywords;
  if (body.homepageTitle !== undefined) settings.homepage_title = body.homepageTitle;
  if (body.homepageDescription !== undefined) settings.homepage_description = body.homepageDescription;
  if (body.productTitleFormat !== undefined) settings.product_title_format = body.productTitleFormat;
  if (body.productDescriptionFormat !== undefined) settings.product_description_format = body.productDescriptionFormat;
  if (body.categoryTitleFormat !== undefined) settings.category_title_format = body.categoryTitleFormat;
  if (body.categoryDescriptionFormat !== undefined) settings.category_description_format = body.categoryDescriptionFormat;
  if (body.canonicalBaseUrl !== undefined) settings.canonical_base_url = body.canonicalBaseUrl;
  if (body.ogTitle !== undefined) settings.og_title = body.ogTitle;
  if (body.ogDescription !== undefined) settings.og_description = body.ogDescription;
  if (body.ogImageUrl !== undefined) settings.og_image_url = body.ogImageUrl;
  if (body.robotsIndex !== undefined) settings.robots_index = Boolean(body.robotsIndex);
  if (body.robotsFollow !== undefined) settings.robots_follow = Boolean(body.robotsFollow);
  if (body.robotsCustomRules !== undefined) settings.robots_custom_rules = body.robotsCustomRules;
  if (body.organizationName !== undefined) settings.organization_name = body.organizationName;
  if (body.organizationTelephone !== undefined) settings.organization_telephone = body.organizationTelephone;
  if (body.organizationEmail !== undefined) settings.organization_email = body.organizationEmail;

  await settings.save();

  // Sync the updated XML sitemap and robots.txt files immediately
  await syncStaticFiles();

  return sendSuccess(res, { message: "SEO settings saved successfully", data: settings });
}

async function getSitemapXml(req, res) {
  const customFile = path.join(FRONTEND_PUBLIC_DIR, "sitemap.xml");
  let xml;
  if (fs.existsSync(customFile)) {
    try {
      xml = fs.readFileSync(customFile, "utf8");
    } catch {
      xml = await generateSitemapXml();
    }
  } else {
    xml = await generateSitemapXml();
  }
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour cache
  return res.send(xml);
}

async function getRobotsTxt(req, res) {
  const customFile = path.join(FRONTEND_PUBLIC_DIR, "robots.txt");
  let robots;
  if (fs.existsSync(customFile)) {
    try {
      robots = fs.readFileSync(customFile, "utf8");
    } catch {
      robots = await generateRobotsTxt();
    }
  } else {
    robots = await generateRobotsTxt();
  }
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.send(robots);
}

// ── Centralized Page Meta Settings (House of KNP Reference) ──────────────

async function listPageMeta(req, res) {
  const { page = 1, limit = 50, type, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where = {};

  if (type && type !== "all") {
    where.page_type = type;
  }

  if (search && String(search).trim()) {
    const q = `%${String(search).trim()}%`;
    where[Op.or] = [
      { page_name: { [Op.like]: q } },
      { page_slug: { [Op.like]: q } },
      { meta_title: { [Op.like]: q } },
      { meta_keywords: { [Op.like]: q } }
    ];
  }

  const { count, rows } = await PageMetaSetting.findAndCountAll({
    where,
    order: [
      [
        sequelize.literal(
          "CASE page_type WHEN 'system' THEN 1 WHEN 'category' THEN 2 WHEN 'product' THEN 3 ELSE 4 END"
        ),
        "ASC"
      ],
      ["page_name", "ASC"]
    ],
    limit: Number(limit),
    offset
  });

  const typeCounts = {
    all: await PageMetaSetting.count(),
    system: await PageMetaSetting.count({ where: { page_type: "system" } }),
    category: await PageMetaSetting.count({ where: { page_type: "category" } }),
    product: await PageMetaSetting.count({ where: { page_type: "product" } }),
    custom: await PageMetaSetting.count({ where: { page_type: "custom" } })
  };

  return sendSuccess(res, {
    data: rows,
    meta: {
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)) || 1,
      typeCounts
    }
  });
}

async function getPageOptions(req, res) {
  const pages = await PageMetaSetting.findAll({
    attributes: ["id", "page_name", "page_type", "page_slug", "entity_id", "meta_title", "meta_description", "meta_keywords", "canonical_url", "og_image_url"],
    order: [
      [
        sequelize.literal(
          "CASE page_type WHEN 'system' THEN 1 WHEN 'category' THEN 2 WHEN 'product' THEN 3 ELSE 4 END"
        ),
        "ASC"
      ],
      ["page_name", "ASC"]
    ]
  });

  return sendSuccess(res, { data: pages });
}

async function getPageMeta(req, res) {
  const { id } = req.params;
  const pageMeta = await PageMetaSetting.findByPk(id);
  if (!pageMeta) {
    throw ApiError.notFound("Page meta setting not found");
  }
  return sendSuccess(res, { data: pageMeta });
}

async function savePageMeta(req, res) {
  const {
    id,
    page_name,
    page_type = "custom",
    page_slug,
    meta_title,
    meta_description,
    meta_keywords,
    canonical_url,
    og_image_url,
    entity_id,
    is_active = true
  } = req.body;

  if (!page_name || !page_slug) {
    throw ApiError.badRequest("Page name and slug are required");
  }

  // Normalize slug to always have leading slash
  const normalizedSlug = page_slug.startsWith("/") ? page_slug : `/${page_slug}`;

  let record;
  if (id) {
    record = await PageMetaSetting.findByPk(id);
    if (!record) {
      throw ApiError.notFound("Page meta setting not found");
    }
    await record.update({
      page_name,
      page_type,
      page_slug: normalizedSlug,
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      meta_keywords: meta_keywords || null,
      canonical_url: canonical_url || null,
      og_image_url: og_image_url || null,
      entity_id: entity_id || null,
      is_active: is_active !== false
    });
  } else {
    // Check if slug exists
    const existing = await PageMetaSetting.findOne({ where: { page_slug: normalizedSlug } });
    if (existing) {
      record = existing;
      await record.update({
        page_name,
        page_type,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        meta_keywords: meta_keywords || null,
        canonical_url: canonical_url || null,
        og_image_url: og_image_url || null,
        entity_id: entity_id || null,
        is_active: is_active !== false
      });
    } else {
      record = await PageMetaSetting.create({
        page_name,
        page_type,
        page_slug: normalizedSlug,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        meta_keywords: meta_keywords || null,
        canonical_url: canonical_url || null,
        og_image_url: og_image_url || null,
        entity_id: entity_id || null,
        is_active: is_active !== false
      });
    }
  }

  // Bi-directional sync with Category or Product or SeoSetting
  try {
    if (record.page_type === "category" && record.entity_id) {
      const cat = await Category.findByPk(record.entity_id);
      if (cat) {
        await cat.update({
          meta_title: record.meta_title,
          meta_description: record.meta_description,
          meta_keywords: record.meta_keywords,
          canonical_url: record.canonical_url
        });
      }
    } else if (record.page_type === "product" && record.entity_id) {
      const prod = await Product.findByPk(record.entity_id);
      if (prod) {
        await prod.update({
          meta_title: record.meta_title,
          meta_description: record.meta_description,
          meta_keywords: record.meta_keywords,
          canonical_url: record.canonical_url
        });
      }
    } else if (record.page_slug === "/" || (record.page_name && record.page_name.toLowerCase().includes("home"))) {
      const seoSetting = await getOrInitSettings();
      if (meta_title) seoSetting.homepage_title = meta_title;
      if (meta_description) seoSetting.homepage_description = meta_description;
      if (og_image_url) seoSetting.og_image_url = og_image_url;
      await seoSetting.save();
    }
  } catch (syncErr) {
    console.warn("Notice: bi-directional sync error:", syncErr.message);
  }

  await syncStaticFiles();

  return sendSuccess(res, {
    message: "Page meta settings saved successfully",
    data: record
  });
}

async function deletePageMeta(req, res) {
  const { id } = req.params;
  const record = await PageMetaSetting.findByPk(id);
  if (!record) {
    throw ApiError.notFound("Page meta setting not found");
  }

  // If system page, do not delete row, just reset metadata
  if (record.page_type === "system") {
    await record.update({
      meta_title: null,
      meta_description: null,
      meta_keywords: null,
      canonical_url: null,
      og_image_url: null
    });
    return sendSuccess(res, { message: "System page metadata reset successfully" });
  }

  await record.destroy();
  await syncStaticFiles();
  return sendSuccess(res, { message: "Page meta setting removed successfully" });
}

async function getSitemapSummary(req, res) {
  const settings = await getOrInitSettings();
  const baseUrl = cleanUrl(settings.canonical_base_url);
  const today = formatDate();

  // Static informational and policy pages
  const staticUrls = [
    { loc: `${baseUrl}/`, path: "/", priority: "1.0", changefreq: "daily", type: "system", name: "Home Page" },
    { loc: `${baseUrl}/about`, path: "/about", priority: "0.7", changefreq: "monthly", type: "system", name: "About Us" },
    { loc: `${baseUrl}/contact`, path: "/contact", priority: "0.7", changefreq: "monthly", type: "system", name: "Contact Us" },
    { loc: `${baseUrl}/faq`, path: "/faq", priority: "0.6", changefreq: "monthly", type: "system", name: "FAQ" },
    { loc: `${baseUrl}/size-guide`, path: "/size-guide", priority: "0.6", changefreq: "monthly", type: "system", name: "Size Guide" },
    { loc: `${baseUrl}/shipping-policy`, path: "/shipping-policy", priority: "0.5", changefreq: "monthly", type: "system", name: "Shipping Policy" },
    { loc: `${baseUrl}/return-refund-policy`, path: "/return-refund-policy", priority: "0.5", changefreq: "monthly", type: "system", name: "Return & Refund Policy" },
    { loc: `${baseUrl}/terms-conditions`, path: "/terms-conditions", priority: "0.4", changefreq: "monthly", type: "system", name: "Terms & Conditions" },
    { loc: `${baseUrl}/privacy-policy`, path: "/privacy-policy", priority: "0.4", changefreq: "monthly", type: "system", name: "Privacy Policy" }
  ].map((u) => ({ ...u, lastmod: today }));

  const categories = await Category.findAll({
    where: { is_active: true },
    attributes: ["id", "name", "slug", "updated_at"]
  });

  const categoryUrls = categories.map((cat) => ({
    name: `Category: ${cat.name}`,
    type: "category",
    path: `/categories/${cat.slug}`,
    loc: `${baseUrl}/categories/${cat.slug}`,
    priority: "0.9",
    changefreq: "daily",
    lastmod: formatDate(cat.updated_at)
  }));

  const products = await Product.findAll({
    where: { is_active: true },
    attributes: ["id", "name", "slug", "updated_at", "created_at"]
  });

  const productUrls = products.map((prod) => ({
    name: `Product: ${prod.name}`,
    type: "product",
    path: `/products/${prod.slug}`,
    loc: `${baseUrl}/products/${prod.slug}`,
    priority: "0.8",
    changefreq: "weekly",
    lastmod: formatDate(prod.updated_at || prod.created_at)
  }));

  const allEntries = [...staticUrls, ...categoryUrls, ...productUrls];

  return sendSuccess(res, {
    data: {
      baseUrl,
      sitemapUrl: `${baseUrl}/sitemap.xml`,
      robotsUrl: `${baseUrl}/robots.txt`,
      lastGenerated: today,
      counts: {
        total: allEntries.length,
        system: staticUrls.length,
        category: categoryUrls.length,
        product: productUrls.length
      },
      entries: allEntries
    }
  });
}

async function syncSitemap(req, res) {
  await syncStaticFiles();
  return sendSuccess(res, { message: "Sitemap and robots.txt synchronized successfully" });
}

async function uploadSitemapFile(req, res) {
  let content = "";
  if (req.file) {
    content = req.file.buffer ? req.file.buffer.toString("utf8") : fs.readFileSync(req.file.path, "utf8");
  } else if (req.body && req.body.content) {
    content = req.body.content;
  }

  if (!content || !content.trim()) {
    throw ApiError.badRequest("Please select a valid sitemap.xml file to upload");
  }

  if (!content.includes("<urlset") && !content.includes("<?xml") && !content.includes("<sitemapindex")) {
    throw ApiError.badRequest("Uploaded file does not appear to be a valid XML sitemap");
  }

  fs.mkdirSync(FRONTEND_PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(FRONTEND_PUBLIC_DIR, "sitemap.xml"), content, "utf8");

  return sendSuccess(res, {
    message: "Custom sitemap.xml uploaded and published successfully",
    data: { size: content.length, updated_at: new Date().toISOString() }
  });
}

async function uploadRobotsFile(req, res) {
  let content = "";
  if (req.file) {
    content = req.file.buffer ? req.file.buffer.toString("utf8") : fs.readFileSync(req.file.path, "utf8");
  } else if (req.body && req.body.content) {
    content = req.body.content;
  }

  if (!content || !content.trim()) {
    throw ApiError.badRequest("Please select a valid robots.txt file to upload");
  }

  fs.mkdirSync(FRONTEND_PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(FRONTEND_PUBLIC_DIR, "robots.txt"), content, "utf8");

  // Sync to DB
  try {
    const settings = await getOrInitSettings();
    settings.robots_custom_rules = content;
    await settings.save();
  } catch (err) {
    console.warn("Could not sync uploaded robots rules to DB:", err.message);
  }

  return sendSuccess(res, {
    message: "Custom robots.txt uploaded and published successfully",
    data: { size: content.length, updated_at: new Date().toISOString() }
  });
}

module.exports = {
  getSettings,
  updateSettings,
  getSitemapXml,
  getRobotsTxt,
  generateSitemapXml,
  generateRobotsTxt,
  syncStaticFiles,
  listPageMeta,
  getPageOptions,
  getPageMeta,
  savePageMeta,
  deletePageMeta,
  getSitemapSummary,
  syncSitemap,
  uploadSitemapFile,
  uploadRobotsFile
};
