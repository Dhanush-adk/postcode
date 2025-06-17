import { v4 as uuid } from 'uuid';
import jwt            from 'jsonwebtoken';
import { pool }       from '../models/db.js';
import { AppError }   from '../utils/AppError.js';
import bcrypt from 'bcryptjs';

const ACCESS='15m', REFRESH=7*24*60*60; // 7 days secs

export const createSession = async (user_id) => {
  const sid = uuid();
  const refreshRaw = uuid() + '.' + uuid();            // value sent to client
  const refreshHash = await bcrypt.hash(refreshRaw, 10);

  const jwtTok = jwt.sign({ user_id, session_id: sid },
               process.env.JWT_SECRET, { expiresIn: ACCESS });

  await pool.query(
    `INSERT INTO user_sessions
       (session_id,user_id,refresh_token_hash,jwt,expires_at)
     VALUES (?,?,?,?, DATE_ADD(NOW(),INTERVAL ? SECOND))`,
    [sid, user_id, refreshHash, jwtTok, REFRESH]
  );

  return { accessToken: jwtTok, refreshToken: refreshRaw, sessionId: sid };
};

/* — refresh — */
export const refresh = async (oldJwt, refreshRaw) => {
  const payload = jwt.verify(oldJwt, process.env.JWT_SECRET, { ignoreExpiration: true });

  const [rows] = await pool.query(
    `SELECT refresh_token_hash,is_active
       FROM user_sessions WHERE session_id=? LIMIT 1`,
    [payload.session_id]
  );
  if (!rows.length || !rows[0].is_active) throw new AppError('Session not active', 401);

  const ok = await bcrypt.compare(refreshRaw, rows[0].refresh_token_hash);
  if (!ok) throw new AppError('Invalid refresh token', 401);

  const newJwt = jwt.sign(
    { user_id: payload.user_id, session_id: payload.session_id },
    process.env.JWT_SECRET, { expiresIn: ACCESS }
  );

  await pool.query(
    'UPDATE user_sessions SET jwt=?, last_seen=NOW() WHERE session_id=?',
    [newJwt, payload.session_id]
  );

  return newJwt;
};

export const invalidate = session_id =>
  pool.query('UPDATE user_sessions SET is_active=0 WHERE session_id=?',[session_id]);

export const touch = (session_id) =>
  pool.query('UPDATE user_sessions SET last_seen=NOW() WHERE session_id=?', [session_id]);
