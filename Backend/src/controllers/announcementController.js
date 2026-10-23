const { Announcement } = require("../models");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

const DEFAULT_BG_COLOR = "#DC2626";
const DEFAULT_TEXT_COLOR = "#FFFFFF";

/**
 * Public: Get active announcement for storefront top navbar
 */
async function getActive(req, res) {
  const announcement = await Announcement.findOne({
    where: { is_active: true },
    order: [["id", "DESC"]]
  });

  return sendSuccess(res, {
    data: {
      activeAnnouncement: announcement || null,
      announcements: announcement ? [announcement] : []
    }
  });
}

/**
 * Admin: List announcement(s)
 */
async function list(req, res) {
  const announcements = await Announcement.findAll({
    order: [["id", "DESC"]]
  });

  return sendSuccess(res, { data: announcements });
}

/**
 * Admin: Create or update the single announcement
 */
async function create(req, res) {
  const { message, link_url, is_active } = req.body;

  if (!message || !message.trim()) {
    throw ApiError.badRequest("Announcement message is required");
  }

  // Enforce single announcement policy: update if exists, otherwise create
  let announcement = await Announcement.findOne({ order: [["id", "ASC"]] });

  if (announcement) {
    announcement.message = message.trim();
    announcement.link_url = link_url ? link_url.trim() : null;
    announcement.bg_color = DEFAULT_BG_COLOR;
    announcement.text_color = DEFAULT_TEXT_COLOR;
    announcement.sort_order = 0;
    if (is_active !== undefined) announcement.is_active = Boolean(is_active);
    await announcement.save();
    return sendSuccess(res, { statusCode: 200, data: announcement });
  }

  announcement = await Announcement.create({
    message: message.trim(),
    link_url: link_url ? link_url.trim() : null,
    bg_color: DEFAULT_BG_COLOR,
    text_color: DEFAULT_TEXT_COLOR,
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    sort_order: 0
  });

  return sendSuccess(res, { statusCode: 201, data: announcement });
}

/**
 * Admin: Update announcement
 */
async function update(req, res) {
  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) {
    throw ApiError.notFound("Announcement not found");
  }

  const { message, link_url, is_active } = req.body;

  if (message !== undefined) {
    if (!message.trim()) throw ApiError.badRequest("Announcement message cannot be empty");
    announcement.message = message.trim();
  }
  if (link_url !== undefined) announcement.link_url = link_url ? link_url.trim() : null;
  announcement.bg_color = DEFAULT_BG_COLOR;
  announcement.text_color = DEFAULT_TEXT_COLOR;
  announcement.sort_order = 0;
  if (is_active !== undefined) announcement.is_active = Boolean(is_active);

  await announcement.save();

  return sendSuccess(res, { data: announcement });
}

/**
 * Admin: Toggle active status
 */
async function toggle(req, res) {
  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) {
    throw ApiError.notFound("Announcement not found");
  }

  announcement.is_active = !announcement.is_active;
  await announcement.save();

  return sendSuccess(res, {
    data: announcement,
    message: `Announcement ${announcement.is_active ? "enabled" : "disabled"} successfully`
  });
}

/**
 * Admin: Delete announcement
 */
async function remove(req, res) {
  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) {
    throw ApiError.notFound("Announcement not found");
  }

  await announcement.destroy();

  return sendSuccess(res, {
    statusCode: 200,
    message: "Announcement deleted successfully"
  });
}

module.exports = {
  getActive,
  list,
  create,
  update,
  toggle,
  remove
};
