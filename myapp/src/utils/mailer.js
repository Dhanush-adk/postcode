/* Simple SendGrid wrapper for OTP e-mails */
import sgMail from '@sendgrid/mail';
import { logger } from './logger.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmailOtp = async (to, code) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM,
    subject: 'Your TrendRushIndia verification code',
    text: `Your OTP is ${code}. It is valid for 5 minutes.`,
    html: `<p>Your OTP is <strong>${code}</strong>. It is valid for 5&nbsp;minutes.</p>`
  };
  try {
    await sgMail.send(msg);
    logger.info(`OTP e-mail sent → ${to}`);
  } catch (err) {
    logger.error('SendGrid error', { err });
    throw err;                              // bubbles to errorHandler
  }
};
