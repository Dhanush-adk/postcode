import { v4 as uuid } from 'uuid';
import bcrypt          from 'bcryptjs';
import {
  findUserByEmail,
  insertUser,
  setChannelVerified
} from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { logger }   from '../utils/logger.js';

/**
 * Ensure a user row exists **and** the given channel is verified.
 * channel = 'phone' | 'email'
 */
export const createVerifiedUser = async ({
  name, email, phone, channel
}) => {
  const existing = await findUserByEmail(email);

  /* — already verified on at least 1 channel — */
  if (existing && (existing.phone_verified || existing.email_verified)) {
    throw new AppError('User already exists', 409);
  }

  /* — row exists but 0/0 verified — mark this channel OK — */
  if (existing) {
    await setChannelVerified(existing.user_id, {
      phoneOk:  channel === 'phone'  ? 1 : 0,
      emailOk:  channel === 'email'  ? 1 : 0,
      name,
      phone
    });
    logger.info('User channel verified', { email, channel });
    return { ...existing, [`${channel}_verified`]: 1 };
  }

  /* — brand-new — */
  const user_id       = uuid();
  await insertUser({ user_id, name, email, phone });
  await setChannelVerified(user_id, {
    phoneOk: channel === 'phone' ? 1 : 0,
    emailOk: channel === 'email' ? 1 : 0
  });
  logger.info('User inserted + verified', { email, channel });
  return { user_id, name, email, phone,
           phone_verified: channel === 'phone' ? 1 : 0,
           email_verified: channel === 'email' ? 1 : 0 };
};

/* — fetch only if ANY channel verified — */
export const findVerified = async (email) => {
  const u = await findUserByEmail(email);
  if (!u || (!u.phone_verified && !u.email_verified)) {
    throw new AppError('Account not verified', 401);
  }
  return u;
};
