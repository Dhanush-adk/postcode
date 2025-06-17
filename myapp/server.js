// import app from './src/app.js';
// import { logger } from './src/utils/logger.js';
// import dotenv from 'dotenv';

// dotenv.config();
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   logger.info(`API listening on http://localhost:${PORT}`);
// });

// server.js (root)
process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
import { pool } from './src/models/db.js';   // <— add this
import app from './src/app.js';
import { logger } from './src/utils/logger.js';

dotenv.config();

try {
  await pool.query('SELECT 1');
  logger.info('✅ Database ping OK');
} catch (err) {
  logger.error('❌  Database connection failed', { err });
  process.exit(1);                   // quit with a clear reason
}

logger.info('✅ sss');

// 2️⃣  Only start HTTP server if DB is fine
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`API listening on http://localhost:${PORT}`));
