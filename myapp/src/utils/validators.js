import libPhoneNumber from 'google-libphonenumber';
const { PhoneNumberUtil, PhoneNumberFormat } = libPhoneNumber;

const phoneUtil = PhoneNumberUtil.getInstance();

export const isValidPhone = (phone) => {
  try {
    const num = phoneUtil.parse(phone);           // expects “+…”
    return phoneUtil.isValidNumber(num);
  } catch {
    return false;
  }
};

/* — optional helper if you need parts later — */
export const parsePhone = (phone) => {
  try {
    const num = phoneUtil.parse(phone);
    if (!phoneUtil.isValidNumber(num)) return null;
    return {
      e164: phoneUtil.format(num, PhoneNumberFormat.E164),
      countryCode: num.getCountryCode(),
      national: phoneUtil.format(num, PhoneNumberFormat.NATIONAL)
    };
  } catch {
    return null;
  }
};

export const isValidEmail = (email) =>
  typeof email === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const buildResponse = (statusCode, message, extra = {}) => ({
  statusCode,
  statusMessage:
      statusCode < 300 ? 'OK'
    : statusCode === 400 ? 'Bad Request'
    : statusCode === 401 ? 'Unauthorized'
    : statusCode === 404 ? 'Not Found'
    : statusCode === 409 ? 'Conflict'
    : statusCode === 429 ? 'Too Many Requests'
    : 'Error',
  message,
  ...extra
});
