/*  OTP + user/session orchestration
 *  ─────────────────────────────────────────────────────────
 *  • initiate(...) – sends OTP to whichever channel is *not null*
 *  • verify(...)   – validates code, tracks dual-channel progress,
 *                    issues tokens only when BOTH channels are verified
 *  • Enforces UNIQUE e-mail / phone *before* sending OTP and again before
 *    marking the second channel verified.
 */

import { v4 as uuid }                  from 'uuid';
import bcrypt                          from 'bcryptjs';
import {
  findUserByEmail,
  findUserByPhone,
  insertUser,
  setChannelVerified,
  setMissingEmailOrPhone
} from '../models/userModel.js';
import { upsertOtp, fetchOtp, deleteOtp } from '../models/otpModel.js';
import { createSession }               from './sessionService.js';
import { sendSMS }                     from '../utils/smsSender.js';
import { logger }                      from '../utils/logger.js';
import { AppError }                    from '../utils/AppError.js';

const OTP_TTL = 5 * 60;                        // 5 min
const DEV = process.env.APP_ENV === 'dev';

/* helper — decide which channel this request addresses */
function decideChannel({ email, phone }, user) {
  if (email && phone) {
    // second round: pick the not-yet-verified one
    if (!user) return 'email';                 // brand-new row
    return user.email_verified ? 'phone' : 'email';
  }
  return phone ? 'phone' : 'email';
}

/* ───────────────────────── 1. INITIATE ─────────────────────────────── */
export const initiate = async ({ email, phone }) => {
  // const user    = await findUserByEmail(email) ?? await findUserByPhone(phone);
  const user    = phone
              ? await findUserByPhone(phone) ?? await findUserByEmail(email)
              : await findUserByEmail(email);

  const channel = decideChannel({ email, phone }, user);

  /* 1 — uniqueness guard BEFORE we send anything */
  if (channel === 'email' && email) {
    const clash = await findUserByEmail(email);
    if (clash && (!user || clash.user_id !== user.user_id)) {
      return {
        status: 409,
        body: {
          statusCode: 409,
          statusMessage: 'Conflict',
          message: 'E-mail already in use by another account'
        }
      };
    }
  }
  if (channel === 'phone' && phone) {
    const clash = await findUserByPhone(phone);
    if (clash && (!user || clash.user_id !== user.user_id)) {
      return {
        status: 409,
        body: {
          statusCode: 409,
          statusMessage: 'Conflict',
          message: 'Phone already in use by another account'
        }
      };
    }
  }

  /* 2 — rate-limit + save code */
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const rl   = await upsertOtp({ email, phone, channel, code, ttl: OTP_TTL });

  if (!rl.ok) {
    return {
      status: 429,
      body: {
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: 'OTP SENT - retry attempt exceeded',
        data: { retryAfter: rl.retryAfter, maxAttemptsReached: true }
      }
    };
  }

  /* 3 — deliver code */
  if (channel === 'phone') {
    await sendSMS(phone, `Your verification code is ${code}`);
  } else {
    DEV
      ? logger.info(`[dev] email OTP ${code} → ${email}`)
      : await sendSMS('+00000000000', `Email OTP ${code}`); // placeholder
  }

  return {
    status: 200,
    body: {
      statusCode: 200,
      statusMessage: 'OK',
      message: 'OTP SENT',
      data: {
        otpSentTo: channel === 'phone' ? phone : email,
        attemptsRemaining: rl.remaining
      }
    }
  };
};

/* ───────────────────────── 2. VERIFY ───────────────────────────────── */
export const verify = async ({ email, phone, code, name }) => {
  // const userPre = await findUserByEmail(email) ?? await findUserByPhone(phone);
  const userPre = phone
        ? await findUserByPhone(phone) ?? await findUserByEmail(email)
        : await findUserByEmail(email);

  const channel = decideChannel({ email, phone }, userPre);

  /* 1 — OTP validation */
  const otpRow = await fetchOtp({ email, phone, channel });
  if (!otpRow)                       throw new AppError('OTP not found', 400);
  console.log(otpRow.expires_at);
  console.log(new Date().toUTCString());

  if (otpRow.expires_at < new Date()) throw new AppError('OTP has expired', 400);
  if (!await bcrypt.compare(code, otpRow.code_hash))
    throw new AppError('INVALID OTP', 400);
  await deleteOtp(otpRow.otp_id);

  /* 2 — locate or create user row */
  let user = userPre;
  if (!user) {
    const user_id = uuid();
    await insertUser({ user_id, name, email, phone });
    user = await (email ? findUserByEmail(email) : findUserByPhone(phone));
  }

  /* 3 — uniqueness guard BEFORE committing the second channel */
  if (channel === 'email' && email) {
    const clash = await findUserByEmail(email);
    if (clash && clash.user_id !== user.user_id)
      throw new AppError('E-mail already in use', 409);
  }
  if (channel === 'phone' && phone) {
    const clash = await findUserByPhone(phone);
    if (clash && clash.user_id !== user.user_id)
      throw new AppError('Phone already in use', 409);
  }

  /* 4 — mark this channel verified + fill missing column */
  await setChannelVerified(
    user.user_id,
    channel === 'phone'
      ? { phoneOk: 1, name, phone }
      : { emailOk: 1, name }
  );
  await setMissingEmailOrPhone(user.user_id, { email, phone });

  /* 5 — reload to inspect flags */
  user = await findUserByEmail(email) ?? await findUserByPhone(phone);

  if (!user.phone_verified || !user.email_verified) {
    const need = user.phone_verified ? 'email' : 'phone';
    return {
      status: 206,
      body: {
        statusCode: 206,
        statusMessage: 'Partial Content',
        message: `please verify ${need}`,
        data: {
          verificationRequired: need,
          currentChannelVerified: channel
        }
      }
    };
  }

  /* 6 — all good ⇒ create session */
  const sess = await createSession(user.user_id);
  return {
    status: 200,
    body: {
      statusCode: 200,
      statusMessage: 'OK',
      message: 'Authentication successful',
      data: sess
    }
  };
};
