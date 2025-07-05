import express from 'express';
import dotenv  from 'dotenv';
import authRoutes   from './routes/authRoutes.js';
import userRoutes   from './routes/userRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use((req, _res, next) => { logger.debug(`${req.method} ${req.url}`); next(); });

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/address', addressRoutes);     
app.use(errorHandler);

export default app;
