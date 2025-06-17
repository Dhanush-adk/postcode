import express from 'express';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './utils/logger.js';

const app = express();
app.use(express.json());
app.use((req, _res, next) => { logger.info(`▶ ${req.method} ${req.url}`); next(); });

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use(errorHandler);

export default app;
