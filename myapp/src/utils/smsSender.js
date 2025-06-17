import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
dotenv.config();

let twilioClient=null;
if(process.env.APP_ENV!=='dev'){
  const twilio=await import('twilio');
  twilioClient=twilio.default(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

export const sendSMS = async (to,msg) => {
  if(process.env.APP_ENV==='dev'){
    logger.info(`[dev] SMS skipped → ${to} → ${msg}`);
    return;
  }
  await twilioClient.messages.create({
    from:process.env.TWILIO_FROM,
    to,
    body:msg
  });
  logger.info('✅ SMS sent',{to});
};
