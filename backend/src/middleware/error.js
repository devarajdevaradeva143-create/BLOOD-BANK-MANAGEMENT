export function notFound(req, res, _next) {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // CORS rejection from cors origin() callback — must be 403, not 500.
  if (err && typeof err.message === 'string' && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ message: 'Forbidden: origin not allowed' });
  }
  // Mongoose validation / cast errors are client errors, not 500s.
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ message: err.message || 'Validation failed' });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path || 'id'}` });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    return res.status(409).json({ message: `${field} already exists` });
  }
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    console.error(err);
  }
  res.status(statusCode).json({ message });
}

export default errorHandler;
