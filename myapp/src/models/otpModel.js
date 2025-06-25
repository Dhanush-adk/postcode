import { v4 as uuid } from 'uuid';
import bcrypt         from 'bcryptjs';
import { pool }       from './db.js';

const WINDOW=30*60, MAX=3;

export const upsertOtp = async ({ email, phone, channel, type, code, ttl }) => {
  const now=new Date();
  const [r]=await pool.query(
    `SELECT otp_id,attempts,window_end
       FROM otps WHERE (email=? OR phone=?) AND channel=? AND type=? LIMIT 1`,
    [email,phone,channel,type]
  );
  if(!r.length||now>r[0].window_end){
    await pool.query(
      `REPLACE INTO otps
         (otp_id,email,phone,channel,type,code_hash,attempts,window_end,expires_at)
       VALUES (?,?,?,?,?,?,1,DATE_ADD(NOW(),INTERVAL ? SECOND),
                       DATE_ADD(NOW(),INTERVAL ? SECOND))`,
      [uuid(),email,phone,channel,type,await bcrypt.hash(code,10),WINDOW,ttl]
    );
    return {ok:true,remaining:MAX-1};
  }
  if(r[0].attempts>=MAX){
    return {ok:false,retryAfter:Math.floor((r[0].window_end-now)/1000)};
  }
  await pool.query(
    `UPDATE otps SET attempts=attempts+1,
                     code_hash=?,
                     expires_at=DATE_ADD(NOW(),INTERVAL ? SECOND)
      WHERE otp_id=?`,
    [await bcrypt.hash(code,10),ttl,r[0].otp_id]
  );
  return {ok:true,remaining:MAX-(r[0].attempts+1)};
};

export const fetchOtp = async ({ email, phone, channel, type}) => {
  const [r] = await pool.query(
    `SELECT otp_id,code_hash,expires_at
       FROM otps WHERE (email=? OR phone=?) AND channel=? AND type=? LIMIT 1`,
    [email,phone,channel,type]
  );
  return r[0]||null;
};

export const deleteOtp = otp_id =>
  pool.query('DELETE FROM otps WHERE otp_id=?',[otp_id]);
