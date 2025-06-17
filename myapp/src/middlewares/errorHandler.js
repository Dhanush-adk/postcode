import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const status = err.isOperational ? err.statusCode : 500;
  logger.error(err.message, { stack: err.stack });
  res.status(status).json({ error: err.message });
};
