const errorMiddleware = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || null;

  console.error(`[Error ${status}] ${message}`, err);

  res.status(status).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'dev' && { details, stack: err.stack }),
  });
};

class AppError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorMiddleware,
  AppError,
};
