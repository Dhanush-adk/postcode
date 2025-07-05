import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { buildResponse } from '../utils/validators.js';

const LI_KEY = process.env.LI_KEY;                     // LocationIQ token

export const geocode = async (query) => {
  const url =
    `https://us1.locationiq.com/v1/search?key=${LI_KEY}` +
    `&q=${encodeURIComponent(query)}&format=json&limit=1`;

  const json = await fetch(url).then(r => r.json());
  const first = json[0];
  if (!first) throw buildResponse(400, 'Address not found');

  logger.debug('Geocode hit', { query, lat:first.lat, lon:first.lon });
  return { lat: Number(first.lat), lng: Number(first.lon) };
};
