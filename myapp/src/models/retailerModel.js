import { pool } from './db.js';

/* ── look-up by e-mail ─────────────────────────────────────────────── */
export const findRetailerByEmail = async (email) => {
  if (!email) return null;
  const [rows] = await pool.query(
    `SELECT retailer_id,name,type,email,phone_num
       FROM retailer WHERE email=? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

/* ── look-up by phone ──────────────────────────────────────────────── */
export const findRetailerByPhone = async (phone) => {
  if (!phone) return null;
  const [rows] = await pool.query(
    `SELECT retailer_id,name,type,email,phone_num
       FROM retailer WHERE phone_num=? LIMIT 1`,
    [phone]
  );
  return rows[0] || null;
};