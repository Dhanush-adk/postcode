import { pool } from './db.js';

/* ── look-up by e-mail ─────────────────────────────────────────────── */
export const findStoreByEmail = async (email) => {
  if (!email) return null;
  const [rows] = await pool.query(
    `SELECT store_id,name,type,email,contact
       FROM stores WHERE email=? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

/* ── look-up by phone ──────────────────────────────────────────────── */
export const findStoreByPhone = async (phone) => {
  if (!phone) return null;
  const [rows] = await pool.query(
    `SELECT store_id,name,type,email,contact
       FROM stores WHERE contact=? LIMIT 1`,
    [phone]
  );
  return rows[0] || null;
};