import * as authService from '../services/authService.js';
import * as sessSvc     from '../services/sessionService.js';

import {
  isValidPhone,
  isValidEmail,
  buildResponse
} from '../utils/validators.js';

/* ─────────────── INITIATE ─────────────────────────────── */

export const initiate = async (req, res, next) => {
  try {
    const { email = null, phone = null, name = null, type = 'Customer'} = req.body;

    /* basic validation */
    const errors = [];
    if (!email && !phone)
      errors.push({ field: 'phone', message: 'Either phone or email required' });
    if (phone && !isValidPhone(phone))
      errors.push({ field: 'phone', message: 'Must include country code and 10 digits' });
    if (email && !isValidEmail(email))
      errors.push({ field: 'email', message: 'Invalid e-mail format' });

    if (errors.length)
      return res
        .status(400)
        .json(buildResponse(400, 'Validation failed', { errors }));

    const result = await authService.initiate({ email, phone, name, type});
    res.status(result.status).json(result.body);
  } catch (err) { next(err); }
};

/* ─────────────── VERIFY ──────────────────────────────── */

export const verify = async (req, res, next) => {
  try {
    const { email = null, phone = null, code = null, name = null, type = 'Customer'} = req.body;

    /* same validation (plus code) */
    const errors = [];
    if (!email && !phone)
      errors.push({ field: 'phone', message: 'Either phone or email required' });
    if (phone && !isValidPhone(phone))
      errors.push({ field: 'phone', message: 'Must include country code and 10 digits' });
    if (email && !isValidEmail(email))
      errors.push({ field: 'email', message: 'Invalid e-mail format' });
    if (!code)
      errors.push({ field: 'code', message: 'OTP code is required' });

    if (errors.length)
      return res
        .status(400)
        .json(buildResponse(400, 'Validation failed', { errors }));

    const result = await authService.verify({ email, phone, code, name, type});
    res.status(result.status).json(result.body);
  } catch (err) { next(err); }
};

/* ─────────────── REFRESH / CLOSE ─────────────────────── */

export const refreshToken = async (req, res, next) => {
  try {
    const newJwt = await sessSvc.refresh(
      req.header('Authorization')?.split(' ')[1],
      req.body.refreshToken
    );
    res.json({ accessToken: newJwt });
  } catch (err) { next(err); }
};

export const closeSession = async (req, res, next) => {
  try {
    await sessSvc.invalidate(req.session_id);
    res.json({ message: 'logged out' });
  } catch (err) { next(err); }
};
