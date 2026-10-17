const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require("sequelize");
const { randomUUID } = require("crypto");
const ApiError = require("../utils/ApiError");

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Normalizes anything thrown/rejected in a route into an ApiError so the
// final handler below only has one shape to deal with.
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields || {});
    return ApiError.conflict(
      fields.length ? `${fields.join(", ")} already in use` : "Duplicate value",
      err.errors?.map((e) => ({ field: e.path, message: e.message }))
    );
  }

  if (err instanceof ForeignKeyConstraintError) {
    return ApiError.badRequest("This action references a record that does not exist or is still in use");
  }

  if (err instanceof ValidationError) {
    return ApiError.badRequest(
      "Validation failed",
      err.errors?.map((e) => ({ field: e.path, message: e.message }))
    );
  }

  if (err.name === "JsonWebTokenError") return ApiError.unauthorized("Invalid authentication token");
  if (err.name === "TokenExpiredError") return ApiError.unauthorized("Session expired, please sign in again");

  if (err.type === "entity.too.large") return ApiError.badRequest("Request payload too large");
  if (err.code === "LIMIT_FILE_SIZE") return ApiError.badRequest("Uploaded file is too large");
  if (err.code === "LIMIT_UNEXPECTED_FILE") return ApiError.badRequest("Unexpected file field");

  const databaseCode = err.original?.code || err.parent?.code;
  if (["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "PROTOCOL_CONNECTION_LOST", "ER_DBACCESS_DENIED_ERROR", "ER_ACCESS_DENIED_ERROR"].includes(databaseCode)) {
    return new ApiError(503, "Database is temporarily unavailable. Please try again.", "SERVICE_UNAVAILABLE");
  }

  // Common database connection failures are operational: the caller can retry,
  // and the UI should receive a useful service message rather than a generic 500.
  if (["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "PROTOCOL_CONNECTION_LOST", "ER_DBACCESS_DENIED_ERROR", "ER_ACCESS_DENIED_ERROR"].includes(err.code || databaseCode)) {
    return new ApiError(503, "Database is temporarily unavailable. Please try again.", "SERVICE_UNAVAILABLE");
  }

  return null;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const apiError = normalizeError(err) || err;
  const statusCode = apiError.statusCode || 500;
  const isOperational = apiError.isOperational === true;

  if (!isOperational) {
    // Unexpected/programmer error — log the full thing server-side, never
    // leak internals (stack traces, SQL, file paths) to the client.
    // eslint-disable-next-line no-console
    const requestId = req.requestId || randomUUID();
    console.error(`[UNHANDLED ERROR ${requestId}] ${req.method} ${req.originalUrl}`, err);
    res.status(statusCode).json({
      success: false,
      error: {
        code: apiError.code || "INTERNAL_ERROR",
        message: `An unexpected server error occurred. Reference: ${requestId}`,
        requestId
      }
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: apiError.code || "INTERNAL_ERROR",
      message: isOperational ? apiError.message : "An unexpected server error occurred. Please try again or contact support if it continues.",
      details: isOperational ? apiError.details || undefined : undefined
    }
  });
}

module.exports = { notFoundHandler, errorHandler };
