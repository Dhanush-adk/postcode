import { pool } from './db.js';

/* ───── INSERT ───────────────────────────────────── */
export const insertAddress = (user_id, a) =>
  pool.query(
    `INSERT INTO addresses
       (address_id,user_id,label,address_line1,address_line2,
        pincode,city,state,country,lat,lng,is_default)
     VALUES (UUID(),?,?,?,?,?,?,?,?,?,?,?)`,
    [
      user_id, a.label,
      a.addressLine1, a.addressLine2,
      a.pincode, a.city, a.state, a.country,
      a.lat, a.lng,
      a.is_default ? 1 : 0
    ]
  );

/* ───── LIST ─────────────────────────────────────── */
export const listAddresses = (user_id) =>
  pool
    .query(
      `SELECT address_id  AS id,
              label,
              address_line1 AS addressLine1,
              address_line2 AS addressLine2,
              pincode,
              city, state, country,
              lat, lng,
              is_default    AS isDefault,
              created_at,   updated_at
         FROM addresses
        WHERE user_id=? AND is_active=1
     ORDER BY is_default DESC, created_at`,
      [user_id]
    )
    .then(([rows]) => rows);

/* ───── UPDATE (PATCH / PUT) ─────────────────────── */
export const updateAddress = async (user_id, id, fields) => {
  const map = {
    label: 'label',
    addressLine1: 'address_line1',
    addressLine2: 'address_line2',
    pincode: 'pincode',
    city: 'city',
    state: 'state',
    country: 'country',
    lat: 'lat',
    lng: 'lng'
  };
  const sets = [];
  const vals = [];
  for (const k in fields)
    if (map[k] !== undefined) {
      sets.push(`${map[k]}=?`);
      vals.push(fields[k]);
    }
  if (!sets.length) return 0;
  vals.push(user_id, id);
  const [res] = await pool.query(
    `UPDATE addresses SET ${sets.join(', ')}
       WHERE user_id=? AND address_id=? AND is_active=1`,
    vals
  );
  return res.affectedRows;
};

/* ───── SOFT-DELETE ──────────────────────────────── */
export const deleteAddress = (user_id, id) =>
  pool.query(
    `UPDATE addresses
        SET is_active=0
      WHERE user_id=? AND address_id=?`,
    [user_id, id]
  );
