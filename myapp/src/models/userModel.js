import { pool } from './db.js';

/* ── look-up by e-mail ─────────────────────────────────────────────── */
export const findUserByEmail = async (email) => {
  if (!email) return null;
  const [rows] = await pool.query(
    `SELECT user_id,name,email,phone,
            phone_verified,email_verified
       FROM users WHERE email=? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

/* ── look-up by phone ──────────────────────────────────────────────── */
export const findUserByPhone = async (phone) => {
  if (!phone) return null;
  const [rows] = await pool.query(
    `SELECT user_id,name,email,phone,
            phone_verified,email_verified
       FROM users WHERE phone=? LIMIT 1`,
    [phone]
  );
  return rows[0] || null;
};

/* ── insert brand-new row (all flags 0) ────────────────────────────── */
export const insertUser = async (u) =>
  pool.query(
    `INSERT INTO users
       (user_id,name,email,phone,
        phone_verified,email_verified)
     VALUES (?,?,?,?,0,0)`,
    [u.user_id,u.name,u.email,u.phone]
  );

/* ── mark the verified channel OK ──────────────────────────────────── */
export const setChannelVerified = async (
  user_id, { phoneOk=0, emailOk=0, name=null, phone=null }
) =>
  pool.query(
    `UPDATE users
        SET phone_verified = phone_verified | ?,
            email_verified = email_verified | ?,
            name  = COALESCE(?,name),
            phone = COALESCE(?,phone)
      WHERE user_id = ?`,
    [phoneOk,emailOk,name,phone,user_id]
  );

/* ── store the *second* channel when it arrives ────────────────────── */
export const setMissingEmailOrPhone = async (user_id,{email,phone}) =>
  pool.query(
    `UPDATE users
        SET email = COALESCE(?,email),
            phone = COALESCE(?,phone)
      WHERE user_id = ?`,
    [email,phone,user_id]
  );

export const findUserById = async (user_id) => {
      const [rows] = await pool.query(
       `SELECT user_id,name,email,phone,
                phone_verified,email_verified,created_at
           FROM users
          WHERE user_id=? LIMIT 1`,
        [user_id]
      );
      return rows[0] || null;
    };
    