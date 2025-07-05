import * as model      from '../models/addressModel.js';
import { geocode }     from '../services/geoService.js';
import { buildResponse,
         isValidAddress } from '../utils/validators.js';

/* POST  /address */
export const createAddress = async (req, res, next) => {
  try {
    const errs = isValidAddress(req.body);
    if (errs.length)
      return res.status(400).json(buildResponse(400, 'Validation failed', { errors: errs }));

    const geo = await geocode(
      `${req.body.addressLine1} ${req.body.addressLine2 ?? ''} ${req.body.city} ${req.body.pincode}`
    );
    await model.insertAddress(req.user.user_id, { ...req.body, ...geo });
    res.status(201).json(buildResponse(201, 'Address created successfully'));
  } catch (e) { next(e); }
};

/* GET /address */
export const listAddresses = async (req, res, next) => {
  try {
    const rows = await model.listAddresses(req.user.user_id);
    res.json(buildResponse(200, 'OK', rows));
  } catch (e) { next(e); }
};

/* PATCH / PUT /address/:id */
export const updateAddress = async (req, res, next) => {
  try {
    if (req.method === 'PUT') {
      const errs = isValidAddress(req.body);
      if (errs.length)
        return res.status(400).json(buildResponse(400, 'Validation failed', { errors: errs }));
    }
    // re-geocode only if key fields changed
    let geo = {};
    if (req.body.addressLine1 || req.body.city || req.body.pincode)
      geo = await geocode(
        `${req.body.addressLine1 ?? ''} ${req.body.addressLine2 ?? ''} ${req.body.city ?? ''} ${req.body.pincode ?? ''}`
      );

    const ok = await model.updateAddress(
      req.user.user_id,
      req.params.id,
      { ...req.body, ...geo }
    );
    if (!ok)
      return res.status(404).json(buildResponse(404, 'Address not found'));

    res.json(buildResponse(200, 'Address updated successfully'));
  } catch (e) { next(e); }
};

/* DELETE /address/:id */
export const removeAddress = async (req, res, next) => {
  try {
    await model.deleteAddress(req.user.user_id, req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
};
