module.exports = function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let details;

  if (error.type === 'entity.parse.failed' || error.name === 'SyntaxError' && error.status === 400) {
    status = 400;
    message = 'Malformed JSON request body';
  } else if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid resource identifier';
  } else if (error.code === 11000) {
    status = 409;
    message = `A record with that ${Object.keys(error.keyValue || {})[0] || 'value'} already exists`;
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired authentication token';
  } else if (status >= 500) {
    message = 'Internal server error';
  }

  if (status >= 500) console.error(error);
  res.status(status).json({ error: message, ...(details ? { details } : {}) });
};
