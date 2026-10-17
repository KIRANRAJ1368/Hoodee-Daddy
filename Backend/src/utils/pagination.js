const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 500;

/**
 * Reads page/limit from a parsed query object and returns Sequelize-ready
 * { limit, offset } plus the normalized page/limit for building meta.
 */
function getPagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit, offset: (page - 1) * limit };
}

function buildMeta({ page, limit, count }) {
  return {
    page,
    limit,
    total: count,
    totalPages: Math.max(1, Math.ceil(count / limit))
  };
}

module.exports = { getPagination, buildMeta, DEFAULT_LIMIT, MAX_LIMIT };
