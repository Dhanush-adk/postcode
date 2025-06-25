import { logger } from '../utils/logger.js';
import { buildResponse } from '../utils/validators.js';

export const errorHandler = (err, req, res, _next) => {
  const status = err.isOperational ? err.statusCode : 500;
  logger.error(err.message, { stack: err.stack });
  res.status(status).json(buildResponse(status, err.message));
};
