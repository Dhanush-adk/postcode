import { v4 as uuid } from 'uuid';
import bcrypt          from 'bcryptjs';
import { pool }        from '../models/db.js';
import { sendSMS }     from '../utils/smsSender.js';
import { sendEmail }   from '../utils/mailer.js';
import { AppError }    from '../utils/AppError.js';
import { logger }      from '../utils/logger.js';

export const generateAndSend = async ({ email, phone, purpose }) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hash = await bcrypt.hash(code, 10);
  const otp_id = uuid();
  const exp = new Date(Date.now() + 10 * 60_000);

  await pool.query(
    `INSERT INTO otps (otp_id,email,code_hash,purpose,expires_at)
     VALUES (?,?,?,?,?)`,
    [otp_id, email, hash, purpose, exp]
  );

  const msg = `Your TrendRush OTP is ${code}`;
  if (purpose === 'phone') {
    await sendSMS(phone, msg);
  } else {
    await sendEmail(email, 'TrendRush OTP', msg);
  }
  logger.info('OTP generated', { email, purpose });
};

export const validate = async (email, code, purpose) => {
  const [rows] = await pool.query(
    `SELECT otp_id,code_hash,expires_at
       FROM otps
      WHERE email=? AND purpose=? ORDER BY created_at DESC LIMIT 1`,
    [email, purpose]
  );
  if (!rows.length) throw new AppError('OTP not found', 400);
  const { otp_id, code_hash, expires_at } = rows[0];
  if (expires_at < new Date()) throw new AppError('OTP expired', 400);
  const ok = await bcrypt.compare(code, code_hash);
  if (!ok) throw new AppError('Invalid OTP', 400);
  await pool.query('DELETE FROM otps WHERE otp_id=?', [otp_id]);
};
