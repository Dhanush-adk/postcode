import jwt from 'jsonwebtoken';
import { pool } from '../models/db.js';
import { touch } from '../services/sessionService.js';   //  ← add this
import { AppError } from '../utils/AppError.js';

/**
 * Auth-guard for protected routes.
 * • Verifies JWT signature & expiry
 * • Confirms session row is still active *and* matches the token
 * • Updates last_seen for analytics / idle-purge
 */
export const authMiddleware = async (req, _res, next) => {
  const raw = req.header('Authorization')?.split(' ')[1];
  if (!raw) return next(new AppError('Missing token', 401));

  try {
    // 1) signature & expiry
    const payload = jwt.verify(raw, process.env.JWT_SECRET);

    // 2) row must be active *and* store the same JWT
    const [rows] = await pool.query(
      `SELECT is_active FROM user_sessions
        WHERE session_id=? AND jwt=? LIMIT 1`,
      [payload.session_id, raw]
    );
    if (!rows.length || !rows[0].is_active) {
      throw new Error('inactive');
    }

    // 3) mark activity
    await touch(payload.session_id);          // updates last_seen = NOW()

    // 4) expose identity downstream
    req.user       = { user_id: payload.user_id };
    req.session_id = payload.session_id;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};
